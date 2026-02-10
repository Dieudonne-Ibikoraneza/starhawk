# Claim Assessment Flow Analysis

## Comparison: Current Implementation vs. Required Flow

### Flow Overview
1. Farmer files claim → 2. Insurer assigns assessor → 3. Assessor updates assessment 
→ 4. Assessor submits assessment → 5. Insurer approves/rejects claim

---

## Step-by-Step Analysis

### ✅ Step 1: File Claim (Farmer)
**Endpoint**: `POST /api/v1/claims`  
**Role**: FARMER  
**Status**: ✅ **FULLY IMPLEMENTED**

**Current Implementation**:
- ✅ API Function: `createClaim()` in `claimsApi.ts`
- ✅ UI: `renderFileClaim()` in `FarmerDashboard.tsx`
- ✅ Sends: `policyId`, `eventType`, `eventDate`, `description`, `estimatedLoss`, `damagePhotos`
- ✅ Supports both old format (lossEventType, lossDescription) and new format (eventType, description)
- ✅ Form includes: Event Date picker and Estimated Loss input

**Required Fields** (per flow):
```typescript
{
  policyId: string;
  eventType: string; // ✅
  eventDate: string; // ✅
  description: string; // ✅
  estimatedLoss: number; // ✅
}
```

**Match**: ✅ **100%** - Fully compliant

---

### ✅ Step 2: Assign Assessor (Insurer)
**Endpoint**: `PUT /api/v1/claims/:id/assign`  
**Role**: INSURER  
**Status**: ✅ **FULLY IMPLEMENTED**

**Current Implementation**:
- ✅ API Function: `assignAssessor(id, assessorId)` in `claimsApi.ts`
- ✅ UI: `handleAssignAssessor()` in `ClaimsTable.tsx`
- ✅ Request body: `{ assessorId }`
- ✅ Changes status to: `ASSIGNED`

**Match**: ✅ **100%** - Fully compliant

---

### ✅ Step 3: Update Claim Assessment (Assessor)
**Endpoint**: `PUT /api/v1/claims/:id/assessment`  
**Role**: ASSESSOR  
**Status**: ✅ **FULLY IMPLEMENTED**

**Current Implementation**:
- ✅ API Function: `updateClaimAssessment(id, assessmentData)` in `claimsApi.ts`
- ✅ UI: `handleUpdateAssessment()` in `LossAssessmentSystem.tsx`
- ✅ Sends: `visitDate`, `observations`, `reportText`, `damageArea`, `ndviBefore`, `ndviAfter`
- ✅ Backend auto-calculates NDVI if not provided (per flow spec)

**Match**: ✅ **100%** - Fully compliant

---

### ✅ Step 4: Submit Claim Assessment (Assessor)
**Endpoint**: `POST /api/v1/claims/:id/submit-assessment`  
**Role**: ASSESSOR  
**Status**: ✅ **FULLY IMPLEMENTED**

**Current Implementation**:
- ✅ API Function: `submitAssessment(id, assessmentData?)` in `claimsApi.ts`
- ✅ UI: `handleSubmitAssessment()` in `LossAssessmentSystem.tsx`
- ✅ Updates assessment first if data provided, then submits
- ✅ Changes status to: `ASSESSED`

**Match**: ✅ **100%** - Fully compliant

---

### ✅ Step 5: Approve/Reject Claim (Insurer)
**Endpoint (Approve)**: `PUT /api/v1/claims/:id/approve`  
**Endpoint (Reject)**: `PUT /api/v1/claims/:id/reject`  
**Role**: INSURER  
**Status**: ✅ **FULLY IMPLEMENTED**

**Current Implementation**:
- ✅ API Function: `approveClaim(id, payoutAmount?, approvedAmount?, notes?)` in `claimsApi.ts`
- ✅ API Function: `rejectClaim(id, rejectionReason?, reason?)` in `claimsApi.ts`
- ✅ UI: `handleApproveClaim()` and `handleRejectClaim()` in `ClaimsTable.tsx`
- ✅ Supports both field names: `payoutAmount`/`approvedAmount` and `rejectionReason`/`reason`
- ✅ Sends both formats for backward compatibility

**Required Fields** (per flow):
```typescript
// Approve
{
  payoutAmount: number; // ✅ (also sends approvedAmount for compatibility)
}

// Reject
{
  rejectionReason: string; // ✅ (also sends reason for compatibility)
}
```

**Match**: ✅ **100%** - Fully compliant with backward compatibility

---

## Summary

### ✅ Fully Implemented Steps (5/5)
1. ✅ File Claim - Now includes `eventDate` and `estimatedLoss`
2. ✅ Assign Assessor
3. ✅ Update Claim Assessment
4. ✅ Submit Claim Assessment
5. ✅ Approve/Reject Claim - Supports both field name formats

---

## Implementation Status

### ✅ All Steps Complete

**Step 1: File Claim**
- ✅ Added `eventDate` field (date picker)
- ✅ Added `estimatedLoss` field (number input)
- ✅ Updated API to send `eventType`, `eventDate`, `description`, `estimatedLoss`
- ✅ Maintains backward compatibility with old field names

**Step 2: Assign Assessor**
- ✅ Fully implemented in ClaimsTable
- ✅ UI allows insurer to assign assessor to claims

**Step 3: Update Claim Assessment**
- ✅ Fully implemented in LossAssessmentSystem
- ✅ Supports visitDate, observations, damageArea, ndviBefore, ndviAfter, reportText

**Step 4: Submit Claim Assessment**
- ✅ Fully implemented in LossAssessmentSystem
- ✅ Updates assessment then submits

**Step 5: Approve/Reject Claim**
- ✅ Updated to support both `payoutAmount`/`approvedAmount`
- ✅ Updated to support both `rejectionReason`/`reason`
- ✅ Maintains backward compatibility

---

## Overall Compliance: 100% (5/5 steps fully compliant)

✅ **All Claim Assessment Flow steps are now fully implemented and compliant with the API specification.**

