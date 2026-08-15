import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const migrateExercises = async () => {
    let sourceConnection: mongoose.Connection | null = null;
    let targetConnection: mongoose.Connection | null = null;

    try {
        const sourceUri = process.env.MONGODB_IMPORT_URI;

        if (!sourceUri) {
            throw new Error(
                "MONGODB_IMPORT_URI is not defined"
            );
        }

        /*
         * MONGODB_IMPORT_URI uses direct MongoDB shard
         * addresses and is working correctly.
         *
         * We use the same connection for the migration,
         * but explicitly select the "carepath" database.
         */
        const targetUri = sourceUri.replace(
            /\/\?(.*)$/,
            "/carepath?$1"
        );

        console.log(
            "========================================"
        );
        console.log(
            "Exercise MongoDB Migration"
        );
        console.log(
            "========================================"
        );

        // --------------------------------------------
        // Connect to import database
        // --------------------------------------------

        console.log(
            "\nConnecting to exercise/import database..."
        );

        sourceConnection =
            await mongoose
                .createConnection(sourceUri)
                .asPromise();

        console.log(
            "Import database connected."
        );

        // --------------------------------------------
        // Connect to CarePath database
        // --------------------------------------------

        console.log(
            "Connecting to CarePath database..."
        );

        targetConnection =
            await mongoose
                .createConnection(targetUri)
                .asPromise();

        console.log(
            "CarePath database connected."
        );

        // --------------------------------------------
        // Get database objects
        // --------------------------------------------

        const sourceDb = sourceConnection.db;
        const targetDb = targetConnection.db;

        if (!sourceDb) {
            throw new Error(
                "Could not access import database."
            );
        }

        if (!targetDb) {
            throw new Error(
                "Could not access CarePath database."
            );
        }

        const sourceExercises =
            sourceDb.collection("exercises");

        const targetExercises =
            targetDb.collection("exercises");

        // --------------------------------------------
        // Check source
        // --------------------------------------------

        const sourceCount =
            await sourceExercises.countDocuments();

        console.log(
            `\nExercises in import database: ${sourceCount}`
        );

        if (sourceCount === 0) {
            throw new Error(
                "Import database contains 0 exercises."
            );
        }

        // --------------------------------------------
        // Check current CarePath database
        // --------------------------------------------

        const existingCount =
            await targetExercises.countDocuments();

        console.log(
            `Exercises currently in CarePath: ${existingCount}`
        );

        // --------------------------------------------
        // Read exercises
        // --------------------------------------------

        console.log(
            "\nReading exercises from import database..."
        );

        const exercises =
            await sourceExercises
                .find({})
                .toArray();

        console.log(
            `Read ${exercises.length} exercises.`
        );

        // --------------------------------------------
        // Prepare operations
        // --------------------------------------------

        const operations = exercises
            .filter(
                (exercise) =>
                    exercise.exerciseDbId
            )
            .map((exercise) => ({
                updateOne: {
                    filter: {
                        exerciseDbId:
                            exercise.exerciseDbId,
                    },

                    update: {
                        $set: {
                            exerciseDbId:
                                exercise.exerciseDbId,

                            name:
                                exercise.name || "",

                            gifUrl:
                                exercise.gifUrl || "",

                            bodyParts:
                                exercise.bodyParts || [],

                            equipments:
                                exercise.equipments || [],

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

                    upsert: true,
                },
            }));

        console.log(
            `Prepared ${operations.length} exercises.`
        );

        // --------------------------------------------
        // Migrate in batches
        // --------------------------------------------

        const BATCH_SIZE = 500;

        let migrated = 0;

        for (
            let i = 0;
            i < operations.length;
            i += BATCH_SIZE
        ) {
            const batch =
                operations.slice(
                    i,
                    i + BATCH_SIZE
                );

            await targetExercises.bulkWrite(
                batch,
                {
                    ordered: false,
                }
            );

            migrated += batch.length;

            console.log(
                `Migrated ${migrated}/${operations.length}`
            );
        }

        // --------------------------------------------
        // Verify
        // --------------------------------------------

        const targetCount =
            await targetExercises.countDocuments();

        const bodyParts =
            await targetExercises.distinct(
                "bodyParts"
            );

        console.log(
            "\n========================================"
        );
        console.log(
            "Migration completed!"
        );
        console.log(
            "========================================"
        );

        console.log(
            `Source exercises: ${sourceCount}`
        );

        console.log(
            `CarePath exercises: ${targetCount}`
        );

        console.log(
            `Body parts: ${bodyParts.length}`
        );

        console.log(
            bodyParts
        );

        console.log(
            "========================================"
        );
    } catch (error: any) {
        console.error(
            "\nMigration failed:"
        );

        console.error(
            error.message
        );

        process.exitCode = 1;
    } finally {
        if (sourceConnection) {
            await sourceConnection.close();
        }

        if (targetConnection) {
            await targetConnection.close();
        }
    }
};

migrateExercises();