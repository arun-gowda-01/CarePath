import { Link } from "react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccessDenied() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-orange-100">
			<div className="text-center px-4">
				<div className="mb-8">
					<h1 className="text-9xl font-bold text-red-600">403</h1>
					<div className="text-6xl mb-4 flex justify-center">
						<ShieldAlert className="text-red-500" size={64} />
					</div>
				</div>
				<h2 className="text-3xl font-semibold text-gray-800 mb-4">
					Access Denied
				</h2>
				<p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
					Sorry, you don't have permission to access this page. Please
					contact your administrator if you believe this is an error.
				</p>
				<div className="flex gap-4 justify-center">
					<Button>
						<Link to="/" className="font-medium">
							Go Home
						</Link>
					</Button>
					<Button
						onClick={() => window.history.back()}
						variant={"outline"}
						className="font-medium"
					>
						Go Back
					</Button>
				</div>
			</div>
		</div>
	);
}
