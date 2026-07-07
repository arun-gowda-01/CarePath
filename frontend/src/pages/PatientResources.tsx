import { Card } from "@/components/ui/card";
import { SquareCheckBig } from "lucide-react";
import { useState } from "react";

function PatientResources() {
	const [selectedCategory, setSelectedCategory] = useState<string | null>(
		null
	);

	const articles = [
		{
			id: 1,
			title: "Post-Op Recovery Tips",
			category: "Recovery",
			read: true,
			description:
				"Essential guidelines for a smooth recovery after surgery",
			duration: "5 min read",
		},
		{
			id: 2,
			title: "Medication Guide",
			category: "Medications",
			read: false,
			description:
				"Understanding your medications and how to take them safely",
			duration: "8 min read",
		},
		{
			id: 3,
			title: "When to Seek Help",
			category: "Safety",
			read: false,
			description: "Warning signs and when to contact your care team",
			duration: "6 min read",
		},
		{
			id: 4,
			title: "Nutrition for Healing",
			category: "Wellness",
			read: true,
			description: "Foods and nutrients that support your recovery",
			duration: "7 min read",
		},
		{
			id: 5,
			title: "Physical Therapy Exercises",
			category: "Recovery",
			read: false,
			description: "Safe exercises to regain strength and mobility",
			duration: "10 min read",
		},
		{
			id: 6,
			title: "Pain Management Strategies",
			category: "Wellness",
			read: false,
			description:
				"Non-medication and medication approaches to pain relief",
			duration: "9 min read",
		},
	];

	const categories = ["All", ...new Set(articles.map((a) => a.category))];
	const filteredArticles =
		selectedCategory && selectedCategory !== "All"
			? articles.filter((a) => a.category === selectedCategory)
			: articles;

	return (
		<div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
			<h1 className="text-3xl font-bold text-foreground">
				Education & Resources
			</h1>

			<div className="flex flex-wrap gap-2">
				{categories.map((category) => (
					<button
						key={category}
						onClick={() =>
							setSelectedCategory(
								category === "All" ? null : category
							)
						}
						className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
							(category === "All" && !selectedCategory) ||
							selectedCategory === category
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground hover:bg-muted/80"
						}`}
					>
						{category}
					</button>
				))}
			</div>

			<div className="space-y-3">
				{filteredArticles.map((article) => (
					<Card
						key={article.id}
						className="p-4 cursor-pointer hover:border-primary/50 transition-colors hover:shadow-md"
					>
						<div className="flex items-start justify-between gap-3">
							<div className="flex-1 space-y-2">
								<div className="flex items-center gap-2">
									<p className="font-semibold text-foreground">
										{article.title}
									</p>
									{article.read && (
										<span className="text-xs bg-green-600/20 text-green-700 font-medium p-1 rounded">
											<SquareCheckBig className="w-4 h-4" />
										</span>
									)}
								</div>
								<p className="text-sm text-muted-foreground">
									{article.description}
								</p>
								<div className="flex items-center gap-4 text-xs text-muted-foreground">
									<span>{article.category}</span>
									<span>{article.duration}</span>
								</div>
							</div>
							<div className="text-2xl">→</div>
						</div>
					</Card>
				))}
			</div>

			{filteredArticles.length === 0 && (
				<div className="text-center py-8">
					<p className="text-muted-foreground">
						No articles found in this category
					</p>
				</div>
			)}
		</div>
	);
}

export default PatientResources;
