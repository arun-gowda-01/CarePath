# Exercise Recommendation Feature

## Overview

This feature allows doctors to search and assign evidence-based exercises to patients using the ExerciseDB API. Patients can view assigned exercises with animated GIF demonstrations and instructions on their Tasks page.

## Features Implemented

### 1. Backend Implementation

#### Models Updated

-   **Task Model** (`backend/src/models/Task.ts`)

    -   Added `exerciseId?: ObjectId` field to link tasks to exercises
    -   Reference to Exercise model for population

-   **Exercise Model** (`backend/src/models/Exercise.ts`)
    -   Already existed with comprehensive fields including:
        -   `name`, `description`, `category`, `difficulty`
        -   `duration`, `instructions`, `imageUrl` (for GIF)
        -   `targetAreas`, `sets`, `repetitions`, `equipment`

#### Controllers

-   **Exercise Controller** (`backend/src/controllers/exercise.controller.ts`)
    -   `searchExercisesFromAPI()` - Query ExerciseDB API by muscle group or name
    -   `getBodyParts()` - Get list of available muscle groups
    -   `assignExerciseToPatient()` - Create Exercise document and link to Task
    -   `getPatientExercises()` - Fetch all exercises assigned to a patient
    -   `updateExerciseAssignment()` - Update exercise schedule/completion
    -   `deleteExerciseAssignment()` - Remove exercise from patient
    -   `getAllExercises()` - List all exercises in system

#### Routes

-   **Doctor Routes** (`backend/src/routers/doctor.route.ts`)

    ```
    GET  /api/v1/doctor/exercises/search?muscle=chest&name=push
    GET  /api/v1/doctor/exercises/body-parts
    POST /api/v1/doctor/exercise/assign
    GET  /api/v1/doctor/exercises/:patientId
    PATCH /api/v1/doctor/exercise/:taskId
    DELETE /api/v1/doctor/exercise/:taskId
    GET  /api/v1/doctor/exercises
    ```

-   **Patient Routes** (`backend/src/routers/patient.route.ts`)
    ```
    GET  /api/v1/patient/exercises/:patientId
    PATCH /api/v1/patient/exercise/:taskId
    ```

### 2. Frontend Implementation

#### Doctor Patient Profile Page

**File:** `frontend/src/pages/PatientProfile.tsx`

Added new **"Exercises"** tab with two sections:

1. **Exercise Search (ExerciseDB Integration)**

    - Dropdown selector for muscle groups (chest, back, legs, etc.)
    - Text search by exercise name
    - Real-time search results with GIF previews
    - Display: exercise name, target muscle, body part, equipment needed
    - Click to select exercise

2. **Exercise Assignment Form**

    - Scheduled time picker
    - Duration (minutes)
    - Sets and repetitions
    - Priority level (low/medium/high)
    - Assign button to save

3. **Assigned Exercises List**
    - Shows all exercises assigned to patient
    - Displays GIF thumbnail, schedule, sets/reps
    - Delete button to remove assignments

#### Patient Tasks Page

**File:** `frontend/src/pages/PatientTasks.tsx`

-   Replaced hardcoded exercise placeholders with API data
-   Enhanced `ExerciseDemo` component:
    -   Shows exercise name, duration, difficulty
    -   "View Demo" button expands to show:
        -   **Animated GIF** from ExerciseDB
        -   Step-by-step instructions
        -   Sets and repetitions
    -   "Complete" button to mark exercise as done
    -   Green checkmark for completed exercises

#### API Client

**File:** `frontend/src/lib/api.ts`

Added doctor API methods:

-   `searchExercises(params)`
-   `getBodyParts()`
-   `assignExercise(data)`
-   `getPatientExercises(patientId)`
-   `updateExercise(taskId, data)`
-   `deleteExercise(taskId)`

Added patient API methods:

-   `getExercises(patientId)`
-   `completeExercise(taskId, data)`

#### Type Definitions

**File:** `frontend/src/lib/types.ts`

Added types:

