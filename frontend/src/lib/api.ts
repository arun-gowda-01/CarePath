import axios from "axios";
import type {
	LoginData,
	SubmitCheckInData,
	PaginationParams,
	CreateTaskData,
	UpdateTaskData,
	CreateNoteData,
	UpdateNoteData,
	AddPatientData,
	UpdatePatientData,
	AddDoctorData,
	UpdateDoctorData,
	AssignmentData,
	SendMessageData,
	CreateAlertData,
	UpdateAlertData,
	CreateRoomData,
	VideoCallSignal,
	AssignExerciseData,
	UpdateExerciseData,
	CreateFollowUpConsultationData,
	UpdateFollowUpConsultationData,
} from "./types";

const API_BASE_URL =
	import.meta.env.VITE_BACKEND_URL || "http://localhost:8000/api/v1";

// Create axios instance with default config
export const api = axios.create({
	baseURL: API_BASE_URL,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
	},
});

// Response interceptor for global error handling
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Redirect to login on unauthorized
			window.location.href = "/login";
		}
		return Promise.reject(error);
	}
);

// ==================== AUTH API ====================
export const authApi = {
	login: (data: LoginData) => api.post("/auth/login", data),
	logout: () => api.post("/auth/logout"),
	getCurrentUser: () => api.get("/auth/me"),
	updateProfile: (data: {
		firstName?: string;
		lastName?: string;
		email?: string;
		currentPassword?: string;
		newPassword?: string;
	}) => api.patch("/auth/profile", data),
};

// ==================== PATIENT API ====================
export const patientApi = {
	// Check-ins
	submitCheckIn: (data: SubmitCheckInData | FormData) => {
		// If data is FormData, use multipart/form-data content type
		if (data instanceof FormData) {
			return api.post("/patient/check-in", data, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});
		}
		return api.post("/patient/check-in", data);
	},
	getCheckIns: (patientId: string, params?: PaginationParams) =>
		api.get(`/patient/check-ins/${patientId}`, { params }),
	getCheckInById: (checkInId: string) =>
		api.get(`/patient/check-in/${checkInId}`),
	getRecoveryTrends: (patientId: string, days = 30) =>
		api.get(`/patient/recovery-trends/${patientId}`, { params: { days } }),

	// Tasks
	getTasks: (
		patientId: string,
		params?: PaginationParams & { status?: string }
	) => api.get(`/patient/tasks/${patientId}`, { params }),
	createTask: (data: CreateTaskData) => api.post("/patient/task", data),
	updateTask: (taskId: string, data: UpdateTaskData) =>
		api.patch(`/patient/task/${taskId}`, data),
	deleteTask: (taskId: string) => api.delete(`/patient/task/${taskId}`),
	getTaskStats: (patientId: string) =>
		api.get(`/patient/task-stats/${patientId}`),

	// Medications (Patient-specific)
	getMyMedications: () => api.get("/patient/medications"),
	markDoseAsTaken: (medicationId: string, timeOfDay: string) =>
		api.post(`/patient/medications/${medicationId}/take-dose`, {
			timeOfDay,
		}),

	// Analytics
	getAnalytics: () => api.get("/patient/analytics"),

	// Patient Details
	getPatientDetails: (patientId: string) =>
		api.get(`/doctor/patient/${patientId}`),

	// Exercises (Patient can view and update their exercises)
	getExercises: (patientId: string) =>
		api.get(`/patient/exercises/${patientId}`),
	completeExercise: (taskId: string, data: UpdateExerciseData) =>
		api.patch(`/patient/exercise/${taskId}`, data),
};

