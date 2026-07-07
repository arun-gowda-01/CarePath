import { useState } from "react";

const MobileMenuIcon = () => (
	<svg
		className="h-6 w-6"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth="1.5"
		stroke="currentColor"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
		/>
	</svg>
);

function Header() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

	// Toggle mobile menu state
	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	// Close mobile menu when a link is clicked
	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	return (
		<header className="bg-white/95 sticky top-0 z-50 backdrop-blur-lg shadow-sm border-b border-gray-200">
			<nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
				{/* Logo */}
				<a href="#" className="flex items-center space-x-2">
				<img src="/icon.jpg" alt="" className="w-10 rounded-xl" />
					<span className="text-2xl font-bold text-gray-900">
						CarePath
					</span>
				</a>

				{/* Desktop Nav Links */}
				<div className="hidden md:flex items-center space-x-8">
					<a
						href="#platform"
						className="font-medium text-gray-600 hover:text-primary transition-colors"
					>
						Platform
					</a>
					<a
						href="#outcomes"
						className="font-medium text-gray-600 hover:text-primary transition-colors"
					>
						Outcomes
					</a>
					<a
						href="#roles"
						className="font-medium text-gray-600 hover:text-primary transition-colors"
					>
						Roles
					</a>
				</div>

				{/* CTA & Mobile Menu Button */}
				<div className="flex items-center space-x-4">
					<a
						href="/login"
						className="hidden sm:inline-block px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all"
					>
						Login
					</a>
					<button
						id="mobile-menu-btn"
						className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
						onClick={toggleMobileMenu}
						aria-label="Toggle mobile menu"
					>
						<MobileMenuIcon />
					</button>
				</div>
			</nav>

			{/* Mobile Menu */}
			<div
				id="mobile-menu"
				className={`${
					isMobileMenuOpen ? "block" : "hidden"
				} md:hidden bg-white shadow-lg absolute top-20 left-0 w-full z-40`}
			>
				<div className="flex flex-col space-y-4 p-5 border-t border-gray-200">
					<a
						href="#platform"
						className="font-medium text-gray-700 hover:text-primary"
						onClick={closeMobileMenu}
					>
						Platform
					</a>
					<a
						href="#outcomes"
						className="font-medium text-gray-700 hover:text-primary"
						onClick={closeMobileMenu}
					>
						Outcomes
					</a>
					<a
						href="#roles"
						className="font-medium text-gray-700 hover:text-primary"
						onClick={closeMobileMenu}
					>
						Roles
					</a>
					<a
						href="#testimonials"
						className="font-medium text-gray-700 hover:text-primary"
						onClick={closeMobileMenu}
					>
						Testimonials
					</a>
					<a
						href="/login"
						className="w-full px-5 py-3 text-center bg-primary text-white text-sm font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all"
						onClick={closeMobileMenu}
					>
						Login
					</a>
				</div>
			</div>
		</header>
	);
}

export default Header;
