import { Request, Response } from "express";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

export const getAllDoctors = asyncHandler(
	async (req: Request, res: Response) => {
		const { page = 1, limit = 10 } = req.query;

		const pageNum = parseInt(page as string);
		const limitNum = parseInt(limit as string);
		const skip = (pageNum - 1) * limitNum;

		const [doctors, total] = await Promise.all([
			Doctor.find()
				.populate("userId", "name email firstName lastName isActive")
				.skip(skip)
				.limit(limitNum)
				.sort({ createdAt: -1 }),
			Doctor.countDocuments(),
		]);

		res.sendResponse({
			statusCode: 200,
			success: true,
			data: {
				doctors,
				pagination: {
					currentPage: pageNum,
					totalPages: Math.ceil(total / limitNum),
					totalItems: total,
					itemsPerPage: limitNum,
				},
			},
			message: "Doctors fetched successfully",
		});
	}
);

export const getDoctorById = asyncHandler(
	async (req: Request, res: Response) => {
		const { doctorId } = req.params;

		if (!mongoose.Types.ObjectId.isValid(doctorId)) {
			throw new ApiError("Invalid doctor ID", 400);
		}

		const doctor = await Doctor.findById(doctorId).populate(
			"userId",
			"firstName lastName email"
		);

		if (!doctor) {
			throw new ApiError("Doctor not found", 404);
		}

		res.sendResponse({
			statusCode: 200,
			success: true,
			data: doctor,
			message: "Doctor fetched successfully",
		});
	}
);

export const addDoctor = asyncHandler(async (req: Request, res: Response) => {
	const {
		email,
		firstName,
		lastName,
		password,
		role,
		phone,
		specialization,
		licenseNumber,
	} = req.body;

	if (!email || !firstName || !lastName || !password || !role) {
		throw new ApiError(
			"email, firstName, lastName, password, and role are required",
			400
		);
	}

	const existingUser = await User.findOne({ email });
	if (existingUser) {
		throw new ApiError("User with this email already exists", 409);
	}

	const newUser = await User.create({
		email,
		firstName,
		lastName,
		password,
		role: "doctor",
	});

	const newDoctor = await Doctor.create({
		userId: newUser._id,
		role,
		phone,
		specialization,
		licenseNumber,
	});

	const doctor = await Doctor.findById(newDoctor._id).populate(
		"userId",
		"firstName lastName email"
	);

	res.sendResponse({
		statusCode: 201,
		success: true,
		message: "Doctor added successfully",
		data: doctor,
	});
});

export const updateDoctor = asyncHandler(
	async (req: Request, res: Response) => {
		const { doctorId } = req.params;
		const updates = req.body;

		if (!mongoose.Types.ObjectId.isValid(doctorId)) {
			throw new ApiError("Invalid doctor ID", 400);
		}

		if (updates.userId) {
			throw new ApiError("Cannot update userId", 400);
		}

		const updatedDoctor = await Doctor.findByIdAndUpdate(
			doctorId,
			updates,
			{
				new: true,
				runValidators: true,
			}
		).populate("userId", "name email");

		if (!updatedDoctor) {
			throw new ApiError("Doctor not found", 404);
		}

		res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Doctor updated successfully",
			data: updatedDoctor,
		});
	}
);

export const deleteDoctor = asyncHandler(
	async (req: Request, res: Response) => {
		const { doctorId } = req.params;

		if (!mongoose.Types.ObjectId.isValid(doctorId)) {
			throw new ApiError("Invalid doctor ID", 400);
		}

		const deletedDoctor = await Doctor.findByIdAndDelete(doctorId);

		const deletedUser = await User.findByIdAndDelete(deletedDoctor?.userId);

		if (!deletedDoctor || !deletedUser) {
			throw new ApiError("Doctor not found", 404);
		}

		res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Doctor deleted successfully",
			data: deletedDoctor,
		});
	}
);

