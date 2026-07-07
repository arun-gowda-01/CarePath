import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});
/**
 * Upload a file to Cloudinary
 * @param localFilePath - Path to the local file
 * @param folder - Folder in Cloudinary to store the file
 * @returns Upload result with URL and public_id
 */
export const uploadToCloudinary = async (
	localFilePath: string,
	folder: string = "carepath/check-ins"
): Promise<{ url: string; publicId: string; filename: string } | null> => {
	try {
		if (!localFilePath) {
			return null;
		}

		// Upload file to Cloudinary
		const response = await cloudinary.uploader.upload(localFilePath, {
			folder,
			resource_type: "auto",
			transformation: [
				{ width: 1200, height: 1200, crop: "limit" }, // Resize to max 1200x1200
				{ quality: "auto:good" }, // Optimize quality
			],
		});

		// Delete local file after successful upload
		fs.unlinkSync(localFilePath);

		return {
			url: response.secure_url,
			publicId: response.public_id,
			filename: response.original_filename,
		};
	} catch (error) {
		// Delete local file if upload fails
		if (fs.existsSync(localFilePath)) {
			fs.unlinkSync(localFilePath);
		}
		console.error("Cloudinary upload error:", error);
		return null;
	}
};

/**
 * Delete a file from Cloudinary
 * @param publicId - Public ID of the file to delete
 */
export const deleteFromCloudinary = async (
	publicId: string
): Promise<boolean> => {
	try {
		await cloudinary.uploader.destroy(publicId);
		return true;
	} catch (error) {
		console.error("Cloudinary delete error:", error);
		return false;
	}
};

export default cloudinary;
