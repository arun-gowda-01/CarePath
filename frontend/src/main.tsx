import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

// Pages and Layouts
import Landing from "./pages/Landing.tsx";
import Login from "./pages/Login.tsx";
import PatientLayout from "./layouts/PatientLayout.tsx";
import DoctorLayout from "./layouts/DoctorLayout.tsx";
import PatientHome from "./pages/PatientHome.tsx";
import PatientTasks from "./pages/PatientTasks.tsx";
import PatientCheckIn from "./pages/PatientCheckIn.tsx";
import PatientResources from "./pages/PatientResources.tsx";
import Messages from "./pages/Messages.tsx";
import PatientHealthReport from "./pages/PatientHealthReport.tsx";
import PatientProfileSettings from "./pages/PatientProfileSettings.tsx";
import DoctorDashboard from "./pages/DoctorDashboard.tsx";
import PatientProfile from "./pages/PatientProfile.tsx";
import Alerts from "./pages/Alerts.tsx";
import Analytics from "./pages/Analytics.tsx";
import AdminLayout from "./layouts/AdminLayout.tsx";
import UserManagementDashboard from "./pages/UserManagementDashboard.tsx";
import PlatformConfiguration from "./pages/PlatformConfiguration.tsx";
import NotFound from "./pages/NotFound.tsx";
import AccessDenied from "./pages/AccessDenied.tsx";
import VideoCall from "./pages/VideoCall.tsx";

import { Toaster } from "./components/ui/sonner.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";

const router = createBrowserRouter([
	{
		path: "/",
		children: [
			{
				index: true,
				element: <Landing />,
			},
			{
				path: "/login",
				element: <Login />,
			},
			{
				path: "/patient",
				element: <PatientLayout />,
				children: [
					{ path: "home", element: <PatientHome /> },
					{ path: "tasks", element: <PatientTasks /> },
					{ path: "checkin", element: <PatientCheckIn /> },
					{ path: "resources", element: <PatientResources /> },
					{ path: "messages", element: <Messages /> },
					{ path: "reports", element: <PatientHealthReport /> },
					{ path: "profile", element: <PatientProfileSettings /> },
				],
			},
			{
				path: "/doctor",
				element: <DoctorLayout />,
				children: [
					{ path: "dashboard", element: <DoctorDashboard /> },
					{
						path: "patient-profile/:patientId",
						element: <PatientProfile />,
					},
					{ path: "alerts", element: <Alerts /> },
					{ path: "analytics", element: <Analytics /> },
				],
			},
			{
				path: "/video-call/:roomId",
				element: <VideoCall />,
			},
			{
				path: "/admin",
				element: <AdminLayout />,
				children: [
					{
						path: "user-management",
						element: <UserManagementDashboard />,
					},
					{
						path: "configuration",
						element: <PlatformConfiguration />,
					},
				],
			},
			{
				path: "/access-denied",
				element: <AccessDenied />,
			},
			{
				path: "*",
				element: <NotFound />,
			},
		],
	},
]);

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AuthProvider>
			<RouterProvider router={router} />
			<Toaster />
		</AuthProvider>
	</StrictMode>
);
