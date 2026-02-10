# Starhawk Platform - Workflow Gap Analysis

## Executive Summary
This document compares the desired workflow (from the specification) with the current platform implementation to identify gaps and create an implementation plan.

---

## ✅ What's Currently Implemented

### 1. Authentication & User Management
- ✅ **Admin/User Login** - Role-based login implemented via `/auth/login`
- ✅ **Phone number validation** - Recently added Rwandan format validation (10 digits, 072/073/078/079)
- ✅ **User Registration** - Admin can create users (partial - needs profile completion workflow)
- ✅ **Role-based routing** - Dashboards exist for all roles

### 2. Farm Registration
- ✅ **Farm Registration Endpoint** - `/farms/register` implemented in FarmerDashboard
- ✅ **Crop Type Selection** - Working
- ⚠️ **Sowing Date Validation** - PARTIAL - Needs 14-day future validation enforcement

### 3. Admin Dashboard - Pending Farms
- ✅ **View Pending Farms** - `/assessments/pending-farms` recently integrated
- ✅ **Pending Farms UI** - Table displaying pending farms
- ⚠️ **Assign Assessor** - PARTIAL - Uses `createAssessment` instead of `/assessments/assign`

### 4. Assessor Workflow - KML Upload
- ✅ **KML Upload** - `/farms/:farmId/upload-kml` implemented
- ✅ **KML Upload UI** - Modal and file handling working
- ✅ **View Assigned Farms** - `/assessments/farmers/list` endpoint being used

### 5. Risk Assessment
- ✅ **Calculate Risk Score** - `/assessments/:id/calculate-risk` endpoint exists
- ✅ **Risk Assessment UI** - RiskAssessmentSystem component exists
- ✅ **EOSDA Integration** - Field statistics and weather data fetching implemented

### 6. Claims Management
- ✅ **File Claim** - `/claims` POST endpoint implemented
- ✅ **Claim Assignment** - `/claims/:id/assign` implemented
- ✅ **Approve/Reject Claims** - Endpoints exist

### 7. Crop Monitoring
- ✅ **Crop Monitoring UI** - CropMonitoringSystem component exists
- ⚠️ **Crop Monitoring Endpoints** - Status unclear, needs verification

---

## ❌ Critical Missing Features

### 1. **Admin Assignment Workflow** (HIGH PRIORITY)

**Missing:**
- ❌ `POST /assessments/assign` endpoint not used
- ❌ Currently using `POST /assessments` (createAssessment) which may not be the same
- ❌ No UI flow specifically for assigning assessor to pending farm from the pending farms list
- ❌ Missing "Assign Assessor" button integration in pending farms table

**Expected Flow:**
1. Admin clicks "Assign Assessor" on pending farm
2. Modal opens with assessor list
3. Admin selects assessor (and optionally insurer)
4. Calls `/assessments/assign` endpoint
5. Success notification

**Current State:**
- Uses generic "Create Assessment" dialog
- Doesn't use the specific assign endpoint
- No direct integration from pending farms table

---

### 2. **Assessor Assessment Workflow - Report Generation** (HIGH PRIORITY)

**Missing:**
- ❌ `POST /assessments/:id/generate-report` endpoint not implemented
- ❌ `POST /assessments/:id/upload-drone-pdf` endpoint not implemented
- ❌ `PUT /assessments/:id` for comprehensive notes not fully implemented
- ❌ Report generation validation logic missing
- ❌ Status transitions: IN_PROGRESS → SUBMITTED not clear

**Expected Flow:**
1. Assessor completes risk assessment
2. Uploads drone PDF (optional)
3. Adds comprehensive notes
4. Validates all required fields
5. Calls `/assessments/:id/generate-report`
6. Status changes to SUBMITTED
7. Insurer gets notified

**Current State:**
- Risk calculation exists
- Missing report generation endpoint
- Missing drone PDF upload
- Missing comprehensive notes field
- No validation before report generation

---