-   `Exercise` - Internal exercise document
-   `ExerciseDBExercise` - API response from ExerciseDB
-   `AssignExerciseData` - Assignment payload
-   `UpdateExerciseData` - Update payload
-   `ExerciseTask` - Task with populated exercise data

## Setup Instructions

### 1. Get ExerciseDB API Key

1. Go to [RapidAPI ExerciseDB](https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)
2. Sign up for a free account (100 requests/day)
3. Subscribe to the Basic plan (free)
4. Copy your API key from the dashboard

### 2. Configure Backend

Add to `backend/.env`:

```bash
EXERCISEDB_API_KEY=your_rapidapi_key_here
```

### 3. Start the Application

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Usage Guide

### For Doctors

1. Navigate to a patient's profile page
2. Click the **"Exercises"** tab
3. Click **"Add Exercise"** button
4. Select a muscle group (e.g., "chest", "legs", "back")
5. Click **"Search Exercises"**
6. Browse results with GIF previews
7. Click an exercise card to select it
8. Fill in the assignment form:
    - Schedule date/time
    - Duration (default: 10 min)
    - Sets (default: 3)
    - Repetitions (default: "10-15")
    - Priority
9. Click **"Assign Exercise"**
10. Exercise appears in "Assigned Exercises" list

### For Patients

1. Go to **"My Tasks"** page
2. Scroll to **"Exercise Demonstrations"** section
3. See all assigned exercises with preview info
4. Click **"View Demo"** to see:
    - Animated GIF demonstration
    - Step-by-step instructions
    - Sets and reps guidance
5. Click **"Complete"** when finished
6. Completed exercises show green checkmark

## ExerciseDB API Details

### Available Muscle Groups

-   back
-   cardio
-   chest
-   lower arms
-   lower legs
-   neck
-   shoulders
-   upper arms
-   upper legs
-   waist

### API Response Structure

```json
{
	"id": "0001",
	"name": "3/4 sit-up",
	"target": "abs",
	"bodyPart": "waist",
	"equipment": "body weight",
	"gifUrl": "https://v2.exercisedb.io/image/...",
	"instructions": [
		"Step 1: Lie flat on your back...",
		"Step 2: Lift your upper body..."
	],
	"secondaryMuscles": ["hip flexors", "lower back"]
}
```

### Rate Limits

-   **Free Plan:** 100 requests/day
-   **Pro Plan:** 10,000 requests/month ($10/month)

## Data Flow

```
Doctor searches → ExerciseDB API → Backend transforms data
                                          ↓
                            Creates Exercise document
                                          ↓
                            Creates Task (type: "exercise")
                                          ↓
                            Links Task.exerciseId → Exercise._id
                                          ↓
Patient views tasks → Populated Exercise data with GIF
                                          ↓
                            Patient completes exercise
```

## Database Schema

### Exercise Collection

```javascript
{
  _id: ObjectId,
  name: "push up",
  description: "Instructions text...",
  category: "Strength",
  difficulty: "Moderate",
  duration: 10,
  instructions: [
    { step: 1, description: "..." },
    { step: 2, description: "..." }
  ],
  imageUrl: "https://v2.exercisedb.io/image/...", // GIF URL
  equipment: ["body weight"],
  targetAreas: ["chest", "triceps"],
  repetitions: "10-15",
  sets: 3,
  isActive: true
}
```

### Task Collection (Updated)

```javascript
{
  _id: ObjectId,
  patientId: ObjectId,
  title: "push up",
  description: "Target: chest | Equipment: body weight",
  type: "exercise",
  exerciseId: ObjectId, // NEW FIELD - references Exercise
  scheduledTime: ISODate,
  completed: false,
  priority: "medium"
}
```

## API Endpoints Reference

### Doctor Endpoints

#### Search Exercises

```http
GET /api/v1/doctor/exercises/search?muscle=chest&limit=20
Authorization: Cookie (JWT)
```

Response:

```json
{
	"statusCode": 200,
	"success": true,
	"message": "Exercises retrieved from ExerciseDB successfully",
	"data": [
		{
			"externalId": "0001",
			"name": "bench press",
			"bodyPart": "chest",
			"target": "pectorals",
			"equipment": "barbell",
			"gifUrl": "https://...",
			"instructions": ["...", "..."],
			"secondaryMuscles": ["triceps", "shoulders"]
		}
	]
}
```

