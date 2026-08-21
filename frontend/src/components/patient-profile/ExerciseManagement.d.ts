import type { ExerciseTask } from "@/lib/types";
interface ExerciseManagementProps {
    patientId: string;
    exercises: ExerciseTask[];
    onUpdate: () => void;
}
declare function ExerciseManagement({ patientId, exercises, onUpdate, }: ExerciseManagementProps): import("react/jsx-runtime").JSX.Element;
export default ExerciseManagement;
