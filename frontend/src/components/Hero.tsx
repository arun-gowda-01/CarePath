function Hero() {
	return (
		<section className="relative bg-gray-50 overflow-hidden">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
					{/* Hero Text */}
					<div className="z-10">
						<span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 font-semibold text-sm rounded-full mb-4">
							The Complete Digital Care Journey Platform
						</span>
						<h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
							Guide Patients, Monitor Recovery, Automate Care
						</h1>
						<p className="mt-6 text-lg text-gray-600 max-w-lg">
							CarePath integrates with your EHR to guide patients
							from pre-op to recovery, empowers Doctors with
							real-time data, and gives administrators the tools
							to scale.
						</p>
						<div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
							<a
								href="/login"
								className="px-8 py-3.5 bg-primary text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all text-center"
							>
								Login
							</a>
							<a
								href="#platform"
								className="px-8 py-3.5 bg-white text-gray-700 text-lg font-semibold rounded-lg shadow-lg hover:bg-gray-100 ring-1 ring-gray-300 transition-all text-center"
							>
								See Platform Features
							</a>
						</div>
					</div>

					{/* Hero Image */}
					<div className="relative z-0">
						<img
							src="/doctor-dashboard.png"
							alt="Doctor Dashboard"
							className="rounded-2xl shadow-2xl object-cover"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}

export default Hero;
