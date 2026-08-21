import type { LoginData, SubmitCheckInData, PaginationParams, CreateTaskData, UpdateTaskData, CreateNoteData, UpdateNoteData, AddPatientData, UpdatePatientData, AddDoctorData, UpdateDoctorData, AssignmentData, SendMessageData, CreateAlertData, UpdateAlertData, CreateRoomData, VideoCallSignal, AssignExerciseData, UpdateExerciseData, CreateFollowUpConsultationData, UpdateFollowUpConsultationData } from "./types";
export declare const api: import("axios").AxiosInstance;
export declare const authApi: {
    login: (data: LoginData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    logout: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getCurrentUser: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateProfile: (data: {
        firstName?: string;
        lastName?: string;
        email?: string;
        currentPassword?: string;
        newPassword?: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const patientApi: {
    submitCheckIn: (data: SubmitCheckInData | FormData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getCheckIns: (patientId: string, params?: PaginationParams) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getCheckInById: (checkInId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getRecoveryTrends: (patientId: string, days?: number) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getTasks: (patientId: string, params?: PaginationParams & {
        status?: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    createTask: (data: CreateTaskData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateTask: (taskId: string, data: UpdateTaskData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteTask: (taskId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getTaskStats: (patientId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getMyMedications: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    markDoseAsTaken: (medicationId: string, timeOfDay: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getAnalytics: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getPatientDetails: (patientId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getExercises: (patientId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    completeExercise: (taskId: string, data: UpdateExerciseData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const doctorApi: {
    createNote: (data: CreateNoteData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getPatientNotes: (patientId: string, params?: PaginationParams) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getNoteById: (noteId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateNote: (noteId: string, data: UpdateNoteData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteNote: (noteId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getTasks: (patientId: string, params?: PaginationParams & {
        status?: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    createTask: (data: CreateTaskData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateTask: (taskId: string, data: UpdateTaskData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteTask: (taskId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getTaskStats: (patientId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getPatientById: (patientId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    searchExercises: (bodyPart: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getBodyParts: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    assignExercise: (data: AssignExerciseData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getPatientExercises: (patientId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateExercise: (taskId: string, data: UpdateExerciseData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteExercise: (taskId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getAllExercises: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getAnalytics: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getPatientAdherence: (patientId: string, params?: {
        startDate?: string;
        endDate?: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getAdherenceAnalytics: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getCheckIns: (patientId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    markCheckInAsReviewed: (checkInId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updatePatientRiskLevel: (patientId: string, riskLevel: "stable" | "monitor" | "critical") => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updatePatientMonitoringDuration: (patientId: string, monitoringDays: number) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    createFollowUpConsultation: (data: CreateFollowUpConsultationData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getPatientFollowUpConsultations: (patientId: string, params?: {
        status?: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getFollowUpConsultationById: (followUpId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateFollowUpConsultation: (followUpId: string, data: UpdateFollowUpConsultationData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteFollowUpConsultation: (followUpId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const adminApi: {
    getAllPatients: (params?: PaginationParams & {
        search?: string;
        carePathway?: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getPatientById: (patientId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    addPatient: (data: AddPatientData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updatePatient: (patientId: string, data: UpdatePatientData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    deletePatient: (patientId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    seedPatients: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getAllDoctors: (params?: PaginationParams & {
        search?: string;
        specialty?: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getDoctorById: (doctorId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    addDoctor: (data: AddDoctorData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateDoctor: (doctorId: string, data: UpdateDoctorData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteDoctor: (doctorId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    seedDoctors: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getAllAssignments: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    assignPatientToDoctor: (data: AssignmentData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteAssignment: (assignmentId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const messageApi: {
    sendMessage: (data: SendMessageData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getConversation: (userId: string, params?: PaginationParams) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getConversationById: (conversationId: string, params?: PaginationParams) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getAllConversations: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    markAsRead: (messageId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteMessage: (messageId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const alertApi: {
    getAllAlerts: (params?: PaginationParams & {
        status?: string;
        priority?: string;
        patientId?: string;
        includeViewed?: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getAlertById: (alertId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    createAlert: (data: CreateAlertData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateAlertStatus: (alertId: string, data: UpdateAlertData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    markAsViewed: (alertId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteAlert: (alertId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getAlertStats: (params?: {
        startDate?: string;
        endDate?: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const analyticsApi: {
    getAdminAnalytics: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getSystemStats: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const medicationApi: {
    getPatientMedications: (patientId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getMedicationById: (medicationId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    createMedication: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateMedication: (medicationId: string, data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteMedication: (medicationId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateAdherenceRate: (medicationId: string, adherenceRate: number) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const videoCallApi: {
    createRoom: (data: CreateRoomData) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    joinRoom: (roomId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    endCall: (roomId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getSession: (roomId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    sendSignal: (data: VideoCallSignal) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getConsultationsForPatient: (patientId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export default api;
