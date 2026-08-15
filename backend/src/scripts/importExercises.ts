import axios from "axios";
import dotenv from "dotenv";
import mongoose, { Schema, Model, Document } from "mongoose";
import Exercise from "../models/Exercise.js";

dotenv.config();

const EXERCISEDB_API_URL =
    "https://oss.exercisedb.dev/api/v1";

const PAGE_LIMIT = 10;
const EXPECTED_TOTAL = 1500;

// Wait between successful requests
const DELAY_BETWEEN_REQUESTS = 1500;

// Retry settings
const MAX_RETRIES = 5;
const REQUEST_TIMEOUT = 60000;

// --------------------------------------------------
// Import progress model
// --------------------------------------------------

interface IImportProgress extends Document {
    name: string;
    nextCursor: string | null;
    page: number;
    completed: boolean;
    updatedAt: Date;
}

const importProgressSchema =
    new Schema<IImportProgress>(
        {
            name: {
                type: String,
                required: true,
                unique: true,
            },

            nextCursor: {
                type: String,
                default: null,
            },

            page: {
                type: Number,
                default: 0,
            },

            completed: {
                type: Boolean,
                default: false,
            },
        },
        {
            timestamps: true,
        }
    );

const ImportProgress: Model<IImportProgress> =
    mongoose.models.ImportProgress ||
    mongoose.model<IImportProgress>(
        "ImportProgress",
        importProgressSchema
    );

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const connectImportDB = async () => {
    const mongoUri =
        process.env.MONGODB_IMPORT_URI;

    if (!mongoUri) {
        throw new Error(
            "MONGODB_IMPORT_URI is not defined in backend/.env"
        );
    }

    console.log("Connecting to MongoDB...");

    const connection = await mongoose.connect(
        mongoUri,
        {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
        }
    );

    console.log(
        `MongoDB Connected: ${connection.connection.host}`
    );

    return connection;
};

// --------------------------------------------------
// Fetch one page with retries
// --------------------------------------------------

const fetchExercisePage = async (
    url: string,
    page: number
) => {
    for (
        let attempt = 1;
        attempt <= MAX_RETRIES;
        attempt++
    ) {
        try {
            console.log(
                `Fetching ExerciseDB page ${page}...`
            );

            const response =
                await axios.get(url, {
                    timeout: REQUEST_TIMEOUT,
                });

            return response.data;
        } catch (error: any) {
            const status =
                error.response?.status;

            const isTimeout =
                error.code === "ECONNABORTED" ||
                error.code === "ETIMEDOUT";

            const isRateLimited =
                status === 429;

            console.log(
                `Request failed on attempt ${attempt}/${MAX_RETRIES}`
            );

            if (isRateLimited) {
                const retryAfter =
                    Number(
                        error.response?.data
                            ?.retry_after
                    ) || 30;

                const waitTime =
                    retryAfter * 1000;

                console.log(
                    `Rate limited. Waiting ${retryAfter} seconds...`
                );

                await sleep(waitTime);

                continue;
            }

            if (isTimeout) {
                const waitTime =
                    attempt * 5000;

                console.log(
                    `Request timed out. Waiting ${
                        waitTime / 1000
                    } seconds before retry...`
                );

                await sleep(waitTime);

                continue;
            }

            throw error;
        }
    }

    throw new Error(
        `ExerciseDB request failed after ${MAX_RETRIES} attempts`
    );
};

// --------------------------------------------------
// Main importer
// --------------------------------------------------