#### Assign Exercise

```http
POST /api/v1/doctor/exercise/assign
Authorization: Cookie (JWT)
Content-Type: application/json

{
  "patientId": "6789...",
  "exerciseData": {
    "externalId": "0001",
    "name": "bench press",
    "target": "pectorals",
    "bodyPart": "chest",
    "equipment": "barbell",
    "gifUrl": "https://...",
    "instructions": ["...", "..."]
  },
  "scheduledTime": "2025-11-16T10:00:00Z",
  "duration": 15,
  "sets": 3,
  "repetitions": "8-12",
  "priority": "medium"
}
```

#### Get Patient Exercises

```http
GET /api/v1/doctor/exercises/:patientId
Authorization: Cookie (JWT)
```

### Patient Endpoints

#### Get My Exercises

```http
GET /api/v1/patient/exercises/:patientId
Authorization: Cookie (JWT)
```

#### Complete Exercise

```http
PATCH /api/v1/patient/exercise/:taskId
Authorization: Cookie (JWT)
Content-Type: application/json

{
  "completed": true
}
```

## Error Handling

Common errors and solutions:

### "ExerciseDB API key not configured"

**Solution:** Add `EXERCISEDB_API_KEY` to `backend/.env`

### "ExerciseDB API rate limit exceeded"

**Solution:**

-   Wait 24 hours for free tier reset
-   Upgrade to Pro plan
-   Implement caching (future enhancement)

### "Failed to fetch exercises"

**Solution:**

-   Check internet connection
-   Verify API key is valid
-   Check RapidAPI dashboard for subscription status

## Future Enhancements

1. **Caching Layer**

    - Store popular exercises in database
    - Reduce API calls to ExerciseDB
    - Faster search results

2. **Exercise Library**

    - Pre-populate database with common exercises
    - Allow offline functionality
    - Custom exercise creation by doctors

3. **Progress Tracking**

    - Track completion rates
    - Show exercise history
    - Generate progress reports

4. **Video Support**

    - Upload custom exercise videos
    - YouTube integration
    - Video playback controls

5. **Exercise Programs**

    - Create multi-week programs
    - Progressive difficulty
    - Automated scheduling

6. **Patient Feedback**
    - Rate difficulty
    - Report pain/discomfort
    - Request modifications

## Testing

### Manual Testing Checklist

**Doctor Workflow:**

-   [ ] Search exercises by muscle group
-   [ ] Search exercises by name
-   [ ] View exercise GIF in search results
-   [ ] Select and assign exercise
-   [ ] Set custom schedule, sets, reps
-   [ ] View assigned exercises list
-   [ ] Delete exercise assignment

**Patient Workflow:**

-   [ ] View assigned exercises
-   [ ] Click "View Demo" to see GIF
-   [ ] Read instructions
-   [ ] Mark exercise as complete
-   [ ] See completed status

**Edge Cases:**

-   [ ] Empty search results
-   [ ] No exercises assigned
-   [ ] API rate limit handling
-   [ ] Missing API key error
-   [ ] Network timeout

## Troubleshooting

### GIFs not loading

-   Check `imageUrl` in Exercise document
-   Verify ExerciseDB CDN is accessible
-   Check browser console for CORS errors

### Search returns no results

-   Verify muscle group name is correct
-   Check ExerciseDB API status
-   Try different search terms

### Assignment fails

-   Ensure patient exists
-   Check all required fields are filled
-   Verify doctor is authorized for patient

## Contributing

When adding new features:

1. Follow existing error handling patterns (`asyncHandler`)
2. Use `validateRequest` for input validation
3. Maintain consistent response format (`res.sendResponse`)
4. Update TypeScript types in `frontend/src/lib/types.ts`
5. Add API methods to `frontend/src/lib/api.ts`

## Support

For issues or questions:

1. Check this documentation
2. Review error logs in browser console
3. Check backend console for API errors
4. Verify environment variables are set