// ==================== DOCTOR API ====================
export const doctorApi = {
	// Notes
	createNote: (data: CreateNoteData) => api.post("/doctor/note", data),
	getPatientNotes: (patientId: string, params?: PaginationParams) =>
		api.get(`/doctor/notes/${patientId}`, { params }),
	getNoteById: (noteId: string) => api.get(`/doctor/note/${noteId}`),
	updateNote: (noteId: string, data: UpdateNoteData) =>
		api.patch(`/doctor/note/${noteId}`, data),
	deleteNote: (noteId: string) => api.delete(`/doctor/note/${noteId}`),

	// Tasks (Doctor can manage tasks for assigned patients)
	getTasks: (
		patientId: string,
		params?: PaginationParams & { status?: string }
	) => api.get(`/doctor/tasks/${patientId}`, { params }),
	createTask: (data: CreateTaskData) => api.post("/doctor/task", data),
	updateTask: (taskId: string, data: UpdateTaskData) =>
		api.patch(`/doctor/task/${taskId}`, data),
	deleteTask: (taskId: string) => api.delete(`/doctor/task/${taskId}`),
	getTaskStats: (patientId: string) =>
		api.get(`/doctor/task-stats/${patientId}`),

	// Patient details
	getPatientById: (patientId: string) =>
		api.get(`/doctor/patient/${patientId}`),

	// Exercises
	searchExercises: (bodyPart: string) =>
		api.get("/doctor/exercises/search", { params: { bodyPart } }),
	getBodyParts: () => api.get("/doctor/exercises/body-parts"),
	assignExercise: (data: AssignExerciseData) =>
		api.post("/doctor/exercise/assign", data),
	getPatientExercises: (patientId: string) =>
		api.get(`/doctor/exercises/${patientId}`),
	updateExercise: (taskId: string, data: UpdateExerciseData) =>
		api.patch(`/doctor/exercise/${taskId}`, data),
	deleteExercise: (taskId: string) =>
		api.delete(`/doctor/exercise/${taskId}`),
	getAllExercises: () => api.get("/doctor/exercises"),

	// Analytics
	getAnalytics: () => api.get("/doctor/analytics"),
	getPatientAdherence: (patientId: string, params?: { startDate?: string; endDate?: string }) =>
		api.get(`/doctor/adherence/${patientId}`, { params }),
	getAdherenceAnalytics: () => api.get("/doctor/adherence-analytics"),

	// Check-ins (Doctor can view patient check-ins)
	getCheckIns: (patientId: string) =>
		api.get(`/doctor/check-ins/${patientId}`),
	markCheckInAsReviewed: (checkInId: string) =>
		api.patch(`/doctor/check-in/${checkInId}/review`),
	updatePatientRiskLevel: (
		patientId: string,
		riskLevel: "stable" | "monitor" | "critical"
	) => api.patch(`/doctor/patient/${patientId}/risk-level`, { riskLevel }),
	updatePatientMonitoringDuration: (patientId: string, monitoringDays: number) =>
		api.patch(`/doctor/patient/${patientId}/monitoring-duration`, {
			monitoringDays,
		}),

	// Follow-up Consultations
	createFollowUpConsultation: (data: CreateFollowUpConsultationData) =>
		api.post("/doctor/follow-up", data),
	getPatientFollowUpConsultations: (patientId: string, params?: { status?: string }) =>
		api.get(`/doctor/follow-ups/${patientId}`, { params }),
	getFollowUpConsultationById: (followUpId: string) =>
		api.get(`/doctor/follow-up/${followUpId}`),
	updateFollowUpConsultation: (followUpId: string, data: UpdateFollowUpConsultationData) =>
		api.patch(`/doctor/follow-up/${followUpId}`, data),
	deleteFollowUpConsultation: (followUpId: string) =>
		api.delete(`/doctor/follow-up/${followUpId}`),
};

