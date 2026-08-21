interface TaskItemProps {
    completed: boolean;
    title: string;
    time: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    type?: "medication" | "exercise" | "check-in" | "appointment" | "wound-check" | "other";
    isOverdue?: boolean;
    onToggle?: () => void;
}
declare function TaskItem({ completed, title, time, description, priority, type, isOverdue, onToggle, }: TaskItemProps): import("react/jsx-runtime").JSX.Element;
export default TaskItem;
