# API Coverage Analysis - Starhawk Insurance Platform

## Overview
This document analyzes current UI coverage against the Integration Guide requirements.

---

## ✅ **AUTHENTICATION FLOW**

### Current Status: ✅ COMPLETE
- ✅ POST /auth/login - **Implemented** in all login pages
- ✅ Token storage and usage - **Implemented**
- ✅ Token expiration handling - **Implemented** (401 handling)

---

## 🌾 **FARMER ROLE - Coverage Analysis**

### 1. Farm Registration
- ✅ POST /farms - **Implemented** in FarmerDashboard (`renderCreateFarm`)
- ✅ GET /farms/:id - **API exists, UI partial** (used in components but no dedicated view)
- ✅ GET /farms - **Implemented** in FarmerDashboard (`loadFarms`)

### 2. Insurance Requests ⚠️ MISSING UI
- ❌ POST /farms/insurance-requests - **API exists, NO UI**
  - API Function: `createInsuranceRequest()` exists in `farmsApi.ts`
  - **Gap**: No button/form in FarmerDashboard to request insurance for a farm
  - **Required**: Add "Request Insurance" button in "My Fields" page

### 3. Farm Analytics ⚠️ PARTIAL
- ⚠️ GET /farms/:id/weather/forecast - **API exists, NO UI**
- ⚠️ GET /farms/:id/weather/historical - **API exists, NO UI**
- ⚠️ GET /farms/:id/indices/statistics - **API exists, NO UI**
- ⚠️ GET /farms/:id/indices/ndvi - **API exists, NO UI**
  - **Gap**: No farm analytics/monitoring page for farmers
  - **Note**: These are used in RiskAssessmentSystem but not in FarmerDashboard

### 4. Claims (Farmer)
- ✅ POST /claims - **Implemented** in FarmerDashboard (`renderFileClaim`)
- ✅ GET /claims - **Implemented** in FarmerDashboard (`loadClaims`)

---

## 🏢 **INSURER ROLE - Coverage Analysis**

### 1. Risk Assessment Flow
- ✅ POST /assessments - **Implemented** in AdminDashboard
- ⚠️ GET /assessments - **API exists, UI unclear** (need to verify if insurer can view)

### 2. Policy Generation
- ⚠️ POST /policies - **API exists, but WRONG format**
  - Current: Uses `farmerId, cropType, coverageAmount, premium`
  - **Required**: Should use `assessmentId, coverageLevel, startDate, endDate`
  - **Gap**: Need to update policy creation to use assessment-based flow
  - **Location**: AdminDashboard and InsurerDashboard

### 3. Claims Management
- ✅ PUT /claims/:id/assign - **Implemented** in ClaimsTable
- ✅ PUT /claims/:id/approve - **Implemented** in ClaimsTable, ClaimReviewPage
- ✅ PUT /claims/:id/reject - **Implemented** in ClaimsTable, ClaimReviewPage
- ✅ GET /claims - **Implemented** in ClaimsTable

---

## 👨‍🔬 **ASSESSOR ROLE - Coverage Analysis**

### 1. Risk Assessment Flow
- ✅ PUT /assessments/:id - **Implemented** in AssessorDashboard
- ✅ POST /assessments/:id/calculate-risk - **Implemented** in AssessorDashboard
- ✅ POST /assessments/:id/submit - **Implemented** in AssessorDashboard
- ✅ GET /assessments - **Implemented** in AssessorDashboard

### 2. Claim Assessment Flow
- ⚠️ PUT /claims/:id/assessment - **API exists, UI unclear**
  - API Function: `updateClaimAssessment()` might be missing
  - **Gap**: Need to verify if assessor can update claim assessment
- ⚠️ POST /claims/:id/submit-assessment - **API exists, UI unclear**
  - API Function: `submitAssessment()` exists in claimsApi.ts
  - **Gap**: Need to verify if assessor dashboard has UI for this
- ✅ GET /claims - **Implemented** in AssessorDashboard (ClaimAssessmentSystem)

---

## 📊 **MISSING UI COMPONENTS - Priority List**

### **HIGH PRIORITY** (Critical for core flows)

1. **Insurance Request Button (Farmer)**
   - **Location**: FarmerDashboard → "My Fields" page
   - **Action**: Add "Request Insurance" button for each farm
   - **API**: POST /farms/insurance-requests
   - **Flow**: Farmer creates farm → Requests insurance → Insurer creates assessment

2. **Assessment-Based Policy Creation (Insurer)**
   - **Location**: AdminDashboard / InsurerDashboard
   - **Action**: Update policy creation to use `assessmentId` instead of manual fields
   - **API**: POST /policies (with `assessmentId, coverageLevel, startDate, endDate`)
   - **Flow**: After assessment is submitted → Insurer issues policy from assessment

