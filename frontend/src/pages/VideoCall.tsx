import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { videoCallApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface JoinRoomResponse {
  roomId: string;
  participants: string[];
  status: string;
  token: string;
  serverUrl: string;
}

function VideoCall() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [callLoading, setCallLoading] = useState(true);

  useEffect(() => {
    // Wait for auth state to resolve in this tab before deciding what to do
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (!roomId) {
      toast.error("Missing room information");
      navigate(-1);
      return;
    }

    let isMounted = true;

    const joinRoom = async () => {
      try {
        const resp = await videoCallApi.joinRoom(roomId);
        const payload = resp.data.data as JoinRoomResponse | undefined;

        if (!payload?.token || !payload?.serverUrl) {
          throw new Error("Invalid video call configuration");
        }

        if (!isMounted) return;

        setToken(payload.token);
        setServerUrl(payload.serverUrl);
      } catch (error) {
        if (!isMounted) return;
        toast.error("Failed to join video call");
        navigate(-1);
      } finally {
        if (isMounted) setCallLoading(false);
      }
    };

    joinRoom();

    return () => {
      isMounted = false;
    };
  }, [roomId, user, authLoading, navigate]);

  if (authLoading || callLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-sm">Connecting to video call...</p>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <p className="mb-4 text-sm">Unable to start video call.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 border rounded-md text-sm"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      style={{ height: "100vh", width: "100vw" }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}

export default VideoCall;
