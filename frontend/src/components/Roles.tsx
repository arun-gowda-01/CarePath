const PatientIcon = () => (
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
			d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
		/>
	</svg>
);

const DoctorIcon = () => (
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
			d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h4.5m6 0h4.5a2.25 2.25 0 012.25 2.25v6m-6-3h.008v.008h-.008v-.008z"
		/>
	</svg>
);

const AdminIcon = () => (
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
			d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
		/>
	</svg>
);

function Roles() {
	return (
		<section id="roles" className="py-60 bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center max-w-3xl mx-auto">
					<h2 className="text-4xl font-extrabold text-gray-900">
						A Single Platform for Every Role
					</h2>
					<p className="mt-4 text-lg text-gray-600">
						CarePath connects patients, care teams, and
						administrators on one integrated, HIPAA-compliant
						platform.
					</p>
				</div>
				<div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
					{/* Role 1: Patients */}
					<div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
						<div className="shrink-0">
							<span className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 text-primary">
								<PatientIcon />
							</span>
						</div>
						<h3 className="mt-5 text-2xl font-bold text-gray-900">
							For Patients
						</h3>
						<p className="mt-3 text-base text-gray-600">
							A simple, guided journey with daily tasks,
							education, symptom check-ins, telehealth, and
							on-demand health reports.
						</p>
					</div>
					{/* Role 2: Doctors */}
					<div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
						<div className="shrink-0">
							<span className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-green-100 text-green-600">
								<DoctorIcon />
							</span>
						</div>
						<h3 className="mt-5 text-2xl font-bold text-gray-900">
							For Doctors
						</h3>
						<p className="mt-3 text-base text-gray-600">
							A powerful dashboard to monitor all patients, triage
							real-time alerts, review PROs, and launch video
							calls.
						</p>
					</div>
					{/* Role 3: Administrators */}
					<div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
						<div className="shrink-0">
							<span className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100 text-purple-600">
								<AdminIcon />
							</span>
						</div>
						<h3 className="mt-5 text-2xl font-bold text-gray-900">
							For Administrators
						</h3>
						<p className="mt-3 text-base text-gray-600">
							Full control to manage users, verify Doctors,
							configure care pathways, set alert thresholds, and
							monitor compliance.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}

export default Roles;
