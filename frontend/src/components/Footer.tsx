function Footer() {
	return (
		<footer className="bg-gray-900 text-gray-400">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
					{/* Logo & Copyright */}
					<div className="col-span-2 lg:col-span-2">
						<a href="#" className="flex items-center space-x-2">
							<img src="/icon.jpg" alt="" className="w-10 rounded-xl" />
							<span className="text-2xl font-bold text-white">
								CarePath
							</span>
						</a>
						<p className="mt-4 text-sm max-w-xs">
							The complete digital care platform for guiding
							patients and monitoring recovery.
						</p>
						<p className="mt-6 text-xs">
							&copy; 2025 CarePath. All rights reserved.
						</p>
					</div>

					{/* Links: Platform */}
					<div>
						<h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
							Platform
						</h3>
						<ul className="mt-4 space-y-3">
							<li>
								<a
									href="#platform"
									className="text-sm hover:text-white transition-colors"
								>
									Patient Engagement
								</a>
							</li>
							<li>
								<a
									href="#platform"
									className="text-sm hover:text-white transition-colors"
								>
									Clinical Monitoring
								</a>
							</li>
							<li>
								<a
									href="#platform"
									className="text-sm hover:text-white transition-colors"
								>
									Admin Portal
								</a>
							</li>
							<li>
								<a
									href="#outcomes"
									className="text-sm hover:text-white transition-colors"
								>
									Outcomes & Analytics
								</a>
							</li>
						</ul>
					</div>

					{/* Links: Roles */}
					<div>
						<h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
							Roles
						</h3>
						<ul className="mt-4 space-y-3">
							<li>
								<a
									href="#roles"
									className="text-sm hover:text-white transition-colors"
								>
									For Patients
								</a>
							</li>
							<li>
								<a
									href="#roles"
									className="text-sm hover:text-white transition-colors"
								>
									For Doctors
								</a>
							</li>
							<li>
								<a
									href="#roles"
									className="text-sm hover:text-white transition-colors"
								>
									For Administrators
								</a>
							</li>
						</ul>
					</div>

					{/* Links: Legal */}
					<div>
						<h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
							Legal
						</h3>
						<ul className="mt-4 space-y-3">
							<li>
								<a
									href="#"
									className="text-sm hover:text-white transition-colors"
								>
									Privacy Policy
								</a>
							</li>
							<li>
								<a
									href="#"
									className="text-sm hover:text-white transition-colors"
								>
									Terms of Service
								</a>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</footer>
	);
}
export default Footer;
