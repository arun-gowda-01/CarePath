import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

function FeatureTabs() {
	const tabs: Array<{
		value: string;
		label: string;
		content: React.ReactNode;
	}> = [
		{
			value: "patientEngagement",
			label: "Patient Engagement",
			content: (
				<Card>
					<CardContent className="min-h-40">
						Patient Engagement Content
					</CardContent>
				</Card>
			),
		},
		{
			value: "personalizedEducation",
			label: "Personalized Education",
			content: (
				<Card>
					<CardContent className="min-h-40">
						Personalized Education Content
					</CardContent>
				</Card>
			),
		},
		{
			value: "trackPatientProgress",
			label: "Track Patient Progress",
			content: (
				<Card>
					<CardContent className="min-h-40">
						Track Patient Progress Content
					</CardContent>
				</Card>
			),
		},
		{
			value: "remotePatientMonitoring",
			label: "Remote Patient Monitoring",
			content: (
				<Card>
					<CardContent className="min-h-40">
						Remote Patient Monitoring Content
					</CardContent>
				</Card>
			),
		},
		{
			value: "analyticsReporting",
			label: "Analytics & Reporting",
			content: (
				<Card>
					<CardContent className="min-h-40">
						Analytics & Reporting Content
					</CardContent>
				</Card>
			),
		},
	];
	return (
		<div className="w-full flex flex-col items-center justify-center py-40 bg-gray-50">
			<h2 className="text-4xl font-extrabold text-gray-900">
				How CarePath Works
			</h2>
			<Tabs defaultValue="patientEngagement" className="w-fit my-5">
				<TabsList className="h-12">
					{tabs.map((tab) => (
						<TabsTrigger
						key={tab.label}
							value={tab.value}
							className="data-[state=active]:bg-primary data-[state=active]:text-white transition-colors duration-400"
						>
							{tab.label}
						</TabsTrigger>
					))}
				</TabsList>
				{tabs.map((tab) => (
					<TabsContent value={tab.value} key={tab.value}>
						{tab.content}
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}

export default FeatureTabs;