// ==================== ADMIN API ====================
export const adminApi = {
	// Patients
	getAllPatients: (
		params?: PaginationParams & { search?: string; carePathway?: string }
	) => api.get("/admin/patients", { params }),
	getPatientById: (patientId: string) =>
		api.get(`/admin/patient/${patientId}`),
	addPatient: (data: AddPatientData) => api.post("/admin/patient", data),
	updatePatient: (patientId: string, data: UpdatePatientData) =>
		api.patch(`/admin/patient/${patientId}`, data),
	deletePatient: (patientId: string) =>
		api.delete(`/admin/patient/${patientId}`),
	seedPatients: () => api.post("/admin/seed-patients"),

	// Doctors
	getAllDoctors: (
		params?: PaginationParams & { search?: string; specialty?: string }
	) => api.get("/admin/doctors", { params }),
	getDoctorById: (doctorId: string) => api.get(`/admin/doctor/${doctorId}`),
	addDoctor: (data: AddDoctorData) => api.post("/admin/doctor", data),
	updateDoctor: (doctorId: string, data: UpdateDoctorData) =>
		api.patch(`/admin/doctor/${doctorId}`, data),
	deleteDoctor: (doctorId: string) => api.delete(`/admin/doctor/${doctorId}`),
	seedDoctors: () => api.post("/admin/seed-doctors"),

	// Assignments
	getAllAssignments: () => api.get("/admin/assignments"),
	assignPatientToDoctor: (data: AssignmentData) =>
		api.post("/admin/assignment", data),
	deleteAssignment: (assignmentId: string) =>
		api.delete(`/admin/assignment/${assignmentId}`),
};

// ==================== MESSAGING API ====================
export const messageApi = {
	sendMessage: (data: SendMessageData) => api.post("/messages/send", data),
	getConversation: (userId: string, params?: PaginationParams) =>
		api.get(`/messages/conversation/${userId}`, { params }),
	getConversationById: (
		conversationId: string,
		params?: PaginationParams
	) => api.get(`/messages/conversation-id/${conversationId}`, { params }),
	getAllConversations: () => api.get("/messages/conversations"),
	markAsRead: (messageId: string) =>
		api.patch(`/messages/mark-read/${messageId}`),
	deleteMessage: (messageId: string) =>
		api.delete(`/messages/message/${messageId}`),
};

// ==================== ALERTS API ====================
export const alertApi = {
	getAllAlerts: (
		params?: PaginationParams & {
			status?: string;
			priority?: string;
			patientId?: string;
			includeViewed?: string;
		}
	) => api.get("/alerts", { params }),
	getAlertById: (alertId: string) => api.get(`/alerts/${alertId}`),
	createAlert: (data: CreateAlertData) => api.post("/alerts", data),
	updateAlertStatus: (alertId: string, data: UpdateAlertData) =>
		api.patch(`/alerts/${alertId}`, data),
	markAsViewed: (alertId: string) => api.patch(`/alerts/${alertId}/view`),
	deleteAlert: (alertId: string) => api.delete(`/alerts/${alertId}`),
	getAlertStats: (params?: { startDate?: string; endDate?: string }) =>
		api.get("/alerts/stats", { params }),
};

// ==================== ANALYTICS API ====================
export const analyticsApi = {
	getAdminAnalytics: () => api.get("/analytics/admin"),
	getSystemStats: () => api.get("/analytics/system"),
};

// ==================== MEDICATION API ====================
export const medicationApi = {
	getPatientMedications: (patientId: string) =>
		api.get(`/medications/patient/${patientId}`),
	getMedicationById: (medicationId: string) =>
		api.get(`/medications/${medicationId}`),
	createMedication: (data: any) => api.post("/medications", data),
	updateMedication: (medicationId: string, data: any) =>
		api.put(`/medications/${medicationId}`, data),
	deleteMedication: (medicationId: string) =>
		api.delete(`/medications/${medicationId}`),
	updateAdherenceRate: (medicationId: string, adherenceRate: number) =>
		api.patch(`/medications/${medicationId}/adherence`, { adherenceRate }),
};

// ==================== VIDEO CALL API ====================
export const videoCallApi = {
	createRoom: (data: CreateRoomData) =>
		api.post("/video-call/create-room", data),
	joinRoom: (roomId: string) => api.get(`/video-call/join/${roomId}`),
	endCall: (roomId: string) => api.post(`/video-call/end/${roomId}`),
	getSession: (roomId: string) => api.get(`/video-call/session/${roomId}`),
	sendSignal: (data: VideoCallSignal) => api.post("/video-call/signal", data),
	getConsultationsForPatient: (patientId: string) =>
		api.get(`/video-call/consultations/${patientId}`),
};

export default api;
