import { Link } from "react-router";

export default function NotFound() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
			<div className="text-center px-4">
				<div className="mb-8">
					<h1 className="text-9xl font-bold text-primary">404</h1>
					<div className="text-6xl mb-4">🏥</div>
				</div>
				<h2 className="text-3xl font-semibold text-gray-800 mb-4">
					Page Not Found
				</h2>
				<p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
					Oops! The page you're looking for doesn't exist. It might
					have been moved or deleted.
				</p>
				<div className="flex gap-4 justify-center">
					<Link
						to="/"
						className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
					>
						Go Home
					</Link>
					<button
						onClick={() => window.history.back()}
						className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
					>
						Go Back
					</button>
				</div>
			</div>
		</div>
	);
}
