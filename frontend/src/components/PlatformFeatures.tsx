const CheckIcon = () => (
	<svg
		className="h-4 w-4 text-white"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth="2.5"
		stroke="currentColor"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M4.5 12.75l6 6 9-13.5"
		/>
	</svg>
);

function PlatformFeatures() {
	return (
		<section id="platform" className="py-20 bg-primary/30 overflow-hidden">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-16">
					<h2 className="text-4xl font-extrabold text-gray-900">
						One Platform, Endless Capabilities
					</h2>
					<p className="mt-4 text-lg text-gray-600">
						From patient engagement to clinical automation, we
						provide the tools you need.
					</p>
				</div>

				{/* Feature 1: Patient Engagement */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
					<div>
						<span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 font-semibold text-sm rounded-full mb-4">
							Patient Engagement
						</span>
						<h3 className="text-3xl font-bold text-gray-900">
							Guide Every Step of the Journey
						</h3>
						<p className="mt-4 text-lg text-gray-600">
							Empower patients with a simple, daily, step-by-step
							guide to their recovery, accessible from their own
							device.
						</p>
						<ul className="mt-6 space-y-4">
							<li className="flex items-start">
								<div className="shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-3">
									<CheckIcon />
								</div>
								<span className="text-gray-700">
									<b>Dynamic To-Do Lists</b> with daily tasks,
									exercises, and medication reminders.
								</span>
							</li>
							<li className="flex items-start">
								<div className="shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-3">
									<CheckIcon />
								</div>
								<span className="text-gray-700">
									<b>Symptom Check-ins (PROs)</b> with visual
									pain scales and secure wound photo uploads.
								</span>
							</li>
							<li className="flex items-start">
								<div className="shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-3">
									<CheckIcon />
								</div>
								<span className="text-gray-700">
									<b>Rich Education Library</b> with articles,
									videos, and progress tracking.
								</span>
							</li>
						</ul>
					</div>
					<img
						src="/patient-home.png"
						alt="Patient App"
						className="rounded-xl shadow-2xl"
					/>
				</div>

				{/* Feature 2: Clinical Monitoring */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
					<img
						src="/doctor-dashboard.png"
						alt="Doctor Dashboard"
						className="rounded-xl shadow-2xl md:order-last"
					/>
					<div>
						<span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 font-semibold text-sm rounded-full mb-4">
							Clinical Monitoring
						</span>
						<h3 className="text-3xl font-bold text-gray-900">
							Monitor, Triage, and Intervene Faster
						</h3>
						<p className="mt-4 text-lg text-gray-600">
							A powerful desktop hub provides a 360-degree view of
							all patients, with real-time alerts for at-risk
							individuals.
						</p>
						<ul className="mt-6 space-y-4">
							<li className="flex items-start">
								<div className="shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-3">
									<CheckIcon />
								</div>
								<span className="text-gray-700">
									<b>Real-time Alert Engine</b> flags
									high-risk data (pain, fever) for immediate
									intervention.
								</span>
							</li>
							<li className="flex items-start">
								<div className="shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-3">
									<CheckIcon />
								</div>
								<span className="text-gray-700">
									<b>Color-Coded Triage Dashboard</b> to
									manage entire patient populations by risk
									level.
								</span>
							</li>
							<li className="flex items-start">
								<div className="shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-3">
									<CheckIcon />
								</div>
								<span className="text-gray-700">
									<b>Deep-Dive Patient Profiles</b> with
									visual trend analysis and intervention logs.
								</span>
							</li>
						</ul>
					</div>
				</div>

				{/* Feature 3: NEW Integrated Tools */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
					<div>
						<span className="inline-block px-4 py-1.5 bg-yellow-100 text-yellow-700 font-semibold text-sm rounded-full mb-4">
							Integrated Tools
						</span>
						<h3 className="text-3xl font-bold text-gray-900">
							Communication and Reporting, Unified
						</h3>
						<p className="mt-4 text-lg text-gray-600">
							Reduce platform fatigue with tools for telehealth
							and patient reporting built directly into the
							workflow.
						</p>
						<ul className="mt-6 space-y-4">
							<li className="flex items-start">
								<div className="shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-3">
									<CheckIcon />
								</div>
								<span className="text-gray-700">
									<b>Secure Telehealth Integration</b> to
									launch HIPAA-compliant video calls from the
									patient profile.
								</span>
							</li>
							<li className="flex items-start">
								<div className="shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-3">
									<CheckIcon />
								</div>
								<span className="text-gray-700">
									<b>On-Demand PDF Health Reports</b> for
									patients to download and share their
									progress.
								</span>
							</li>
						</ul>
					</div>
					<img
						src="/report.png"
						alt="Telehealth and Reports"
						className="rounded-xl shadow-2xl"
					/>
				</div>

				{/* Feature 4: NEW Admin Portal */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
					<img
						src="/admin.png"
						alt="Admin Portal"
						className="rounded-xl shadow-2xl md:order-last"
					/>
					<div>
						<span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 font-semibold text-sm rounded-full mb-4">
							System Management
						</span>
						<h3 className="text-3xl font-bold text-gray-900">
							Configure, Manage, and Scale
						</h3>
						<p className="mt-4 text-lg text-gray-600">
							The Admin Portal provides secure, high-privilege
							control over users, pathways, and system-wide
							configurations.
						</p>
						<ul className="mt-6 space-y-4">
							<li className="flex items-start">
								<div className="shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-3">
									<CheckIcon />
								</div>
								<span className="text-gray-700">
									<b>Doctor & Patient Management</b> with bulk
									assignment, and credential verification.
								</span>
							</li>
							<li className="flex items-start">
								<div className="shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-3">
									<CheckIcon />
								</div>
								<span className="text-gray-700">
									<b>Care Pathway Configuration</b> to
									customize protocols and alert thresholds.
								</span>
							</li>
							<li className="flex items-start">
								<div className="shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-3">
									<CheckIcon />
								</div>
								<span className="text-gray-700">
									<b>Branding Control & Audit Logs</b> for a
									customized, compliant, and auditable system.
								</span>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}

export default PlatformFeatures;
