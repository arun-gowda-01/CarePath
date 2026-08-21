import type { FollowUpConsultation } from "@/lib/types";
interface FollowUpConsultationsProps {
    patientId: string;
    appointments: FollowUpConsultation[];
    onUpdate: () => void;
}
declare function FollowUpConsultations({ patientId, appointments, onUpdate, }: FollowUpConsultationsProps): import("react/jsx-runtime").JSX.Element;
export default FollowUpConsultations;
