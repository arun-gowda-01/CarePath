import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

function PatientProfileSettings() {
	const { user, refetchUser } = useAuth();
	const [loading, setLoading] = useState(false);
	const [showPasswordFields, setShowPasswordFields] = useState(false);

	// Form state
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	// Initialize form with user data
	useEffect(() => {
		if (user?.name) {
			const nameParts = user.name.split(" ");
			setFirstName(nameParts[0] || "");
			setLastName(nameParts.slice(1).join(" ") || "");
		}
		if (user?.email) {
			setEmail(user.email);
		}
	}, [user]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			// Validate password fields if changing password
			if (showPasswordFields) {
				if (!currentPassword) {
					toast.error("Please enter your current password");
					setLoading(false);
					return;
				}
				if (!newPassword || newPassword.length < 6) {
					toast.error("New password must be at least 6 characters");
					setLoading(false);
					return;
				}
				if (newPassword !== confirmPassword) {
					toast.error("New passwords do not match");
					setLoading(false);
					return;
				}
			}

			const updateData: {
				firstName?: string;
				lastName?: string;
				email?: string;
				currentPassword?: string;
				newPassword?: string;
			} = {};

			// Only include fields that have changed
			if (firstName && firstName !== user?.name.split(" ")[0]) {
				updateData.firstName = firstName;
			}
			if (lastName && lastName !== user?.name.split(" ").slice(1).join(" ")) {
				updateData.lastName = lastName;
			}
			if (email && email !== user?.email) {
				updateData.email = email;
			}
			if (showPasswordFields && newPassword) {
				updateData.currentPassword = currentPassword;
				updateData.newPassword = newPassword;
			}

			// Check if there are any changes
			if (Object.keys(updateData).length === 0) {
				toast.info("No changes to save");
				setLoading(false);
				return;
			}

			await authApi.updateProfile(updateData);
			toast.success("Profile updated successfully");
			
			// Refresh user data
			await refetchUser();

			// Reset password fields
			if (showPasswordFields) {
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
				setShowPasswordFields(false);
			}
		} catch (err: unknown) {
			console.error("Error updating profile:", err);
			toast.error(
				(err as { response?: { data?: { message?: string } } }).response?.data
					?.message || "Failed to update profile"
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
			<div className="space-y-2">
				<h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
				<p className="text-muted-foreground">
					Update your personal information and password
				</p>
			</div>

			<Card className="p-6">
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Name Fields */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<Label htmlFor="firstName">First Name</Label>
							<Input
								id="firstName"
								type="text"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								placeholder="Enter your first name"
								required
							/>
						</div>
						<div>
							<Label htmlFor="lastName">Last Name</Label>
							<Input
								id="lastName"
								type="text"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								placeholder="Enter your last name"
								required
							/>
						</div>
					</div>

					{/* Email Field */}
					<div>
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email"
							required
						/>
					</div>

					{/* Password Change Section */}
					<div className="space-y-4 pt-4 border-t border-border">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-semibold text-foreground">
									Change Password
								</h3>
								<p className="text-sm text-muted-foreground">
									Update your password to keep your account secure
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									setShowPasswordFields(!showPasswordFields);
									if (showPasswordFields) {
										setCurrentPassword("");
										setNewPassword("");
										setConfirmPassword("");
									}
								}}
							>
								{showPasswordFields ? "Cancel" : "Change Password"}
							</Button>
						</div>

						{showPasswordFields && (
							<div className="space-y-4">
								<div>
									<Label htmlFor="currentPassword">
										Current Password
									</Label>
									<Input
										id="currentPassword"
										type="password"
										value={currentPassword}
										onChange={(e) =>
											setCurrentPassword(e.target.value)
										}
										placeholder="Enter your current password"
									/>
								</div>
								<div>
									<Label htmlFor="newPassword">New Password</Label>
									<Input
										id="newPassword"
										type="password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										placeholder="Enter your new password (min 6 characters)"
										minLength={6}
									/>
								</div>
								<div>
									<Label htmlFor="confirmPassword">
										Confirm New Password
									</Label>
									<Input
										id="confirmPassword"
										type="password"
										value={confirmPassword}
										onChange={(e) =>
											setConfirmPassword(e.target.value)
										}
										placeholder="Confirm your new password"
										minLength={6}
									/>
								</div>
							</div>
						)}
					</div>

					{/* Submit Button */}
					<div className="flex justify-end gap-3 pt-4">
						<Button
							type="submit"
							disabled={loading}
							className="min-w-[120px]"
						>
							{loading ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</form>
			</Card>
		</div>
	);
}

export default PatientProfileSettings;

