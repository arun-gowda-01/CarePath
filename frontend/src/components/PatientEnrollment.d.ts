export interface IPatient {
    _id: string;
    userId: {
        fullName: string;
        email: string;
        _id: string;
        isActive: boolean;
    };
    dateOfBirth: Date;
    procedure: string;
    procedureDate: Date;
    riskLevel: "critical" | "stable" | "monitor";
}
export default function PatientEnrollment(): import("react/jsx-runtime").JSX.Element;