const importExercises = async () => {
    try {
        await connectImportDB();

        console.log(
            "\n========================================"
        );

        console.log(
            "Starting ExerciseDB import"
        );

        console.log(
            `Target: ${EXPECTED_TOTAL} exercises`
        );

        console.log(
            "========================================\n"
        );

        // --------------------------------------------------
        // Get existing MongoDB exercises
        // --------------------------------------------------

        const existingExercises =
            await Exercise.find(
                {},
                {
                    exerciseDbId: 1,
                }
            ).lean();

        const existingExerciseIds =
            new Set<string>(
                existingExercises
                    .map(
                        (exercise) =>
                            exercise.exerciseDbId
                    )
                    .filter(Boolean)
            );

        console.log(
            `Existing exercises in MongoDB: ${existingExerciseIds.size}`
        );

        // --------------------------------------------------
        // Get saved import progress
        // --------------------------------------------------

        let progress =
            await ImportProgress.findOne({
                name: "exercisedb-import",
            });

        let nextCursor: string | null =
            progress?.nextCursor || null;

        let page =
            progress?.page || 0;

        if (progress?.completed) {
            console.log(
                "\nImport was already completed."
            );

            console.log(
                `MongoDB exercises: ${existingExerciseIds.size}`
            );

            await mongoose.disconnect();

            return;
        }

        if (nextCursor) {
            console.log(
                `Resuming from saved cursor.`
            );

            console.log(
                `Last completed page: ${page}`
            );
        } else {
            console.log(
                "Starting import from page 1."
            );
        }

        // --------------------------------------------------
        // Counters
        // --------------------------------------------------

        let totalFetched = 0;
        let totalSaved = 0;

        const seenExerciseIds =
            new Set<string>(
                existingExerciseIds
            );

        const seenCursors =
            new Set<string>();

        // --------------------------------------------------
        // Pagination loop
        // --------------------------------------------------

        while (true) {
            const currentPage =
                page + 1;

            // Safety protection
            if (currentPage > 200) {
                console.log(
                    "\nSafety limit reached."
                );

                break;
            }

            // Prevent cursor loop
            if (
                nextCursor &&
                seenCursors.has(nextCursor)
            ) {
                console.log(
                    "\nRepeated cursor detected."
                );

                console.log(
                    "Stopping safely."
                );

                break;
            }

            if (nextCursor) {
                seenCursors.add(nextCursor);
            }

            // --------------------------------------------------
            // Build URL
            // --------------------------------------------------

            let url =
                `${EXERCISEDB_API_URL}/exercises?limit=${PAGE_LIMIT}`;

            if (nextCursor) {
                url +=
                    `&after=${encodeURIComponent(
                        nextCursor
                    )}`;
            }

            // --------------------------------------------------
            // Request page
            // --------------------------------------------------

            let responseData;

            try {
                responseData =
                    await fetchExercisePage(
                        url,
                        currentPage
                    );
            } catch (error: any) {
                console.error(
                    "\nCould not fetch page."
                );

                console.error(
                    error.message
                );

                console.log(
                    "\nProgress has been saved."
                );

                console.log(
                    `Last successfully completed page: ${page}`
                );

                console.log(
                    "Run the importer again to resume."
                );

                break;
            }

            const exercises =
                responseData?.data || [];

            console.log(
                `Page ${currentPage}: ${exercises.length} exercises`
            );

            // --------------------------------------------------
            // Empty page
            // --------------------------------------------------

            if (
                exercises.length === 0
            ) {
                console.log(
                    "\nEmpty page received."
                );

                console.log(
                    "Stopping importer."
                );

                break;
            }

            totalFetched +=
                exercises.length;

            let newExercisesThisPage = 0;

            // --------------------------------------------------
            // Save exercises
            // --------------------------------------------------

            for (
                const exercise of exercises
            ) {
                const exerciseId =
                    exercise.exerciseId;

                if (!exerciseId) {
                    continue;
                }

                // Already exists in MongoDB
                if (
                    existingExerciseIds.has(
                        exerciseId
                    )
                ) {
                    continue;
                }

                // Duplicate in current run
                if (
                    seenExerciseIds.has(
                        exerciseId
                    )
                ) {
                    continue;
                }

                await Exercise.updateOne(
                    {
                        exerciseDbId:
                            exerciseId,
                    },
                    {
                        $set: {
                            exerciseDbId:
                                exerciseId,

                            name:
                                exercise.name ||
                                "",

                            gifUrl:
                                exercise.gifUrl ||
                                "",

                            bodyParts:
                                exercise.bodyParts ||
                                [],

                            equipments:
                                exercise.equipments ||
                                [],

                            targetMuscles:
                                exercise.targetMuscles ||
                                [],

                            secondaryMuscles:
                                exercise.secondaryMuscles ||
                                [],

                            instructions:
                                exercise.instructions ||
                                [],
                        },
                    },
                    {
                        upsert: true,
                    }
                );

                existingExerciseIds.add(
                    exerciseId
                );

                seenExerciseIds.add(
                    exerciseId
                );

                totalSaved++;
                newExercisesThisPage++;

                console.log(
                    `Saved: ${existingExerciseIds.size}/${EXPECTED_TOTAL} - ${exercise.name}`
                );
            }

            console.log(
                `New exercises this page: ${newExercisesThisPage}`
            );

            console.log(
                `MongoDB exercises: ${existingExerciseIds.size}/${EXPECTED_TOTAL}`
            );

            // --------------------------------------------------
            // Get next cursor
            // --------------------------------------------------

            const newCursor =
                responseData?.meta
                    ?.nextCursor || null;

            const hasNextPage =
                responseData?.meta
                    ?.hasNextPage === true;

            // --------------------------------------------------
            // Save progress AFTER successful page
            // --------------------------------------------------

            if (
                hasNextPage &&
                newCursor
            ) {
                await ImportProgress.findOneAndUpdate(
                    {
                        name:
                            "exercisedb-import",
                    },
                    {
                        name:
                            "exercisedb-import",

                        nextCursor:
                            newCursor,

                        page:
                            currentPage,

                        completed:
                            false,
                    },
                    {
                        upsert: true,
                        new: true,
                    }
                );

                page =
                    currentPage;

                nextCursor =
                    newCursor;

                console.log(
                    "Progress saved."
                );

                console.log(
                    "Next page available."
                );

                await sleep(
                    DELAY_BETWEEN_REQUESTS
                );
            } else {
                // --------------------------------------------------
                // Import completed
                // --------------------------------------------------

                await ImportProgress.findOneAndUpdate(
                    {
                        name:
                            "exercisedb-import",
                    },
                    {
                        name:
                            "exercisedb-import",

                        nextCursor:
                            null,

                        page:
                            currentPage,

                        completed:
                            true,
                    },
                    {
                        upsert: true,
                        new: true,
                    }
                );

                page =
                    currentPage;

                console.log(
                    "\nExerciseDB reports no more pages."
                );

                break;
            }

            // --------------------------------------------------
            // Target reached
            // --------------------------------------------------

            if (
                existingExerciseIds.size >=
                EXPECTED_TOTAL
            ) {
                console.log(
                    "\nReached expected exercise count."
                );

                await ImportProgress.findOneAndUpdate(
                    {
                        name:
                            "exercisedb-import",
                    },
                    {
                        completed:
                            true,

                        nextCursor:
                            null,

                        page:
                            currentPage,
                    }
                );

                break;
            }
        }

        // --------------------------------------------------
        // Final MongoDB count
        // --------------------------------------------------

        const totalInMongo =
            await Exercise.countDocuments();

        const savedProgress =
            await ImportProgress.findOne({
                name:
                    "exercisedb-import",
            });

        console.log(
            "\n========================================"
        );

        console.log(
            "Exercise import status"
        );

        console.log(
            "========================================"
        );

        console.log(
            `MongoDB exercises: ${totalInMongo}`
        );

        console.log(
            `New exercises saved this run: ${totalSaved}`
        );

        console.log(
            `API exercises processed this run: ${totalFetched}`
        );

        console.log(
            `Last completed page: ${savedProgress?.page || page}`
        );

        console.log(
            `Import completed: ${
                savedProgress?.completed
                    ? "YES"
                    : "NO"
            }`
        );

        console.log(
            "========================================\n"
        );

        await mongoose.disconnect();
    } catch (error: any) {
        console.error(
            "\nExercise import failed:"
        );

        if (error.response) {
            console.error(
                "Status:",
                error.response.status
            );

            console.error(
                "Response:",
                error.response.data
            );
        } else {
            console.error(
                error.message
            );
        }

        await mongoose
            .disconnect()
            .catch(() => {});
    }
};

importExercises();