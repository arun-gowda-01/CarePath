import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import User, { IUser } from "../models/User.js";
import Patient, { IPatient } from "../models/Patient.js";
import { ApiError } from "../utils/apiError.js";
import { validateRequest } from "../utils/validation.js";

export const getAllPatients = asyncHandler(
	async (req: Request, res: Response) => {
		const { page = 1, limit = 10 } = req.query;

		const skip = (Number(page) - 1) * Number(limit);

		let patients = await Patient.find()
			.populate({
				path: "userId",
				select: "firstName lastName email isActive",
			})
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(Number(limit));

		const total = await Patient.countDocuments();

		const cleanedPatients = patients.map((patient) => {
			const obj = patient.toObject({ virtuals: true });
			const { adherenceRate, recoveryProgress, phone, ...cleaned } = obj;
			return cleaned;
		});

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Patients retrieved successfully",
			data: {
				patients: cleanedPatients,
				pagination: {
					currentPage: Number(page),
					totalPages: Math.ceil(total / Number(limit)),
					totalPatients: total,
					limit: Number(limit),
				},
			},
		});
	}
);

export const getPatientById = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;

		const patient = await Patient.findById(patientId).populate(
			"userId",
			"firstName lastName email"
		);

		if (!patient) {
			throw new ApiError("Patient not found", 404);
		}

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Patient retrieved successfully",
			data: patient.toObject({ virtuals: true }),
		});
	}
);

export const addPatient = asyncHandler(async (req: Request, res: Response) => {
	const {
		firstName,
		lastName,
		email,
		password,
		dateOfBirth,
		phone,
		address,
		procedure,
		procedureDate,
		riskLevel,
		monitoringDays,
	} = req.body;

	validateRequest([
		{
			field: "firstName",
			value: firstName,
			rules: { required: true, type: "string", minLength: 1 },
		},
		{
			field: "lastName",
			value: lastName,
			rules: { required: true, type: "string", minLength: 1 },
		},
		{
			field: "email",
			value: email,
			rules: { required: true, type: "email" },
		},
		{
			field: "password",
			value: password,
			rules: { required: true, type: "string", minLength: 6 },
		},
		{
			field: "dateOfBirth",
			value: dateOfBirth,
			rules: { required: true, type: "date" },
		},
		{
			field: "procedure",
			value: procedure,
			rules: { required: true, type: "string", minLength: 1 },
		},
		{
			field: "procedureDate",
			value: procedureDate,
			rules: { required: true, type: "date" },
		},
		{
			field: "riskLevel",
			value: riskLevel,
			rules: { enum: ["stable", "monitor", "critical"] },
		},
	]);

	const existingUser = await User.findOne({ email });
	if (existingUser) {
		throw new ApiError("User with this email already exists", 400);
	}

	const user = await User.create({
		firstName,
		lastName,
		email,
		password,
		role: "patient",
	});

	const patient = await Patient.create({
		userId: user._id,
		dateOfBirth: new Date(dateOfBirth),
		phone,
		address,
		procedure,
		procedureDate: new Date(procedureDate),
		riskLevel: riskLevel || "stable",
		monitoringDays: monitoringDays || 7,
	});

	return res.sendResponse({
		statusCode: 201,
		success: true,
		message: "Patient added successfully",
		data: {
			userId: user._id,
			patientId: patient._id,
			fullName: user.fullName,
			email: user.email,
			procedure: patient.procedure,
			status: patient.status,
		},
	});
});

export const updatePatient = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;
		const {
			firstName,
			lastName,
			phone,
			address,
			dateOfBirth,
			procedure,
			procedureDate,
			riskLevel,
			adherenceRate,
			recoveryProgress,
			status,
			monitoringDays,
		} = req.body;

		const patient = await Patient.findById(patientId).populate("userId");
		if (!patient) {
			throw new ApiError("Patient not found", 404);
		}

		const updateData: Partial<IPatient & IUser> = {};
		if (firstName !== undefined) updateData.firstName = firstName;
		if (lastName !== undefined) updateData.lastName = lastName;
		if (phone !== undefined) updateData.phone = phone;
		if (address !== undefined) updateData.address = address;
		if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
		if (procedure) updateData.procedure = procedure;
		if (procedureDate) updateData.procedureDate = new Date(procedureDate);
		if (riskLevel) updateData.riskLevel = riskLevel;
		if (adherenceRate !== undefined)
			updateData.adherenceRate = adherenceRate;
		if (recoveryProgress !== undefined)
			updateData.recoveryProgress = recoveryProgress;
		if (status) updateData.status = status;
		if (monitoringDays !== undefined)
			(updateData as any).monitoringDays = monitoringDays;

		const updatedPatient = await Patient.findByIdAndUpdate(
			patientId,
			updateData,
			{ new: true }
		).populate("userId", "fullName email");

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Patient updated successfully",
			data: updatedPatient,
		});
	}
);

