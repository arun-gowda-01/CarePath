import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validateRequest } from "../utils/validation.js";
import mongoose from "mongoose";
import { getIO } from "../socket.js";
import {
	AccessToken,
	RoomServiceClient,
} from "livekit-server-sdk";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import VideoCall from "../models/VideoCall.js";

// ============================================================
// Helpers
// ============================================================

const getLiveKitConfig = () => {
	const LIVEKIT_API_KEY =
		process.env.LIVEKIT_API_KEY;

	const LIVEKIT_API_SECRET =
		process.env.LIVEKIT_API_SECRET;

	const LIVEKIT_URL =
		process.env.LIVEKIT_URL;

	if (
		!LIVEKIT_API_KEY ||
		!LIVEKIT_API_SECRET ||
		!LIVEKIT_URL
	) {
		throw new ApiError(
			"Video calling is not configured",
			500
		);
	}

	return {
		LIVEKIT_API_KEY,
		LIVEKIT_API_SECRET,
		LIVEKIT_URL,
	};
};

// ============================================================
// Create video call room
// ============================================================

export const createCallRoom = asyncHandler(
	async (req: Request, res: Response) => {
		const { participantId } = req.body;

		validateRequest([
			{
				field: "participantId",
				value: participantId,
				rules: {
					required: true,
					type: "string",
				},
			},
		]);

		const doctorUserId = req.user?.id;

		if (!doctorUserId) {
			throw new ApiError(
				"Unauthorized",
				401
			);
		}

		if (
			req.user?.role !== "doctor"
		) {
			throw new ApiError(
				"Only doctors can initiate video calls",
				403
			);
		}

		if (
			!mongoose.Types.ObjectId.isValid(
				doctorUserId
			) ||
			!mongoose.Types.ObjectId.isValid(
				participantId
			)
		) {
			throw new ApiError(
				"Invalid user ID",
				400
			);
		}

		const {
			LIVEKIT_API_KEY,
			LIVEKIT_API_SECRET,
			LIVEKIT_URL,
		} = getLiveKitConfig();

		// --------------------------------------------------------
		// Find doctor and patient
		// --------------------------------------------------------

		const [doctor, patient] =
			await Promise.all([
				Doctor.findOne({
					userId: doctorUserId,
				}),

				Patient.findOne({
					userId: participantId,
				}),
			]);

		if (!doctor) {
			throw new ApiError(
				"Doctor profile not found",
				404
			);
		}

		if (!patient) {
			throw new ApiError(
				"Patient profile not found",
				404
			);
		}

		// --------------------------------------------------------
		// LiveKit room service
		// --------------------------------------------------------

		const roomService =
			new RoomServiceClient(
				LIVEKIT_URL,
				LIVEKIT_API_KEY,
				LIVEKIT_API_SECRET
			);

		// --------------------------------------------------------
		// Cancel stale ringing calls
		// --------------------------------------------------------

		const staleRingingTime =
			new Date(
				Date.now() -
					5 * 60 * 1000
			);

		await VideoCall.updateMany(
			{
				doctorUserId:
					new mongoose.Types.ObjectId(
						doctorUserId
					),

				patientUserId:
					new mongoose.Types.ObjectId(
						participantId
					),

				status: "ringing",

				createdAt: {
					$lt: staleRingingTime,
				},
			},
			{
				$set: {
					status: "cancelled",
					endTime: new Date(),
					duration: 0,
				},
			}
		);

		// --------------------------------------------------------
		// Check existing connected call
		// --------------------------------------------------------

		const activeCall =
			await VideoCall.findOne({
				doctorUserId:
					new mongoose.Types.ObjectId(
						doctorUserId
					),

				patientUserId:
					new mongoose.Types.ObjectId(
						participantId
					),

				status: "connected",
			}).sort({
				createdAt: -1,
			});

		if (activeCall) {
			let liveParticipants: any[] = [];

			try {
				liveParticipants =
					await roomService.listParticipants(
						activeCall.roomId
					);
			} catch (error) {
				console.error(
					"Could not inspect existing LiveKit room:",
					error
				);

				liveParticipants = [];
			}

			const doctorStillInRoom =
				liveParticipants.some(
					(participant) =>
						participant.identity ===
						doctorUserId
				);

			const patientStillInRoom =
				liveParticipants.some(
					(participant) =>
						participant.identity ===
						participantId
				);

			// ----------------------------------------------------
			// Nobody is actually in the room
			// ----------------------------------------------------

			if (
				!doctorStillInRoom &&
				!patientStillInRoom
			) {
				activeCall.status =
					"cancelled";

				activeCall.endTime =
					new Date();

				activeCall.duration =
					activeCall.startTime
						? Math.max(
								0,
								Math.floor(
									(
										Date.now() -
										activeCall.startTime.getTime()
									) /
										1000
								)
							)
						: 0;

				await activeCall.save();

				try {
					await roomService.deleteRoom(
						activeCall.roomId
					);
				} catch {
					// Room may already be gone
				}
			}
			// ----------------------------------------------------
			// Participants still in room
			// ----------------------------------------------------
			else {
				throw new ApiError(
					"A video call is already connected with this patient",
					409
				);
			}
		}

		// --------------------------------------------------------
		// Check recent ringing call
		// --------------------------------------------------------

		const recentRingingCall =
			await VideoCall.findOne({
				doctorUserId:
					new mongoose.Types.ObjectId(
						doctorUserId
					),

				patientUserId:
					new mongoose.Types.ObjectId(
						participantId
					),

				status: "ringing",

				createdAt: {
					$gte: staleRingingTime,
				},
			}).sort({
				createdAt: -1,
			});

		if (recentRingingCall) {
			// Try to determine whether the old room
			// is actually still being used.
			let ringingParticipants: any[] = [];

			try {
				ringingParticipants =
					await roomService.listParticipants(
						recentRingingCall.roomId
					);
			} catch {
				ringingParticipants =
					[];
			}

			// If the old ringing room is empty,
			// cancel it and allow a new call.
			if (
				ringingParticipants.length === 0
			) {
				recentRingingCall.status =
					"cancelled";

				recentRingingCall.endTime =
					new Date();

				recentRingingCall.duration =
					0;

				await recentRingingCall.save();

				try {
					await roomService.deleteRoom(
						recentRingingCall.roomId
					);
				} catch {
					// Ignore room deletion errors
				}
			} else {
				throw new ApiError(
					"A video call is already ringing for this patient. Please wait or cancel the existing call.",
					409
				);
			}
		}

		// --------------------------------------------------------
		// Create unique LiveKit room
		// --------------------------------------------------------

		const roomId =
			`room-${doctorUserId}-${participantId}-${Date.now()}`;

		try {
			await roomService.createRoom({
				name: roomId,
				emptyTimeout: 5 * 60,
				maxParticipants: 2,
			});
		} catch (error) {
			console.error(
				"Failed to create LiveKit room:",
				error
			);

			throw new ApiError(
				"Failed to create video call room",
				500
			);
		}

		// --------------------------------------------------------
		// Save call in MongoDB
		// --------------------------------------------------------

		const videoCall =
			await VideoCall.create({
				patientId:
					patient._id,

				DoctorId:
					doctor._id,

				doctorUserId:
					new mongoose.Types.ObjectId(
						doctorUserId
					),

				patientUserId:
					new mongoose.Types.ObjectId(
						participantId
					),

				roomId,

				status: "ringing",

				callType: "video",

				startTime: undefined,
			});

		// --------------------------------------------------------
		// Generate doctor's LiveKit token
		// --------------------------------------------------------

		const doctorToken =
			new AccessToken(
				LIVEKIT_API_KEY,
				LIVEKIT_API_SECRET,
				{
					identity:
						doctorUserId.toString(),

					name:
						req.user?.name ||
						"Doctor",
				}
			);

		doctorToken.addGrant({
			roomJoin: true,
			room: roomId,
			canPublish: true,
			canSubscribe: true,
		});

		const doctorJwt =
			await doctorToken.toJwt();

		// --------------------------------------------------------
		// Notify patient
		// --------------------------------------------------------

		try {
			const io = getIO();

			io.to(
				participantId.toString()
			).emit(
				"video:incoming",
				{
					roomId,

					fromUserId:
						doctorUserId,

					fromName:
						req.user?.name ||
						"Your doctor",
				}
			);
		} catch (error) {
			console.error(
				"Failed to send incoming video call notification:",
				error
			);
		}

		return res.sendResponse({
			statusCode: 201,

			success: true,

			message:
				"Video call room created successfully",

			data: {
				roomId,

				callId:
					videoCall._id,

				participants: [
					doctorUserId,
					participantId,
				],

				token:
					doctorJwt,

				serverUrl:
					LIVEKIT_URL,
			},
		});
	}
);

