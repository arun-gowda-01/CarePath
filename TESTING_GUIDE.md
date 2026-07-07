# Testing Guide: Enhanced Patient Check-In Feature

## Prerequisites

1. **Backend Setup:**

    ```bash
    cd backend
    npm install
    # Add Cloudinary credentials to .env
    npm run dev
    ```

2. **Frontend Setup:**

    ```bash
    cd frontend
    npm install
    npm run dev
    ```

3. **Database:**

    - MongoDB running on `mongodb://localhost:27017/carepath`
    - Test users created (patient, doctor, admin)

4. **Cloudinary Account:**
    - See `CLOUDINARY_SETUP.md` for instructions

## Test Scenarios

### 1. Patient Check-In Submission (First Time)

**Steps:**

1. Login as patient
2. Navigate to "Symptom Check-in"
3. Fill out form:
    - Pain Level: 5
    - Temperature: 37.5°C
    - Blood Pressure: 120/80
    - Mood: Good
    - Symptoms: Select "Fatigue" and "Headache"
    - Notes: "Feeling slightly tired today"
    - Upload wound image (JPEG/PNG, < 5MB)
4. Click "Submit Check-in"

**Expected:**

-   ✅ Success toast: "Check-in submitted successfully!"
-   ✅ AI Analysis toast (if risk detected)
-   ✅ Form resets
-   ✅ Check-in appears in history below
-   ✅ Wound image visible in history

**Backend Verification:**

-   Check MongoDB: `db.symptomcheckins.findOne({patientId: ...})`
-   Verify `image.url` contains Cloudinary URL
-   Verify `isRead: false`

**Cloudinary Verification:**

-   Go to Media Library
-   Find image in `carepath/check-ins/{patientId}/`

---

### 2. Once-Per-Day Validation

**Steps:**

1. After completing Test #1 above
2. Try to submit another check-in immediately

**Expected:**

-   ❌ Yellow warning box appears: "You have already submitted a check-in today..."
-   ❌ Submit button disabled
-   ❌ Error toast if button somehow clicked

---

### 3. 8-Hour Gap Validation

**Steps:**

1. Simulate: Change last check-in's `checkInDate` in database to 4 hours ago
2. Refresh patient check-in page

**Expected:**

-   ❌ Yellow warning: "Please wait X hour(s) before submitting..."
-   ❌ Submit button disabled
-   ⏱️ Countdown shows hours remaining

**Manual Test (Next Day):**

1. Wait until next calendar day (after midnight)
2. BUT within 8 hours of last check-in
3. Should still be blocked by 8-hour rule

---

### 4. Check-In After 8+ Hours

**Steps:**

1. Change last check-in to 9 hours ago
2. Refresh page
3. Submit new check-in

**Expected:**

-   ✅ No warnings
-   ✅ Submit button enabled
-   ✅ Submission succeeds

---

### 5. Image Upload Validation

#### 5a. Invalid File Type

**Steps:**

1. Try uploading `.txt` or `.pdf` file

**Expected:**

-   ❌ Error toast: "Only JPEG, PNG, and WebP images are allowed"
-   ❌ File not selected

#### 5b. File Too Large

**Steps:**

1. Upload image > 5MB

**Expected:**

-   ❌ Error toast: "Image size must be less than 5MB"
-   ❌ File not selected

#### 5c. Valid Image

**Steps:**

1. Upload valid JPEG (< 5MB)

**Expected:**

-   ✅ Image preview appears
-   ✅ Remove button (✕) visible
-   ✅ Can remove image before submit

---

### 6. Doctor Check-In View (Unread)

**Steps:**

1. Login as doctor
2. Navigate to patient profile (who submitted check-in)
3. Click "Check-Ins" tab

**Expected:**

-   ✅ Tab renamed from "Symptoms" to "Check-Ins"
-   ✅ Section header: "Unread Check-Ins"
-   ✅ Check-in card with **yellow background** (`bg-yellow-50`)
-   ✅ Badge shows "Unread"
-   ✅ Icon 📷 if wound image attached
-   ✅ Vitals summary visible

---

### 7. Check-In Dialog Popup

**Steps:**