export const seedPatients = asyncHandler(
	async (req: Request, res: Response) => {
		const samplePatients = [
			{
				firstName: "John",
				lastName: "Smith",
				email: "john.smith@example.com",
				password: "password",
				dateOfBirth: "1985-03-15",
				phone: "+1234567890",
				address: "123 Main St, New York, NY 10001",
				procedure: "Knee Replacement",
				procedureDate: "2024-01-15",
				riskLevel: "moderate",
			},
			{
				firstName: "Sarah",
				lastName: "Johnson",
				email: "sarah.j@example.com",
				password: "password",
				dateOfBirth: "1990-07-22",
				phone: "+1234567891",
				address: "456 Oak Ave, Los Angeles, CA 90001",
				procedure: "Hip Surgery",
				procedureDate: "2024-01-20",
				riskLevel: "stable",
			},
			{
				firstName: "Michael",
				lastName: "Brown",
				email: "m.brown@example.com",
				password: "password",
				dateOfBirth: "1978-11-30",
				phone: "+1234567892",
				address: "789 Pine Rd, Chicago, IL 60601",
				procedure: "Spinal Fusion",
				procedureDate: "2024-02-01",
				riskLevel: "critical",
			},
			{
				firstName: "Emily",
				lastName: "Davis",
				email: "emily.d@example.com",
				password: "password",
				dateOfBirth: "1995-05-18",
				phone: "+1234567893",
				address: "321 Elm St, Houston, TX 77001",
				procedure: "ACL Repair",
				procedureDate: "2024-02-10",
				riskLevel: "stable",
			},
			{
				firstName: "David",
				lastName: "Wilson",
				email: "d.wilson@example.com",
				password: "password",
				dateOfBirth: "1982-09-25",
				phone: "+1234567894",
				address: "654 Maple Dr, Phoenix, AZ 85001",
				procedure: "Shoulder Surgery",
				procedureDate: "2024-02-15",
				riskLevel: "moderate",
			},
			{
				firstName: "Jennifer",
				lastName: "Martinez",
				email: "j.martinez@example.com",
				password: "password",
				dateOfBirth: "1988-12-08",
				phone: "+1234567895",
				address: "987 Cedar Ln, Philadelphia, PA 19019",
				procedure: "Meniscus Repair",
				procedureDate: "2024-02-20",
				riskLevel: "stable",
			},
			{
				firstName: "Robert",
				lastName: "Taylor",
				email: "r.taylor@example.com",
				password: "password",
				dateOfBirth: "1975-04-12",
				phone: "+1234567896",
				address: "147 Birch St, San Antonio, TX 78201",
				procedure: "Rotator Cuff Surgery",
				procedureDate: "2024-03-01",
				riskLevel: "moderate",
			},
			{
				firstName: "Lisa",
				lastName: "Anderson",
				email: "l.anderson@example.com",
				password: "password",
				dateOfBirth: "1992-08-19",
				phone: "+1234567897",
				address: "258 Spruce Ave, San Diego, CA 92101",
				procedure: "Ankle Surgery",
				procedureDate: "2024-03-05",
				riskLevel: "stable",
			},
			{
				firstName: "James",
				lastName: "Thomas",
				email: "j.thomas@example.com",
				password: "password",
				dateOfBirth: "1980-01-28",
				phone: "+1234567898",
				address: "369 Willow Rd, Dallas, TX 75201",
				procedure: "Back Surgery",
				procedureDate: "2024-03-10",
				riskLevel: "critical",
			},
			{
				firstName: "Mary",
				lastName: "Jackson",
				email: "m.jackson@example.com",
				password: "password",
				dateOfBirth: "1987-06-14",
				phone: "+1234567899",
				address: "741 Ash Dr, San Jose, CA 95101",
				procedure: "Carpal Tunnel Surgery",
				procedureDate: "2024-03-15",
				riskLevel: "stable",
			},
			{
				firstName: "Christopher",
				lastName: "White",
				email: "c.white@example.com",
				password: "password",
				dateOfBirth: "1983-10-03",
				phone: "+1234567800",
				address: "852 Poplar St, Austin, TX 78701",
				procedure: "Hernia Repair",
				procedureDate: "2024-03-20",
				riskLevel: "moderate",
			},
			{
				firstName: "Patricia",
				lastName: "Harris",
				email: "p.harris@example.com",
				password: "password",
				dateOfBirth: "1991-02-27",
				phone: "+1234567801",
				address: "963 Hickory Ln, Jacksonville, FL 32099",
				procedure: "Gallbladder Surgery",
				procedureDate: "2024-03-25",
				riskLevel: "stable",
			},
			{
				firstName: "Daniel",
				lastName: "Martin",
				email: "d.martin@example.com",
				password: "password",
				dateOfBirth: "1979-07-09",
				phone: "+1234567802",
				address: "159 Walnut Ave, Fort Worth, TX 76101",
				procedure: "Appendectomy",
				procedureDate: "2024-04-01",
				riskLevel: "moderate",
			},
			{
				firstName: "Barbara",
				lastName: "Thompson",
				email: "b.thompson@example.com",
				password: "password",
				dateOfBirth: "1994-11-16",
				phone: "+1234567803",
				address: "357 Sycamore Rd, Columbus, OH 43085",
				procedure: "Tonsillectomy",
				procedureDate: "2024-04-05",
				riskLevel: "stable",
			},
			{
				firstName: "Matthew",
				lastName: "Garcia",
				email: "m.garcia@example.com",
				password: "password",
				dateOfBirth: "1986-03-21",
				phone: "+1234567804",
				address: "486 Dogwood Dr, Charlotte, NC 28201",
				procedure: "Cataract Surgery",
				procedureDate: "2024-04-10",
				riskLevel: "stable",
			},
			{
				firstName: "Elizabeth",
				lastName: "Rodriguez",
				email: "e.rodriguez@example.com",
				password: "password",
				dateOfBirth: "1981-08-05",
				phone: "+1234567805",
				address: "597 Magnolia St, San Francisco, CA 94102",
				procedure: "Thyroid Surgery",
				procedureDate: "2024-04-15",
				riskLevel: "moderate",
			},
			{
				firstName: "Joseph",
				lastName: "Lee",
				email: "j.lee@example.com",
				password: "password",
				dateOfBirth: "1993-12-29",
				phone: "+1234567806",
				address: "608 Chestnut Ln, Indianapolis, IN 46201",
				procedure: "Dental Implant",
				procedureDate: "2024-04-20",
				riskLevel: "stable",
			},
			{
				firstName: "Susan",
				lastName: "Walker",
				email: "s.walker@example.com",
				password: "password",
				dateOfBirth: "1977-05-11",
				phone: "+1234567807",
				address: "719 Redwood Ave, Seattle, WA 98101",
				procedure: "Hysterectomy",
				procedureDate: "2024-04-25",
				riskLevel: "critical",
			},
			{
				firstName: "Thomas",
				lastName: "Hall",
				email: "t.hall@example.com",
				password: "password",
				dateOfBirth: "1989-09-17",
				phone: "+1234567808",
				address: "820 Beech Rd, Denver, CO 80201",
				procedure: "Prostate Surgery",
				procedureDate: "2024-05-01",
				riskLevel: "moderate",
			},
			{
				firstName: "Karen",
				lastName: "Allen",
				email: "k.allen@example.com",
				password: "password",
				dateOfBirth: "1984-01-23",
				phone: "+1234567809",
				address: "931 Palm Dr, Boston, MA 02101",
				procedure: "Breast Surgery",
				procedureDate: "2024-05-05",
				riskLevel: "moderate",
			},
		];

		const createdPatients = [];
		const errors = [];

		for (const patientData of samplePatients) {
			try {
				const existingUser = await User.findOne({
					email: patientData.email,
				});
				if (existingUser) {
					errors.push({
						email: patientData.email,
						error: "User already exists",
					});
					continue;
				}

				const user = await User.create({
					firstName: patientData.firstName,
					lastName: patientData.lastName,
					email: patientData.email,
					password: patientData.password,
					role: "patient",
				});

				const patient = await Patient.create({
					userId: user._id,
					dateOfBirth: new Date(patientData.dateOfBirth),
					phone: patientData.phone,
					address: patientData.address,
					procedure: patientData.procedure,
					procedureDate: new Date(patientData.procedureDate),
					riskLevel: patientData.riskLevel,
				});

				createdPatients.push({
					userId: user._id,
					patientId: patient._id,
					fullName: user.fullName,
					email: user.email,
				});
			} catch (error: any) {
				errors.push({
					email: patientData.email,
					error: error.message,
				});
			}
		}

		return res.sendResponse({
			statusCode: 201,
			success: true,
			message: `Successfully created ${createdPatients.length} patients`,
			data: {
				created: createdPatients,
				failed: errors,
				total: samplePatients.length,
			},
		});
	}
);

export const deletePatient = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;

		const patient = await Patient.findById(patientId);
		if (!patient) {
			throw new ApiError("Patient not found", 404);
		}

		await User.findByIdAndDelete(patient.userId);

		await Patient.findByIdAndDelete(patientId);

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Patient deleted successfully",
		});
	}
);
