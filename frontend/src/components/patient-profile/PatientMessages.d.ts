import type { Patient } from "@/lib/types";
interface PatientMessagesProps {
    patient: Patient;
    activeTab: string;
}
declare function PatientMessages({ patient, activeTab }: PatientMessagesProps): import("react/jsx-runtime").JSX.Element;
export default PatientMessages;
