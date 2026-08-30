"use client";

import { useState } from "react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function DoctorProfileSettings() {
	const { user, setUser } =
		useAuth();

	const [showPasswordSection, setShowPasswordSection] =
		useState(false);

	const [currentPassword, setCurrentPassword] =
		useState("");

	const [newPassword, setNewPassword] =
		useState("");

	const [confirmPassword, setConfirmPassword] =
		useState("");

	const [savingPassword, setSavingPassword] =
		useState(false);

	const handleChangePassword = async () => {
		if (!currentPassword) {
			toast.error(
				"Please enter your current password"
			);
			return;
		}

		if (!newPassword) {
			toast.error(
				"Please enter a new password"
			);
			return;
		}

		if (newPassword.length < 6) {
			toast.error(
				"New password must be at least 6 characters"
			);
			return;
		}

		if (
			newPassword !==
			confirmPassword
		) {
			toast.error(
				"New passwords do not match"
			);
			return;
		}

		if (
			currentPassword ===
			newPassword
		) {
			toast.error(
				"New password must be different from your current password"
			);
			return;
		}

		try {
			setSavingPassword(true);

			const response =
				await authApi.updateProfile({
					currentPassword,
					newPassword,
				});

			if (
				response.data?.success !==
				false
			) {
				toast.success(
					"Password changed successfully"
				);

				setCurrentPassword(
					""
				);

				setNewPassword(
					""
				);

				setConfirmPassword(
					""
				);

				setShowPasswordSection(
					false
				);

				// Keep the current authenticated user.
				// The password change does not change profile data.
				if (user) {
					setUser(user);
				}
			}
		} catch (error) {
			console.error(
				"Password change failed:",
				error
			);

			const err =
				error as {
					response?: {
						data?: {
							message?: string;
						};
					};
				};

			toast.error(
				err.response?.data
					?.message ||
					"Failed to change password"
			);
		} finally {
			setSavingPassword(
				false
			);
		}
	};

	return (
		<div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
			<div>
				<h1 className="text-3xl font-bold text-foreground">
					Doctor Profile
				</h1>

				<p className="mt-1 text-muted-foreground">
					Manage your account and security settings
				</p>
			</div>

			{/* Profile information */}

			<Card className="p-6">
				<div className="space-y-4">
					<h2 className="text-lg font-semibold text-foreground">
						Profile Information
					</h2>

					<div className="grid gap-4 md:grid-cols-2">
						<div>
							<Label>
								Name
							</Label>

							<Input
								value={
									user?.name ||
									""
								}
								disabled
								className="mt-2"
							/>
						</div>

						<div>
							<Label>
								Email
							</Label>

							<Input
								value={
									user?.email ||
									""
								}
								disabled
								className="mt-2"
							/>
						</div>
					</div>

					<p className="text-sm text-muted-foreground">
						Your account details are managed by the
						system administrator.
					</p>
				</div>
			</Card>

			{/* Security */}

			<Card className="p-6">
				<div className="space-y-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 className="text-lg font-semibold text-foreground">
								Security
							</h2>

							<p className="text-sm text-muted-foreground">
								Update your account password
								securely.
							</p>
						</div>

						<Button
							variant="outline"
							onClick={() => {
								setShowPasswordSection(
									(
										previous
									) =>
										!previous
								);
							}}
						>
							{showPasswordSection
								? "Cancel"
								: "Change Password"}
						</Button>
					</div>

					{showPasswordSection && (
						<div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
							<div>
								<Label htmlFor="doctor-current-password">
									Current Password
								</Label>

								<Input
									id="doctor-current-password"
									type="password"
									value={
										currentPassword
									}
									onChange={(
										event
									) =>
										setCurrentPassword(
											event
												.target
												.value
										)
									}
									placeholder="Enter your current password"
									className="mt-2"
								/>
							</div>

							<div>
								<Label htmlFor="doctor-new-password">
									New Password
								</Label>

								<Input
									id="doctor-new-password"
									type="password"
									value={
										newPassword
									}
									onChange={(
										event
									) =>
										setNewPassword(
											event
												.target
												.value
										)
									}
									placeholder="Enter your new password"
									className="mt-2"
								/>

								<p className="mt-1 text-xs text-muted-foreground">
									Minimum 6 characters
								</p>
							</div>

							<div>
								<Label htmlFor="doctor-confirm-password">
									Confirm New Password
								</Label>

								<Input
									id="doctor-confirm-password"
									type="password"
									value={
										confirmPassword
									}
									onChange={(
										event
									) =>
										setConfirmPassword(
											event
												.target
												.value
										)
									}
									placeholder="Confirm your new password"
									className="mt-2"
								/>
							</div>

							<div className="flex justify-end">
								<Button
									onClick={
										handleChangePassword
									}
									disabled={
										savingPassword
									}
								>
									{savingPassword
										? "Updating..."
										: "Update Password"}
								</Button>
							</div>
						</div>
					)}
				</div>
			</Card>
		</div>
	);
}