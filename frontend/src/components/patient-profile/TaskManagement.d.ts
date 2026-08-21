import type { Task } from "@/lib/types";
interface TaskManagementProps {
    patientId: string;
    tasks: Task[];
    onUpdate: () => void;
}
declare function TaskManagement({ patientId, tasks, onUpdate }: TaskManagementProps): import("react/jsx-runtime").JSX.Element;
export default TaskManagement;
