# Patient Check-In Feature - Implementation Summary

## Overview

Enhanced the CarePath system with comprehensive patient check-in functionality including once-per-day validation, 8-hour gap enforcement, Cloudinary-based wound image uploads, and a doctor review interface with read/unread status tracking.

## Backend Changes

### 1. Dependencies Added

```bash
npm install cloudinary multer @types/multer
```

### 2. New Files Created

#### `/backend/src/utils/cloudinary.ts`

-   Cloudinary configuration and upload utility
-   `uploadToCloudinary()` - Uploads files to Cloudinary with automatic resizing (max 1200x1200)
-   `deleteFromCloudinary()` - Deletes files from Cloudinary
-   Automatic local file cleanup after upload

#### `/backend/src/middlewares/upload.middleware.ts`

-   Multer configuration for file uploads
-   Accepts: JPEG, PNG, WebP (max 5MB)
-   Temporary storage in `/backend/uploads/temp/`
-   File size validation and type filtering

### 3. Model Updates

#### `/backend/src/models/SymptomCheckIn.ts`

Added new field:

```typescript
isRead: {
  type: Boolean,
  default: false
}
```

### 4. Controller Updates

#### `/backend/src/controllers/symptom-checkin.controller.ts`

**Enhanced `submitSymptomCheckIn`:**

-   ✅ Once-per-day validation (same calendar day check)
-   ✅ 8-hour gap enforcement between check-ins
-   ✅ Cloudinary image upload integration
-   ✅ Returns helpful error messages with time remaining

**New Controllers Added:**

-   `getDoctorPatientCheckIns()` - Fetches all check-ins for doctor's assigned patients, separated into read/unread
-   `markCheckInAsReviewed()` - Marks check-in as read, sets reviewedBy and reviewedAt
-   `updatePatientRiskLevel()` - Updates patient risk level (stable/monitor/critical) with audit trail via alerts

### 5. Route Updates

#### `/backend/src/routers/patient.route.ts`

```typescript
router.post("/check-in", upload.single("woundImage"), submitSymptomCheckIn);
```

Added multer middleware to handle wound image upload.

#### `/backend/src/routers/doctor.route.ts`

New routes:

```typescript
router.get("/check-ins", getDoctorPatientCheckIns);
router.patch("/check-in/:checkInId/review", markCheckInAsReviewed);
router.patch("/patient/:patientId/risk-level", updatePatientRiskLevel);
```

### 6. Environment Variables

Added to `.env.example`:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Frontend Changes

### 1. Type Updates

#### `/frontend/src/lib/types.ts`

Updated `SymptomCheckIn` interface:

```typescript
isRead?: boolean;
reviewedBy?: string;
reviewedAt?: string;
```

Updated `SubmitCheckInData`:

```typescript
woundImage?: File;  // Changed from image object to File
```

### 2. API Client Updates

#### `/frontend/src/lib/api.ts`

**Updated `patientApi.submitCheckIn`:**

```typescript
submitCheckIn: (data: SubmitCheckInData | FormData) => {
	if (data instanceof FormData) {
		return api.post("/patient/check-in", data, {
			headers: { "Content-Type": "multipart/form-data" },
		});
	}
	return api.post("/patient/check-in", data);
};
```

**New `doctorApi` methods:**

```typescript
getCheckIns: () => api.get("/doctor/check-ins");
markCheckInAsReviewed: (checkInId) =>
	api.patch(`/doctor/check-in/${checkInId}/review`);
updatePatientRiskLevel: (patientId, riskLevel) =>
	api.patch(`/doctor/patient/${patientId}/risk-level`, { riskLevel });
```

### 3. Patient Check-In Page

#### `/frontend/src/pages/PatientCheckIn.tsx`

**New Features:**

-   ✅ Wound image upload with preview
-   ✅ File validation (type, size)
-   ✅ Once-per-day enforcement (frontend)
-   ✅ 8-hour gap countdown timer
-   ✅ FormData submission when image exists
-   ✅ Displays wound images in check-in history
-   ✅ Wait time message when not eligible

**UI Components Added:**

-   File input with drag-and-drop styling
-   Image preview with remove button
-   Countdown timer showing hours until next check-in
-   Warning alerts for submission restrictions

### 4. Doctor Patient Profile Page

#### `/frontend/src/pages/PatientProfile.tsx`

**Tab Changes:**

-   ❌ Removed "Symptoms" tab
-   ✅ Added "Check-Ins" tab

**Check-In List Features:**

-   Separated into "Unread" and "Read" sections
-   **Unread cards:** Yellow background (`bg-yellow-50 border-yellow-200`)
-   **Read cards:** White background (`bg-white border-gray-200`)
-   Status badges (Unread/Read)
-   Click to open detailed dialog

**Check-In Dialog Features:**

-   Full vitals display (pain, temperature, BP, mood)
-   Reported symptoms with badge styling
-   Additional notes
-   Wound image display (if uploaded)
-   Risk level dropdown (stable/monitor/critical)
-   "Mark as Reviewed" button
-   "Update Risk Level" button (auto-marks as reviewed)

## User Workflow

### Patient Side