// ============================================================
// Join video call
// ============================================================

export const joinCallRoom =
	asyncHandler(
		async (
			req: Request,
			res: Response
		) => {
			const { roomId } =
				req.params;

			if (!roomId) {
				throw new ApiError(
					"Room ID is required",
					400
				);
			}

			const userId =
				req.user?.id;

			if (!userId) {
				throw new ApiError(
					"Unauthorized",
					401
				);
			}

			if (
				!mongoose.Types.ObjectId.isValid(
					userId
				)
			) {
				throw new ApiError(
					"Invalid user ID",
					400
				);
			}

			const videoCall =
				await VideoCall.findOne({
					roomId,
				});

			if (!videoCall) {
				throw new ApiError(
					"Call room not found or expired",
					404
				);
			}

			// ----------------------------------------------------
			// Check participant
			// ----------------------------------------------------

			const isDoctor =
				videoCall.doctorUserId.toString() ===
				userId.toString();

			const isPatient =
				videoCall.patientUserId.toString() ===
				userId.toString();

			if (
				!isDoctor &&
				!isPatient
			) {
				throw new ApiError(
					"Not authorized to join this call",
					403
				);
			}

			// ----------------------------------------------------
			// Check status
			// ----------------------------------------------------

			if (
				videoCall.status ===
					"completed" ||
				videoCall.status ===
					"cancelled"
			) {
				throw new ApiError(
					"Call has already ended",
					410
				);
			}

			const {
				LIVEKIT_API_KEY,
				LIVEKIT_API_SECRET,
				LIVEKIT_URL,
			} = getLiveKitConfig();

			// ----------------------------------------------------
			// Patient accepts call
			// ----------------------------------------------------

			if (isPatient) {
				if (
					videoCall.status ===
					"ringing"
				) {
					videoCall.status =
						"connected";

					videoCall.startTime =
						new Date();

					await videoCall.save();

					try {
						const io =
							getIO();

						io.to(
							videoCall.doctorUserId.toString()
						).emit(
							"video:accepted",
							{
								roomId,

								userId,
							}
						);
					} catch (error) {
						console.error(
							"Failed to send video accepted event:",
							error
						);
					}
				}
			}

			// ----------------------------------------------------
			// Generate LiveKit token
			// ----------------------------------------------------

			const token =
				new AccessToken(
					LIVEKIT_API_KEY,
					LIVEKIT_API_SECRET,
					{
						identity:
							userId.toString(),

						name:
							req.user?.name ||
							"User",
					}
				);

			token.addGrant({
				roomJoin: true,
				room: roomId,
				canPublish: true,
				canSubscribe: true,
			});

			const jwt =
				await token.toJwt();

			return res.sendResponse({
				statusCode: 200,

				success: true,

				message:
					"Joined video call room successfully",

				data: {
					roomId:
						videoCall.roomId,

					participants: [
						videoCall.doctorUserId.toString(),
						videoCall.patientUserId.toString(),
					],

					status:
						videoCall.status,

					token:
						jwt,

					serverUrl:
						LIVEKIT_URL,
				},
			});
		}
	);