3. **Claim Assessment Update/Submit (Assessor)**
   - **Location**: AssessorDashboard → Claim Assessment page
   - **Action**: Add UI to update and submit claim assessments
   - **APIs**: 
     - PUT /claims/:id/assessment
     - POST /claims/:id/submit-assessment
   - **Flow**: Assessor updates assessment → Submits → Insurer approves/rejects

### **MEDIUM PRIORITY** (Nice to have)

4. **Farm Analytics Dashboard (Farmer)**
   - **Location**: FarmerDashboard → New "Farm Analytics" page
   - **Action**: Display weather forecast, historical weather, NDVI statistics
   - **APIs**: 
     - GET /farms/:id/weather/forecast
     - GET /farms/:id/weather/historical
     - GET /farms/:id/indices/statistics
     - GET /farms/:id/indices/ndvi
   - **Flow**: Farmer views farm → Clicks "View Analytics" → Sees weather/NDVI data

5. **Farm Details View (All Roles)**
   - **Location**: All dashboards
   - **Action**: Dedicated page to view farm details with all information
   - **API**: GET /farms/:id
   - **Flow**: Click on farm → View detailed information

### **LOW PRIORITY** (Enhancements)

6. **Insurance Request Status Tracking (Farmer)**
   - **Location**: FarmerDashboard
   - **Action**: Show status of insurance requests (PENDING, ASSESSED, REJECTED, ACCEPTED)
   - **API**: GET /farms/insurance-requests (might need to be added)

---

## 🔄 **COMPLETE FLOWS - Status**

### Flow 1: Risk Assessment → Policy
**Status**: ⚠️ PARTIAL
- ✅ Step 1: Farm Registration (Farmer)
- ❌ Step 2: Request Insurance (Farmer) - **MISSING UI**
- ✅ Step 3: Create Assessment (Insurer)
- ✅ Step 4: Update Assessment (Assessor)
- ✅ Step 5: Calculate Risk (Assessor)
- ✅ Step 6: Submit Assessment (Assessor)
- ⚠️ Step 7: Issue Policy (Insurer) - **WRONG FORMAT**

### Flow 2: Claim Filing → Approval
**Status**: ⚠️ PARTIAL
- ✅ Step 1: File Claim (Farmer)
- ✅ Step 2: Assign Assessor (Insurer)
- ⚠️ Step 3: Update Claim Assessment (Assessor) - **NEEDS VERIFICATION**
- ⚠️ Step 4: Submit Claim Assessment (Assessor) - **NEEDS VERIFICATION**
- ✅ Step 5: Approve/Reject Claim (Insurer)

---

## 📝 **API SERVICE UPDATES NEEDED**

### 1. Claims API - Missing Methods
- ❌ `updateClaimAssessment(claimId, assessmentData)` - **MISSING**
  - Should call: PUT /claims/:id/assessment

### 2. Policies API - Wrong Interface
- ⚠️ `createPolicy()` - **WRONG FORMAT**
  - Current: `{ farmerId, cropType, coverageAmount, premium, ... }`
  - Should be: `{ assessmentId, coverageLevel, startDate, endDate }`

### 3. Farms API - Insurance Requests
- ✅ `createInsuranceRequest()` - **EXISTS**
- ❌ `getInsuranceRequests()` - **MISSING** (might be needed)

---

## 🎯 **RECOMMENDED IMPLEMENTATION PLAN**

### Phase 1: Critical Flow Fixes
1. Add Insurance Request button in FarmerDashboard
2. Fix Policy Creation to use assessmentId
3. Add Claim Assessment update/submit UI for Assessor

### Phase 2: Enhanced Features
4. Add Farm Analytics page for Farmers
5. Add Farm Details view
6. Add Insurance Request status tracking

### Phase 3: Polish
7. Improve error handling
8. Add loading states
9. Add success/error notifications
10. Add validation

---

## ❓ **QUESTIONS TO CLARIFY**

1. **Insurance Requests**: 
   - Should farmers see a list of their insurance requests?
   - What's the endpoint to get insurance requests by farmer?

2. **Policy Creation**:
   - Should we keep the old manual policy creation as a fallback?
   - Or completely replace it with assessment-based creation?

3. **Claim Assessment**:
   - Does the assessor need to update the assessment before submitting?
   - What fields are required for claim assessment?

4. **Farm Analytics**:
   - Should this be a separate page or integrated into farm details?
   - Which roles should have access to farm analytics?

---

**Last Updated**: Based on Integration Guide Review
**Status**: Ready for Discussion