1. From doctor view (Test #6)
2. Click on yellow check-in card

**Expected:**

-   ✅ Dialog opens
-   ✅ Shows full details:
    -   Date/time
    -   Pain level (large font)
    -   Temperature (large font)
    -   Blood pressure (large font)
    -   Mood (large font)
    -   Symptoms as badges
    -   Additional notes
    -   **Wound image** (if uploaded)
-   ✅ Risk Level dropdown shows current patient risk level
-   ✅ "Mark as Reviewed" button visible
-   ✅ "Update Risk Level" button visible

---

### 8. Mark Check-In as Reviewed

**Steps:**

1. Open check-in dialog (Test #7)
2. Click "Mark as Reviewed"

**Expected:**

-   ✅ Success toast: "Check-in marked as reviewed"
-   ✅ Dialog closes
-   ✅ Card moves to "Read Check-Ins" section
-   ✅ Card background changes to **white** (`bg-white`)
-   ✅ Badge changes to "Read" (green)

**Database Verification:**

```javascript
db.symptomcheckins.findOne({_id: ...})
// Should show:
// isRead: true
// reviewedBy: <doctorId>
// reviewedAt: <timestamp>
```

---

### 9. Update Patient Risk Level

**Steps:**

1. Open check-in dialog
2. Change risk level dropdown from "Stable" to "Monitor"
3. Click "Update Risk Level"

**Expected:**

-   ✅ Success toast: "Patient risk level updated"
-   ✅ Check-in marked as reviewed (automatic)
-   ✅ Dialog closes
-   ✅ Patient's risk badge updates in header

**Database Verification:**

```javascript
// Patient updated
db.patients.findOne({_id: ...})
// riskLevel: "monitor"

// Alert created
db.alerts.find({patientId: ...}).sort({createdAt: -1}).limit(1)
// message: "Risk level updated from stable to monitor by doctor"
```

---

### 10. Check-In History with Images

**Steps:**

1. As patient, submit multiple check-ins
2. Some with images, some without
3. View history on patient check-in page

**Expected:**

-   ✅ All check-ins listed (newest first)
-   ✅ Check-ins with images show full image
-   ✅ Check-ins without images don't show image section
-   ✅ Risk level badges color-coded:
    -   Normal: Green
    -   Warning: Yellow
    -   Critical: Red

---

### 11. Recent Check-In Display

**Steps:**

1. Submit check-in
2. Navigate away
3. Return to check-in page

**Expected:**

-   ✅ Last check-in shown at top of history
-   ✅ Time shown correctly
-   ✅ All data preserved

---

### 12. Multiple Patients (Doctor View)

**Steps:**

1. Assign doctor to multiple patients
2. Have each patient submit check-ins
3. Login as doctor
4. Go to different patient profiles

**Expected:**

-   ✅ Each patient's check-ins isolated
-   ✅ No cross-contamination
-   ✅ Doctor can only see assigned patients

---

### 13. Edge Cases

#### 13a. Submit Without Image

**Expected:** ✅ Works fine, JSON payload sent

#### 13b. Cancel Image After Preview

**Expected:** ✅ Can remove, submission uses JSON

#### 13c. Rapid Submissions (Before 8 Hours)

**Expected:** ❌ Backend blocks with error message

#### 13d. Timezone Test

**Steps:**

1. Submit check-in at 11:50 PM
2. Wait until 12:05 AM (next day)
3. Try to submit again

**Expected:**

-   ✅ Should work (different calendar day)
-   ✅ 8-hour rule still applies if < 8 hours

#### 13e. Doctor Not Assigned

**Steps:**

1. Doctor tries to view unassigned patient

**Expected:**

-   ❌ 403 Forbidden
-   ❌ Error message

---

### 14. Performance Test

**Steps:**

1. Upload 10+ check-ins for one patient
2. Doctor views check-in history

**Expected:**

-   ✅ Loads within 2 seconds
-   ✅ Images lazy-load
-   ✅ No browser lag

---

## Automated Testing (Optional)

### Backend Unit Tests (Jest/Mocha)

```javascript
describe("Check-In Submission", () => {
	it("should block same-day submissions", async () => {
		// Test once-per-day
	});

	it("should block submissions within 8 hours", async () => {
		// Test 8-hour gap
	});

	it("should upload image to Cloudinary", async () => {
		// Test image upload
	});
});

describe("Doctor Check-In Review", () => {
	it("should mark check-in as reviewed", async () => {
		// Test review functionality
	});

	it("should update patient risk level", async () => {
		// Test risk level update
	});
});
```

### Frontend E2E Tests (Cypress/Playwright)

```javascript
describe("Patient Check-In Flow", () => {
	it("completes full check-in with image", () => {
		cy.visit("/patient/check-in");
		cy.get('input[type="range"]').invoke("val", 5).trigger("change");
		cy.get("#wound-image-input").attachFile("test-wound.jpg");
		cy.contains("Submit Check-in").click();
		cy.contains("Check-in submitted successfully!");
	});
});
```

---

## Troubleshooting Common Issues

### Issue: "Failed to submit check-in"

**Check:**

-   Backend logs for detailed error
-   Network tab in browser DevTools
-   MongoDB connection
-   Cloudinary credentials

### Issue: Image preview not showing

**Check:**

-   File size
-   File type
-   Browser console for errors

### Issue: Check-ins not appearing in doctor view

**Check:**

-   Assignment exists between doctor and patient
-   Check-ins exist in database
-   API endpoint returning data

### Issue: "Wait X hours" message stuck

**Check:**

-   Server time vs. local time
-   MongoDB timestamps
-   Timezone settings

---

## Success Criteria

All tests should pass with:

-   ✅ No console errors
-   ✅ No database errors
-   ✅ Proper error handling
-   ✅ Smooth UX transitions
-   ✅ Images properly uploaded to Cloudinary
-   ✅ Real-time updates working

---

**Happy Testing!** 🧪
Report any issues with detailed steps to reproduce.
