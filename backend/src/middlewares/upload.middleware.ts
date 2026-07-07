import multer from "multer";
import path from "path";
import { Request } from "express";

// Configure storage
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./uploads/temp"); // Temporary storage before Cloudinary upload
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(
			null,
			file.fieldname +
				"-" +
				uniqueSuffix +
				path.extname(file.originalname)
		);
	},
});

// File filter to accept only images
const fileFilter = (
	req: Request,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback
) => {
	const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new Error(
				"Invalid file type. Only JPEG, PNG, and WebP images are allowed."
			)
		);
	}
};

// Configure multer
const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB max file size
	},
});

export default upload;