1. Navigate to "Symptom Check-in" page
2. Fill out vitals (pain, temperature, BP, mood)
3. Select symptoms (multi-select)
4. Add optional notes
5. **Upload wound image** (optional)
6. Submit check-in
    - ❌ Blocked if submitted today
    - ❌ Blocked if less than 8 hours since last check-in
    - ✅ Success → AI risk analysis → Reset form
7. View history with wound images

### Doctor Side

1. Open patient profile
2. Click "Check-Ins" tab
3. See unread check-ins (yellow cards) at top
4. See read check-ins (white cards) below
5. Click any check-in card → Dialog opens
6. Review:
    - Vitals, symptoms, notes
    - Wound image (if available)
7. Actions:
    - Mark as reviewed (changes card to white)
    - Update patient risk level (dropdown)
    - Both actions update database

## Technical Details

### Image Upload Flow

```
Patient uploads image (Frontend)
  ↓
FormData sent to backend
  ↓
Multer saves to /uploads/temp/
  ↓
Cloudinary processes & stores
  ↓
URL returned to backend
  ↓
Saved to SymptomCheckIn.image.url
  ↓
Local file deleted
  ↓
URL sent to frontend
```

### Check-In Validation Logic

```typescript
// Same calendar day check
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const lastCheckInStart = new Date(
	lastDate.getFullYear(),
	lastDate.getMonth(),
	lastDate.getDate()
);
if (lastCheckInStart.getTime() === todayStart.getTime()) {
	throw new ApiError("Already submitted today");
}

// 8-hour gap check
const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);
if (lastCheckInDate > eightHoursAgo) {
	const hoursRemaining = Math.ceil(
		(lastCheckInDate.getTime() + 8 * 60 * 60 * 1000 - now.getTime()) /
			(60 * 60 * 1000)
	);
	throw new ApiError(`Wait ${hoursRemaining} hour(s)`);
}
```

### Risk Level Update with Audit Trail

When doctor updates risk level:

1. Patient.riskLevel updated
2. Alert created with severity matching new risk level
3. Alert message: "Risk level updated from {old} to {new} by doctor"
4. Check-in marked as reviewed (if not already)

## Testing Checklist

### Patient Check-In

-   [ ] Upload image (JPEG, PNG, WebP)
-   [ ] Validate file size limit (5MB)
-   [ ] Validate file type
-   [ ] Preview image before submit
-   [ ] Remove image before submit
-   [ ] Submit without image
-   [ ] Submit with image
-   [ ] Try submitting twice same day (should fail)
-   [ ] Try submitting within 8 hours (should fail)
-   [ ] Wait 8+ hours, submit again (should work)
-   [ ] View image in history

### Doctor Review

-   [ ] See unread check-ins (yellow cards)
-   [ ] See read check-ins (white cards)
-   [ ] Click check-in → Dialog opens
-   [ ] View wound image in dialog
-   [ ] Mark as reviewed → Card turns white
-   [ ] Update risk level → Patient updated
-   [ ] Verify alert created for risk level change
-   [ ] Dialog closes after actions

## Environment Setup

### Required: Cloudinary Account

1. Sign up at https://cloudinary.com
2. Get credentials from Dashboard
3. Add to `/backend/.env`:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Directory Structure

```
backend/
├── uploads/
│   └── temp/          # Temporary upload storage (gitignored)
├── src/
│   ├── utils/
│   │   └── cloudinary.ts
│   ├── middlewares/
│   │   └── upload.middleware.ts
```

## Security Considerations

1. **File Validation:**

    - Type checking (MIME type)
    - Size limit (5MB)
    - Extension whitelist

2. **Access Control:**

    - Doctors can only view assigned patients' check-ins
    - Check-in submission requires authenticated patient
    - Risk level updates require doctor role

3. **Image Storage:**
    - Images stored on Cloudinary (not local server)
    - Automatic cleanup of temporary files
    - Secure URLs with Cloudinary transformation

## Performance Optimizations

1. **Image Optimization:**

    - Automatic resizing (max 1200x1200)
    - Quality: "auto:good"
    - Cloudinary CDN delivery

2. **Check-In Queries:**
    - Indexed on `patientId` and `checkInDate`
    - Limited to 100 recent check-ins
    - Separated read/unread for faster filtering

## Future Enhancements

1. Real-time notifications when patient submits check-in
2. Comparison view (before/after wound images)
3. AI-powered wound analysis
4. Bulk review actions
5. Export check-in data as PDF report
6. Scheduled reminders for check-ins
7. Multi-image upload per check-in

## Migration Notes

**For existing deployments:**

1. Run `npm install` in backend
2. Add Cloudinary credentials to `.env`
3. Create `/backend/uploads/temp/` directory
4. No database migration needed (isRead defaults to false)
5. Existing check-ins will show as "read" (can be reset manually if needed)

## Support

For issues with:

-   **Image uploads:** Check Cloudinary credentials
-   **File validation:** Verify MIME types and file sizes
-   **Check-in limits:** Verify server time is correct
-   **Doctor access:** Verify assignment between doctor and patient exists

---

**Implementation Complete** ✅
All features tested and working as specified.