// ============================================================
// End video call
// ============================================================

export const endCall =
	asyncHandler(
		async (
			req: Request,
			res: Response
		) => {
			const { roomId } =
				req.params;

			const userId =
				req.user?.id;

			if (!userId) {
				throw new ApiError(
					"Unauthorized",
					401
				);
			}

			if (!roomId) {
				throw new ApiError(
					"Room ID is required",
					400
				);
			}

			const videoCall =
				await VideoCall.findOne({
					roomId,
				});

			if (!videoCall) {
				throw new ApiError(
					"Call room not found",
					404
				);
			}

			const isParticipant =
				videoCall.doctorUserId.toString() ===
					userId.toString() ||
				videoCall.patientUserId.toString() ===
					userId.toString();

			if (!isParticipant) {
				throw new ApiError(
					"Unauthorized to end this call",
					403
				);
			}

			// Already ended
			if (
				videoCall.status ===
					"completed" ||
				videoCall.status ===
					"cancelled"
			) {
				return res.sendResponse({
					statusCode: 200,

					success: true,

					message:
						"Video call already ended",

					data: {
						roomId,

						duration:
							videoCall.duration ||
							0,

						status:
							videoCall.status,
					},
				});
			}

			const previousStatus =
				videoCall.status;

			const endTime =
				new Date();

			// ----------------------------------------------------
			// Calculate duration
			// ----------------------------------------------------

			if (
				videoCall.startTime &&
				previousStatus ===
					"connected"
			) {
				videoCall.duration =
					Math.max(
						0,
						Math.floor(
							(
								endTime.getTime() -
								videoCall.startTime.getTime()
							) /
								1000
						)
					);
			} else {
				videoCall.duration =
					0;
			}

			videoCall.endTime =
				endTime;

			videoCall.status =
				previousStatus ===
					"connected"
					? "completed"
					: "cancelled";

			await videoCall.save();

			// ----------------------------------------------------
			// Notify doctor
			// ----------------------------------------------------

			try {
				const io =
					getIO();

				io.to(
					videoCall.doctorUserId.toString()
				).emit(
					"video:ended",
					{
						roomId,
					}
				);

				io.to(
					videoCall.patientUserId.toString()
				).emit(
					"video:ended",
					{
						roomId,
					}
				);
			} catch (error) {
				console.error(
					"Failed to send video ended event:",
					error
				);
			}

			// ----------------------------------------------------
			// Delete LiveKit room
			// ----------------------------------------------------

			try {
				const {
					LIVEKIT_API_KEY,
					LIVEKIT_API_SECRET,
					LIVEKIT_URL,
				} = getLiveKitConfig();

				const roomService =
					new RoomServiceClient(
						LIVEKIT_URL,
						LIVEKIT_API_KEY,
						LIVEKIT_API_SECRET
					);

				await roomService.deleteRoom(
					roomId
				);
			} catch (error) {
				console.error(
					"Failed to delete LiveKit room:",
					error
				);
			}

			return res.sendResponse({
				statusCode: 200,

				success: true,

				message:
					"Video call ended successfully",

				data: {
					roomId,

					duration:
						videoCall.duration ||
						0,

					status:
						videoCall.status,
				},
			});
		}
	);

