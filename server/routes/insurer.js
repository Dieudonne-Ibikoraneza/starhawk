import express from 'express';
import { getCollections } from '../config/database.js';

const router = express.Router();

// Get insurer dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { policies, claims, farmers } = getCollections();
    
    // Get dashboard statistics
    const totalPolicies = await policies.countDocuments();
    const activePolicies = await policies.countDocuments({ status: 'active' });
    const pendingClaims = await claims.countDocuments({ status: 'pending' });
    const totalFarmers = await farmers.countDocuments();

    // Get recent activities
    const recentClaims = await claims.find({})
      .sort({ submittedAt: -1 })
      .limit(10)
      .toArray();

    const recentPolicies = await policies.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    res.json({
      success: true,
      data: {
        stats: {
          totalPolicies,
          activePolicies,
          pendingClaims,
          totalFarmers
        },
        recentClaims,
        recentPolicies
      }
    });

  } catch (error) {
    console.error('Insurer dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: 'An error occurred while fetching insurer data'
    });
  }
});

// Get all policies
router.get('/policies', async (req, res) => {
  try {
    const { policies } = getCollections();
    
    const allPolicies = await policies.find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: allPolicies
    });

  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({
      error: 'Failed to fetch policies',
      message: 'An error occurred while fetching policies'
    });
  }
});

// Update policy status
router.put('/policies/:policyId', async (req, res) => {
  try {
    const { policyId } = req.params;
    const { status, notes } = req.body;
    
    const { policies } = getCollections();
    
    const result = await policies.updateOne(
      { _id: policyId },
      { 
        $set: { 
          status, 
          notes,
          updatedAt: new Date() 
        } 
      }
    );

    res.json({
      success: true,
      message: 'Policy updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Update policy error:', error);
    res.status(500).json({
      error: 'Failed to update policy',
      message: 'An error occurred while updating the policy'
    });
  }
});

// Get all claims
router.get('/claims', async (req, res) => {
  try {
    const { claims } = getCollections();
    
    const allClaims = await claims.find({})
      .sort({ submittedAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: allClaims
    });

  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({
      error: 'Failed to fetch claims',
      message: 'An error occurred while fetching claims'
    });
  }
});

// Update claim status
router.put('/claims/:claimId', async (req, res) => {
  try {
    const { claimId } = req.params;
    const { status, approvedAmount, notes } = req.body;
    
    const { claims } = getCollections();
    
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (approvedAmount) {
      updateData.approvedAmount = parseFloat(approvedAmount);
    }
    if (notes) {
      updateData.notes = notes;
    }

    const result = await claims.updateOne(
      { _id: claimId },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: 'Claim updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Update claim error:', error);
    res.status(500).json({
      error: 'Failed to update claim',
      message: 'An error occurred while updating the claim'
    });
  }
});

export default router;
