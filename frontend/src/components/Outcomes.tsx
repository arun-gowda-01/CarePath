function Outcomes() {
	return (
		<section id="outcomes" className="py-40 bg-primary/20">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center">
					<h2 className="text-base font-semibold text-primary tracking-wide uppercase">
						Proven Outcomes
					</h2>
					<p className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">
						Validated by 40+ Peer-Reviewed Studies
					</p>
				</div>
				<div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
					{/* Stat Card 1 */}
					<div className="bg-gray-50 border border-gray-200 rounded-xl p-8 shadow-sm">
						<p className="text-6xl font-extrabold text-primary">
							72%
						</p>
						<p className="mt-3 text-xl font-semibold text-gray-900">
							Reduction in Readmissions
						</p>
						<p className="mt-2 text-base text-gray-600">
							Keep patients recovering safely at home and avoid
							costly, unnecessary readmissions.
						</p>
					</div>
					{/* Stat Card 2 */}
					<div className="bg-gray-50 border border-gray-200 rounded-xl p-8 shadow-sm">
						<p className="text-6xl font-extrabold text-primary">
							64%
						</p>
						<p className="mt-3 text-xl font-semibold text-gray-900">
							Reduction in ER Visits
						</p>
						<p className="mt-2 text-base text-gray-600">
							Proactively catch complications before they become
							emergencies with real-time alerts.
						</p>
					</div>
					{/* Stat Card 3 */}
					<div className="bg-gray-50 border border-gray-200 rounded-xl p-8 shadow-sm">
						<p className="text-6xl font-extrabold text-primary">
							90%
						</p>
						<p className="mt-3 text-xl font-semibold text-gray-900">
							Patient Adherence
						</p>
						<p className="mt-2 text-base text-gray-600">
							Engage and empower patients with an easy-to-use
							platform they actually love.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}

export default Outcomes;