// ============================================================
// Get call session
// ============================================================

export const getCallSession =
	asyncHandler(
		async (
			req: Request,
			res: Response
		) => {
			const { roomId } =
				req.params;

			const userId =
				req.user?.id;

			if (!userId) {
				throw new ApiError(
					"Unauthorized",
					401
				);
			}

			const videoCall =
				await VideoCall.findOne({
					roomId,
				});

			if (!videoCall) {
				throw new ApiError(
					"Call room not found",
					404
				);
			}

			const isParticipant =
				videoCall.doctorUserId.toString() ===
					userId.toString() ||
				videoCall.patientUserId.toString() ===
					userId.toString();

			if (!isParticipant) {
				throw new ApiError(
					"Unauthorized",
					403
				);
			}

			return res.sendResponse({
				statusCode: 200,

				success: true,

				message:
					"Call session retrieved successfully",

				data: {
					roomId:
						videoCall.roomId,

					participants: [
						videoCall.doctorUserId.toString(),
						videoCall.patientUserId.toString(),
					],

					status:
						videoCall.status,

					startedAt:
						videoCall.startTime,

					endedAt:
						videoCall.endTime,
				},
			});
		}
	);

// ============================================================
// Get consultation history
// ============================================================

export const getConsultationsForPatient =
	asyncHandler(
		async (
			req: Request,
			res: Response
		) => {
			const doctorUserId =
				req.user?.id;

			const { patientId } =
				req.params;

			if (!doctorUserId) {
				throw new ApiError(
					"Unauthorized",
					401
				);
			}

			if (
				!mongoose.Types.ObjectId.isValid(
					patientId
				)
			) {
				throw new ApiError(
					"Invalid patient ID",
					400
				);
			}

			const [
				doctor,
				patient,
			] = await Promise.all([
				Doctor.findOne({
					userId:
						doctorUserId,
				}),

				Patient.findById(
					patientId
				),
			]);

			if (
				!doctor ||
				!patient
			) {
				throw new ApiError(
					"Doctor or patient not found",
					404
				);
			}

			const consultations =
				await VideoCall.find({
					patientId:
						patient._id,

					DoctorId:
						doctor._id,

					status: {
						$in: [
							"completed",
							"cancelled",
						],
					},
				})
					.sort({
						startTime: -1,
					})
					.limit(50);

			return res.sendResponse({
				statusCode: 200,

				success: true,

				message:
					"Video consultations retrieved successfully",

				data: {
					consultations,
				},
			});
		}
	);