### 3. **Insurer Approval/Rejection Workflow** (HIGH PRIORITY)

**Missing:**
- ❌ `POST /assessments/:id/approve` endpoint not implemented
- ❌ `POST /assessments/:id/reject` endpoint not implemented
- ❌ Rejection reason field/UI missing
- ❌ Policy creation after approval not integrated

**Expected Flow:**
1. Insurer views SUBMITTED assessments
2. Reviews full report
3. Approves or rejects with reason
4. If approved, creates policy

**Current State:**
- Can view assessments
- No approve/reject actions
- No policy creation integration

---

### 4. **Farm Registration - Date Validation** (MEDIUM PRIORITY)

**Missing:**
- ⚠️ Client-side validation for 14-day future requirement not enforced
- ⚠️ Error handling for date validation not clear

**Expected:**
- Date picker should have min date = today + 14 days
- Clear error messages if validation fails

---

### 5. **Assessor Views Assigned Farms - Better Integration** (MEDIUM PRIORITY)

**Current:**
- ✅ `/assessments/farmers/list` endpoint exists and is used
- ⚠️ UI could be improved to match workflow specification

**Expected:**
- Clear list of farmers with their farms
- Farm status clearly visible (PENDING = needs KML upload)
- Direct action buttons for each status

---

### 6. **Crop Monitoring Workflow** (MEDIUM PRIORITY)

**Missing:**
- ⚠️ `POST /crop-monitoring/start` endpoint integration unclear
- ⚠️ Max 2 monitoring cycles validation not clear
- ⚠️ `POST /crop-monitoring/:id/generate-report` integration unclear
- ⚠️ Status tracking: IN_PROGRESS → COMPLETED

**Expected:**
- Start monitoring button (validates max 2 cycles)
- Update monitoring data
- Generate monitoring report
- Report dispatched to insurer

---

### 7. **User Registration - Complete Profile** (LOW PRIORITY)

**Current:**
- ✅ Admin can create users
- ⚠️ Profile completion workflow after first login unclear

**Expected:**
- First login required flag handling
- Profile completion flow for new users

---

## 📋 Implementation Plan

### Phase 1: Critical Admin & Assessor Workflows (Priority 1)

#### Task 1.1: Admin Assessment Assignment
**Files to Modify:**
- `src/components/dashboards/AdminDashboard.tsx`
- `src/services/assessmentsApi.ts`

**Changes:**
1. Add `assignAssessor(farmId, assessorId, insurerId?)` method to assessmentsApi
2. Update pending farms table "Create Assessment" button to call assign endpoint
3. Add proper modal/dialog for assessor selection
4. Integrate with pending farms list
5. Show success/error notifications

**Estimated Time:** 2-3 hours

---

#### Task 1.2: Assessor Report Generation
**Files to Modify:**
- `src/services/assessmentsApi.ts`
- `src/components/assessor/RiskAssessmentSystem.tsx`

**Changes:**
1. Add `uploadDronePDF(assessmentId, file)` method
2. Add `updateAssessment(assessmentId, data)` method for comprehensive notes
3. Add `generateReport(assessmentId)` method
4. Add UI for:
   - Drone PDF upload section
   - Comprehensive notes text area
   - Report generation button with validation
5. Add validation logic (risk score, notes required)
6. Handle status transitions

**Estimated Time:** 4-5 hours

---

#### Task 1.3: Insurer Approval/Rejection
**Files to Modify:**
- `src/services/assessmentsApi.ts`
- `src/components/dashboards/InsurerDashboard.tsx`
- `src/components/insurer/RiskReviewManagement.tsx` (if exists)

**Changes:**
1. Add `approveAssessment(assessmentId)` method
2. Add `rejectAssessment(assessmentId, reason)` method
3. Add UI for:
   - Approve button
   - Reject button with reason modal
   - Status updates after action
4. Integrate policy creation after approval
5. Show notifications

**Estimated Time:** 3-4 hours

---

### Phase 2: Validation & Data Integrity (Priority 2)

