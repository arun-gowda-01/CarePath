# CarePath AI Development Guide

## Architecture Overview

CarePath is a full-stack post-surgery recovery tracking system with a **React/Vite frontend** and **Express/TypeScript backend** using MongoDB. The system implements role-based access control (Admin, Doctor, Patient) with JWT authentication via HTTP-only cookies.

### Key Components

-   **Backend:** Express + TypeScript + Mongoose, running on port 8000
-   **Frontend:** React 19 + Vite + shadcn/ui + TailwindCSS, running on port 5173
-   **Auth:** JWT tokens stored in HTTP-only cookies, validated via `authMiddleware`
-   **Data Flow:** Patient check-ins → AI risk analysis → automated alert generation

## Critical Backend Patterns

### 1. Error Handling & Response Pattern

ALL controller functions MUST use `asyncHandler` wrapper and `res.sendResponse()`:

```typescript
import asyncHandler from "../utils/asyncHandler.js";

export const myController = asyncHandler(
	async (req: Request, res: Response) => {
		// Your logic here
		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Operation successful",
			data: result,
		});
	}
);
```

**Never** use raw `res.json()` or `res.status().send()` - it breaks the standardized error handling.

### 2. Custom Validation System

This project does NOT use Zod for validation in controllers. Use the custom `validateRequest` utility:

```typescript
import { validateRequest } from "../utils/validation.js";

validateRequest([
	{ field: "email", value: email, rules: { required: true, type: "email" } },
	{
		field: "painLevel",
		value: painLevel,
		rules: { required: true, type: "number", min: 0, max: 10 },
	},
	{
		field: "mood",
		value: mood,
		rules: { required: true, enum: ["poor", "okay", "good", "excellent"] },
	},
]);
```

See `backend/src/utils/validation.ts` for all available validation rules.

### 3. Module System

Backend uses **ES Modules** (`"type": "module"` in package.json). All imports MUST include `.js` extension:

```typescript
import User from "./models/User.js"; // ✅ Correct
import User from "./models/User"; // ❌ Wrong
```

### 4. MongoDB Model Patterns

Models use Mongoose with virtual properties for computed fields:

```typescript
// Patient.ts has virtuals for age and daysPostOp
patientSchema.virtual("age").get(function(this: IPatient) { ... });
```

Reference other models using `Schema.Types.ObjectId` with `ref` for population.

### 5. AI-Driven Risk Analysis

The `submitSymptomCheckIn` controller automatically analyzes vitals and creates alerts:

-   **Critical:** Temperature >101°F or <95°F, or Pain ≥8/10 → Updates patient.riskLevel to "critical"
-   **Warning:** Pain ≥6/10 or Temperature >99.5°F → Sets riskLevel to "monitor"
-   **Normal:** Everything else → Logs normally

This logic is in `backend/src/controllers/symptom-checkin.controller.ts` - maintain these thresholds.

## Frontend Architecture

### Context & Authentication

Auth state managed via `AuthContext` (`frontend/src/context/AuthContext.tsx`). Protected routes use `ProtectedRoute` component with role-based access:

```tsx
<ProtectedRoute roles={["patient"]}>
	<PatientHeader />
	<Outlet />
</ProtectedRoute>
```

### API Client Pattern

All API calls go through centralized client (`frontend/src/lib/api.ts`) with automatic cookie handling:

```typescript
import { patientApi } from "@/lib/api";

const { data } = await patientApi.submitCheckIn({ painLevel, temperature, ... });
```

The axios instance has a global 401 interceptor that redirects to `/login`.

### Layout System

Three role-based layouts in `frontend/src/layouts/`:

-   `AdminLayout` - Full admin dashboard with management tools
-   `DoctorLayout` - Patient monitoring and clinical notes
-   `PatientLayout` - Personal health tracking and messaging

## Development Workflow

### Starting Development

```bash
# Backend (port 8000)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

### Environment Variables

Backend requires `.env` with:

```
PORT=8000
MONGODB_URI=mongodb://localhost:27017/carepath
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

### Building for Production

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
```

### Seeding Test Data

After registering an admin via `/api/v1/register-admin`, use admin routes to seed:

-   POST `/api/v1/admin/seed-patients` - Creates sample patients
-   POST `/api/v1/admin/seed-doctors` - Creates sample doctors

## Key Conventions

### File Naming

-   Backend controllers: `kebab-case.controller.ts` (e.g., `symptom-checkin.controller.ts`)
-   Frontend components: `PascalCase.tsx` (e.g., `PatientHeader.tsx`)
-   Models: `PascalCase.ts` (e.g., `Patient.ts`, `SymptomCheckIn.ts`)

### Route Structure

Routes are role-protected at the router level in `backend/src/app.ts`:

```typescript
app.use("/api/v1/admin", authMiddleware, authorizeAdmin, adminRouter);
app.use("/api/v1/patient", authMiddleware, authorizePatient, patientRouter);
app.use("/api/v1/doctor", authMiddleware, authorizeDoctor, doctorRouter);
```

### Database Relationships

-   `User` → `Patient` (1:1 via userId)
-   `User` → `Doctor` (1:1 via userId)
-   `Doctor` ↔ `Patient` (M:N via Assignment model)
-   `Patient` → `SymptomCheckIn`, `Task`, `Alert`, `Note` (1:N)

### TypeScript Extensions

Backend extends Express types in `backend/src/types/express.d.ts`:

-   `req.user` - Injected by `authMiddleware`, contains { id, email, role, name }
-   `res.sendResponse()` - Custom response method from `apiResponseHandler` middleware

## Common Tasks

### Adding a New API Endpoint

1. Create controller function in appropriate `controllers/*.controller.ts` using `asyncHandler`
2. Add route in corresponding `routers/*.route.ts`
3. Add client method in `frontend/src/lib/api.ts`
4. Update TypeScript types in `frontend/src/lib/types.ts` if needed

### Adding Role-Based Authorization

Apply middleware in route definition:

```typescript
router.post("/sensitive-action", authMiddleware, authorizeDoctor, myController);
```

### Creating a New Model

1. Define interface extending `Document` in `backend/src/models/YourModel.ts`
2. Export model instance using `mongoose.model<IYourModel>()`
3. Add model to `backend/src/models/index.ts` if needed

## Debugging Tips

-   Backend logs Zod validation errors in development mode (see `asyncHandler`)
-   Frontend API errors trigger automatic redirect on 401 (see axios interceptor)
-   Check `req.user` in controllers - it's undefined if `authMiddleware` isn't applied
-   MongoDB connection errors show in backend console on startup (`db.ts`)

## Future Features (Not Yet Implemented)

-   Socket.IO for real-time notifications
-   Email notifications (Nodemailer)
-   File uploads for medical images (planned AWS S3)
-   PDF report generation