export const seedDoctors = asyncHandler(async (req: Request, res: Response) => {
	const doctorData = [
		{
			email: "dr.smith@hospital.com",
			firstName: "John",
			lastName: "Smith",
			password: "Doctor@123",
			role: "Surgeon",
			specialization: "Cardiovascular Surgery",
			licenseNumber: "SRG-2018-001",
			phone: "+1-555-0101",
		},
		{
			email: "dr.johnson@hospital.com",
			firstName: "Emily",
			lastName: "Johnson",
			password: "Doctor@123",
			role: "Cardiologist",
			specialization: "Interventional Cardiology",
			licenseNumber: "CAR-2019-002",
			phone: "+1-555-0102",
		},
		{
			email: "dr.williams@hospital.com",
			firstName: "Michael",
			lastName: "Williams",
			password: "Doctor@123",
			role: "Anesthesiologist",
			specialization: "Cardiac Anesthesia",
			licenseNumber: "ANE-2017-003",
			phone: "+1-555-0103",
		},
		{
			email: "dr.brown@hospital.com",
			firstName: "Sarah",
			lastName: "Brown",
			password: "Doctor@123",
			role: "Nurse",
			specialization: "Critical Care Nursing",
			licenseNumber: "NUR-2020-004",
			phone: "+1-555-0104",
		},
		{
			email: "dr.jones@hospital.com",
			firstName: "David",
			lastName: "Jones",
			password: "Doctor@123",
			role: "Physical Therapist",
			specialization: "Cardiac Rehabilitation",
			licenseNumber: "PHY-2018-005",
			phone: "+1-555-0105",
		},
		{
			email: "dr.garcia@hospital.com",
			firstName: "Maria",
			lastName: "Garcia",
			password: "Doctor@123",
			role: "Care Coordinator",
			specialization: "Patient Care Management",
			licenseNumber: "CRC-2021-006",
			phone: "+1-555-0106",
		},
		{
			email: "dr.miller@hospital.com",
			firstName: "Robert",
			lastName: "Miller",
			password: "Doctor@123",
			role: "Surgeon",
			specialization: "Thoracic Surgery",
			licenseNumber: "SRG-2016-007",
			phone: "+1-555-0107",
		},
		{
			email: "dr.davis@hospital.com",
			firstName: "Jennifer",
			lastName: "Davis",
			password: "Doctor@123",
			role: "Cardiologist",
			specialization: "Electrophysiology",
			licenseNumber: "CAR-2020-008",
			phone: "+1-555-0108",
		},
		{
			email: "dr.rodriguez@hospital.com",
			firstName: "Carlos",
			lastName: "Rodriguez",
			password: "Doctor@123",
			role: "Anesthesiologist",
			specialization: "General Anesthesia",
			licenseNumber: "ANE-2019-009",
			phone: "+1-555-0109",
		},
		{
			email: "dr.martinez@hospital.com",
			firstName: "Laura",
			lastName: "Martinez",
			password: "Doctor@123",
			role: "Nurse",
			specialization: "Surgical Nursing",
			licenseNumber: "NUR-2021-010",
			phone: "+1-555-0110",
		},
		{
			email: "dr.hernandez@hospital.com",
			firstName: "James",
			lastName: "Hernandez",
			password: "Doctor@123",
			role: "Physical Therapist",
			specialization: "Post-Operative Therapy",
			licenseNumber: "PHY-2019-011",
			phone: "+1-555-0111",
		},
		{
			email: "dr.lopez@hospital.com",
			firstName: "Amanda",
			lastName: "Lopez",
			password: "Doctor@123",
			role: "Care Coordinator",
			specialization: "Discharge Planning",
			licenseNumber: "CRC-2020-012",
			phone: "+1-555-0112",
		},
		{
			email: "dr.gonzalez@hospital.com",
			firstName: "Richard",
			lastName: "Gonzalez",
			password: "Doctor@123",
			role: "Surgeon",
			specialization: "Vascular Surgery",
			licenseNumber: "SRG-2017-013",
			phone: "+1-555-0113",
		},
		{
			email: "dr.wilson@hospital.com",
			firstName: "Patricia",
			lastName: "Wilson",
			password: "Doctor@123",
			role: "Cardiologist",
			specialization: "Heart Failure",
			licenseNumber: "CAR-2018-014",
			phone: "+1-555-0114",
		},
		{
			email: "dr.anderson@hospital.com",
			firstName: "Christopher",
			lastName: "Anderson",
			password: "Doctor@123",
			role: "Anesthesiologist",
			specialization: "Pediatric Anesthesia",
			licenseNumber: "ANE-2020-015",
			phone: "+1-555-0115",
		},
		{
			email: "dr.thomas@hospital.com",
			firstName: "Jessica",
			lastName: "Thomas",
			password: "Doctor@123",
			role: "Nurse",
			specialization: "Emergency Nursing",
			licenseNumber: "NUR-2019-016",
			phone: "+1-555-0116",
		},
		{
			email: "dr.taylor@hospital.com",
			firstName: "Daniel",
			lastName: "Taylor",
			password: "Doctor@123",
			role: "Physical Therapist",
			specialization: "Sports Medicine",
			licenseNumber: "PHY-2021-017",
			phone: "+1-555-0117",
		},
		{
			email: "dr.moore@hospital.com",
			firstName: "Michelle",
			lastName: "Moore",
			password: "Doctor@123",
			role: "Care Coordinator",
			specialization: "Case Management",
			licenseNumber: "CRC-2018-018",
			phone: "+1-555-0118",
		},
		{
			email: "dr.jackson@hospital.com",
			firstName: "Kevin",
			lastName: "Jackson",
			password: "Doctor@123",
			role: "Surgeon",
			specialization: "Minimally Invasive Surgery",
			licenseNumber: "SRG-2019-019",
			phone: "+1-555-0119",
		},
		{
			email: "dr.martin@hospital.com",
			firstName: "Elizabeth",
			lastName: "Martin",
			password: "Doctor@123",
			role: "Cardiologist",
			specialization: "Preventive Cardiology",
			licenseNumber: "CAR-2021-020",
			phone: "+1-555-0120",
		},
	];

	const createdDoctors = [];
	const errors = [];

	for (const data of doctorData) {
		try {
			const existingUser = await User.findOne({ email: data.email });
			if (existingUser) {
				errors.push({
					email: data.email,
					message: "User already exists",
				});
				continue;
			}

			const newUser = await User.create({
				email: data.email,
				firstName: data.firstName,
				lastName: data.lastName,
				password: data.password,
				role: "doctor",
			});

			const newDoctor = await Doctor.create({
				userId: newUser._id,
				role: data.role,
				specialization: data.specialization,
				licenseNumber: data.licenseNumber,
				phone: data.phone,
			});

			const doctor = await Doctor.findById(newDoctor._id).populate(
				"userId",
				"firstName lastName email"
			);

			createdDoctors.push(doctor);
		} catch (error: any) {
			errors.push({
				email: data.email,
				message: error.message,
			});
		}
	}

	res.sendResponse({
		statusCode: 201,
		success: true,
		message: `Seeded ${createdDoctors.length} doctors successfully`,
		data: {
			created: createdDoctors,
			failed: errors,
			summary: {
				total: doctorData.length,
				successful: createdDoctors.length,
				failed: errors.length,
			},
		},
	});
});
