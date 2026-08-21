export interface ApiResponse<T = unknown> {
    statusCode: number;
    success: boolean;
    message: string;
    data?: T;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
}
export interface Pagination {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
}
export interface LoginData {
    email: string;
    password: string;
    role: "patient" | "doctor" | "admin";
}
export interface User {
    id: string;
    name: string;
    email: string;
    role: "Admin" | "Doctor" | "Patient";
    createdAt: string;
    updatedAt: string;
}
export interface AuthUser {
    id: string;
    email: string;
    role: string;
    name: string;
}
export interface Patient {
    _id: string;
    userId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        isActive: boolean;
    };
    dateOfBirth: string;
    phone?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
    };
    procedure: string;
    procedureDate: string;
    riskLevel: "stable" | "monitor" | "critical";
    adherenceRate: number;
    recoveryProgress: number;
    status: "active" | "recovered";
    age: number;
    daysPostOp: number;
    monitoringDays?: number;
}
export interface AddPatientData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    dateOfBirth: string;
    phone?: string;
    address?: string;
    procedure: string;
    procedureDate: string;
    riskLevel?: "stable" | "monitor" | "critical";
}
export interface UpdatePatientData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    procedure?: string;
    procedureDate?: string;
    riskLevel?: "stable" | "monitor" | "critical";
    adherenceRate?: number;
    recoveryProgress?: number;
    status?: "active" | "recovered";
}
export interface Doctor {
    _id: string;
    userId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    role: string;
    phone?: string;
    specialization?: string;
    licenseNumber?: string;
}
export interface AddDoctorData {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string;
    phone?: string;
    specialization?: string;
    licenseNumber?: string;
}
export interface UpdateDoctorData {
    phone?: string;
    specialization?: string;
    licenseNumber?: string;
    role?: string;
}
export interface SymptomCheckIn {
    _id: string;
    patientId: string;
    painLevel: number;
    temperature: number;
    bloodPressure?: {
        systolic?: number;
        diastolic?: number;
        formatted?: string;
    };
    mood: "poor" | "okay" | "good" | "excellent";
    notes?: string;
    image?: {
        url?: string;
        filename?: string;
        uploadedAt?: Date;
    };
    symptoms?: Array<{
        type?: string;
        description?: string;
    }>;
    flaggedForReview: boolean;
    isRead?: boolean;
    reviewedBy?: string;
    reviewedAt?: string;
    checkInDate: string;
    createdAt: string;
    riskLevel?: string;
    date?: string;
}
export interface SubmitCheckInData {
    patientId: string;
    painLevel: number;
    temperature: number;
    bloodPressure?: {
        systolic?: number;
        diastolic?: number;
    };
    mood: "poor" | "okay" | "good" | "excellent";
    notes?: string;
    symptoms?: Array<{
        type?: string;
        description?: string;
    }>;
    woundImage?: File;
}
export interface RecoveryTrends {
    trends: {
        pain: Array<{
            date: string;
            value: number;
        }>;
        temperature: Array<{
            date: string;
            value: number;
        }>;
        mood: Array<{
            date: string;
            value: string;
        }>;
    };
    summary: {
        totalCheckIns: number;
        averagePain: number;
        averageTemp: number;
        improvementTrend: "improving" | "stable" | "declining" | "insufficient_data";
    };
}
export interface Task {
    _id: string;
    patientId: string;
    title: string;
    description?: string;
    type: "medication" | "exercise" | "check-in" | "appointment" | "wound-check" | "other";
    scheduledTime: string;
    completed: boolean;
    completedAt?: string;
    priority: "low" | "medium" | "high";
    recurring?: {
        enabled: boolean;
        frequency: "daily" | "weekly" | "monthly";
        endDate?: string;
    };
}
export interface CreateTaskData {
    patientId: string;
    title: string;
    description?: string;
    type: "medication" | "exercise" | "check-in" | "appointment" | "wound-check" | "other";
    scheduledTime: string;
    priority?: "low" | "medium" | "high";
    recurring?: {
        enabled: boolean;
        frequency: "daily" | "weekly" | "monthly";
        endDate?: string;
    };
}
export interface UpdateTaskData {
    completed?: boolean;
    title?: string;
    description?: string;
    scheduledTime?: string;
    priority?: "low" | "medium" | "high";
}
export interface FollowUpConsultation {
    _id: string;
    patientId: string | {
        _id: string;
        procedure: string;
        procedureDate: string;
    };
    doctorId: string | {
        _id: string;
        userId: {
            _id: string;
            firstName: string;
            lastName: string;
        };
    };
    title: string;
    description?: string;
    scheduledTime: string;
    priority: "low" | "medium" | "high";
    location?: string;
    status: "scheduled" | "completed" | "cancelled";
    completedAt?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
export interface CreateFollowUpConsultationData {
    patientId: string;
    title: string;
    description?: string;
    scheduledTime: string;
    priority?: "low" | "medium" | "high";
    location?: string;
}
export interface UpdateFollowUpConsultationData {
    title?: string;
    description?: string;
    scheduledTime?: string;
    priority?: "low" | "medium" | "high";
    location?: string;
    status?: "scheduled" | "completed" | "cancelled";
    notes?: string;
}
export interface TaskStats {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    adherenceRate: number;
}
export interface Alert {
    _id: string;
    patientId: string | Patient;
    type: string;
    severity: "normal" | "warning" | "critical";
    message: string;
    status: "active" | "resolved" | "dismissed";
    triggeredBy?: {
        source: string;
        referenceId?: string;
    };
    createdAt: string;
    updatedAt: string;
}
export interface CreateAlertData {
    patientId: string;
    type: string;
    severity: "normal" | "warning" | "critical";
    message: string;
    assignedTo?: string;
}
export interface UpdateAlertData {
    status?: "active" | "resolved" | "dismissed";
    action?: string;
    notes?: string;
}
export interface AlertStats {
    totalAlerts: number;
    activeAlerts: number;
    criticalAlerts: number;
    warningAlerts: number;
    resolvedAlerts: number;
    dismissedAlerts: number;
}
export interface MedicationTiming {
    timeOfDay: "morning" | "afternoon" | "night";
}
export interface DoseTaken {
    date: string;
    timeOfDay: "morning" | "afternoon" | "night";
    takenAt: string;
}
export interface Medication {
    _id: string;
    patientId: string | Patient;
    name: string;
    timings: MedicationTiming[];
    foodRelation: "before" | "after" | "with" | "empty_stomach";
    startDate: string;
    endDate?: string;
    duration?: string;
    instructions?: string;
    sideEffects?: string[];
    adherenceRate: number;
    isActive: boolean;
    prescribedBy?: string;
    dosesTaken: DoseTaken[];
    createdAt: string;
    updatedAt: string;
}
export interface CreateMedicationData {
    patientId: string;
    name: string;
    timings: MedicationTiming[];
    foodRelation: "before" | "after" | "with" | "empty_stomach";
    startDate: string;
    endDate?: string;
    instructions?: string;
    sideEffects?: string[];
    isActive?: boolean;
}
export interface UpdateMedicationData {
    name?: string;
    timings?: MedicationTiming[];
    foodRelation?: "before" | "after" | "with" | "empty_stomach";
    startDate?: string;
    endDate?: string;
    instructions?: string;
    sideEffects?: string[];
    adherenceRate?: number;
    isActive?: boolean;
}
export interface Note {
    _id: string;
    patientId: string;
    authorId: {
        _id: string;
        firstName: string;
        lastName: string;
        role: string;
    };
    type: "Clinical" | "Progress" | "Intervention" | "Consultation" | "Discharge" | "Other";
    title?: string;
    content: string;
    priority: "low" | "medium" | "high";
    isPrivate: boolean;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}
export interface CreateNoteData {
    patientId: string;
    type: "Clinical" | "Progress" | "Intervention" | "Consultation" | "Discharge" | "Other";
    title?: string;
    content: string;
    priority?: "low" | "medium" | "high";
    isPrivate?: boolean;
    tags?: string[];
}
export interface UpdateNoteData {
    title?: string;
    content?: string;
    priority?: "low" | "medium" | "high";
    isPrivate?: boolean;
    tags?: string[];
}
export interface Message {
    _id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    senderType: "patient" | "Doctor";
    text: string;
    status: "sent" | "delivered" | "read";
    readAt?: string;
    attachments?: Array<{
        type?: string;
        url?: string;
        filename?: string;
    }>;
    createdAt: string;
}
export interface SendMessageData {
    receiverId: string;
    text: string;
    conversationId?: string;
    attachments?: Array<{
        type?: string;
        url?: string;
        filename?: string;
    }>;
}
export interface Conversation {
    conversationId: string;
    otherUser: {
        _id: string;
        firstName: string;
        lastName: string;
        role: string;
    };
    lastMessage: Message;
    unreadCount: number;
}
export interface AdminAnalytics {
    overview: {
        totalPatients: number;
        activePatients: number;
        recoveredPatients: number;
        totalDoctors: number;
        totalAlerts: number;
        criticalAlerts: number;
        activeAlerts: number;
        totalCheckIns: number;
    };
    riskDistribution: {
        stable: number;
        monitor: number;
        critical: number;
    };
    checkInTrends: Array<{
        _id: string;
        count: number;
    }>;
    recentPatients: Patient[];
    recentAlerts: Alert[];
}
export interface DoctorAnalytics {
    assignedPatients: Patient[];
    totalAssignedPatients: number;
    criticalPatients: number;
    activeAlerts: number;
    riskDistribution: {
        stable: number;
        monitor: number;
        critical: number;
    };
    recentAlerts: Alert[];
    recentCheckIns: SymptomCheckIn[];
}
export interface PatientAnalytics {
    patient: {
        procedure: string;
        procedureDate: string;
        riskLevel: string;
        status: string;
        daysPostOp: number;
        monitoringDays: number;
    };
    stats: {
        totalCheckIns: number;
        totalTasks: number;
        completedTasks: number;
        pendingTasks: number;
        adherenceRate: number;
        activeAlerts: number;
    };
    recentCheckIns: SymptomCheckIn[];
    assignedDoctor?: Doctor;
}
export interface Assignment {
    _id: string;
    patientId: string;
    doctorId: string;
    assignedDate: string;
}
export interface AssignmentData {
    patientId: string;
    doctorId: string;
    assignedDate?: string;
}
export interface AssignmentMatrix {
    assignments: Array<{
        doctor: Doctor;
        patients: Array<{
            assignmentId: string;
            assignedDate: string;
            userId: {
                firstName: string;
                lastName: string;
            };
            procedure: string;
            procedureDate: string;
        }>;
        patientCount: number;
    }>;
    unassignedPatients: Patient[];
}
export interface VideoCallRoom {
    roomId: string;
    participants: string[];
}
export interface CreateRoomData {
    participantId: string;
}
export interface VideoCallSignal {
    roomId: string;
    signal: unknown;
    targetUserId: string;
}
export interface Exercise {
    _id: string;
    exerciseDbId: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}
export interface ExerciseDBExercise {
    exerciseId: string;
    name: string;
    bodyParts: string[];
    targetMuscles: string[];
    equipment: string;
    gifUrl: string;
    instructions: string[];
    secondaryMuscles?: string[];
}
export interface AssignExerciseData {
    patientId: string;
    exerciseData: ExerciseDBExercise;
    scheduledTime: string;
    duration?: number;
    sets?: number;
    repetitions?: string;
    priority?: "low" | "medium" | "high";
    recurring?: {
        enabled: boolean;
        frequency: "daily" | "weekly" | "monthly";
        endDate?: string;
    };
}
export interface UpdateExerciseData {
    completed?: boolean;
    scheduledTime?: string;
    priority?: "low" | "medium" | "high";
    sets?: number;
    repetitions?: string;
    duration?: number;
}
export interface ExerciseTask extends Task {
    exerciseId?: Exercise;
}
