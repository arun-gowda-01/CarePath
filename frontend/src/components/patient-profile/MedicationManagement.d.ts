import type { Medication } from "@/lib/types";
interface MedicationManagementProps {
    patientId: string;
    medications: Medication[];
    onUpdate: () => void;
}
declare function MedicationManagement({ patientId, medications, onUpdate, }: MedicationManagementProps): import("react/jsx-runtime").JSX.Element;
export default MedicationManagement;