#### Task 2.1: Farm Registration Date Validation
**Files to Modify:**
- `src/components/dashboards/FarmerDashboard.tsx`

**Changes:**
1. Add date picker with min date = today + 14 days
2. Client-side validation before API call
3. Clear error messages
4. Update UI to show validation requirements

**Estimated Time:** 1-2 hours

---

#### Task 2.2: Assessment Status Management
**Files to Modify:**
- Multiple assessor/insurer dashboard files

**Changes:**
1. Ensure status transitions are properly handled:
   - ASSIGNED → IN_PROGRESS
   - IN_PROGRESS → SUBMITTED (on report generation)
   - SUBMITTED → APPROVED/REJECTED
2. Add status badges/indicators
3. Filter assessments by status

**Estimated Time:** 2-3 hours

---

### Phase 3: Crop Monitoring Enhancement (Priority 3)

#### Task 3.1: Crop Monitoring API Integration
**Files to Modify:**
- `src/services/` (new or existing monitoring service)
- `src/components/monitoring/CropMonitoringSystem.tsx`

**Changes:**
1. Verify/create crop monitoring API service
2. Implement start monitoring with max 2 cycles validation
3. Implement update monitoring data
4. Implement generate monitoring report
5. Update UI to match workflow

**Estimated Time:** 4-5 hours

---

### Phase 4: UI/UX Improvements (Priority 4)

#### Task 4.1: Assessor Assigned Farms View
**Files to Modify:**
- `src/components/dashboards/AssessorDashboard.tsx`

**Changes:**
1. Improve farmers/farms list display
2. Clear status indicators (PENDING = needs KML)
3. Action buttons per status
4. Better organization

**Estimated Time:** 2-3 hours

---

#### Task 4.2: Notification System
**Files to Modify:**
- Add notification components if missing

**Changes:**
1. Email notifications mentioned in workflow (backend handled)
2. Frontend notification display for:
   - New assignments (assessor)
   - New pending farms (admin)
   - Reports ready (insurer)
   - Approval/rejection (farmer/assessor)

**Estimated Time:** 3-4 hours

---

## Summary Table

| Feature | Status | Priority | Estimated Time |
|---------|--------|----------|----------------|
| Admin Assignment (`/assessments/assign`) | ❌ Missing | HIGH | 2-3 hours |
| Generate Report (`/assessments/:id/generate-report`) | ❌ Missing | HIGH | 4-5 hours |
| Upload Drone PDF | ❌ Missing | HIGH | (included above) |
| Comprehensive Notes | ❌ Missing | HIGH | (included above) |
| Approve/Reject Assessment | ❌ Missing | HIGH | 3-4 hours |
| Farm Date Validation (14 days) | ⚠️ Partial | MEDIUM | 1-2 hours |
| Crop Monitoring Integration | ⚠️ Unclear | MEDIUM | 4-5 hours |
| Status Management | ⚠️ Partial | MEDIUM | 2-3 hours |
| UI Improvements | ⚠️ Needed | LOW | 2-3 hours |
| Notifications | ⚠️ Partial | LOW | 3-4 hours |

**Total Estimated Time:** 23-32 hours

---

## Recommended Implementation Order

1. **Week 1: Critical Workflows**
   - Task 1.1: Admin Assignment
   - Task 1.2: Assessor Report Generation
   - Task 1.3: Insurer Approval/Rejection

2. **Week 2: Validation & Polish**
   - Task 2.1: Date Validation
   - Task 2.2: Status Management
   - Task 4.1: UI Improvements

3. **Week 3: Additional Features**
   - Task 3.1: Crop Monitoring
   - Task 4.2: Notifications

---

## Questions for Approval

1. Should we proceed with Phase 1 (Critical Workflows) first?
2. Are there any workflow steps that should be prioritized differently?
3. Should crop monitoring be simplified or is the full workflow required?
4. Are there any features from the specification that are not needed?

**Please review and approve this plan before we begin implementation.**
