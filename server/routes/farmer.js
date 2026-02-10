import express from 'express';
import { getCollections } from '../config/database.js';

const router = express.Router();

// Get farmer dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { farmers, policies, claims, fields } = getCollections();
    
    // Get farmer data (mock for now)
    const farmerData = {
      activePolicies: 3,
      pendingClaims: 1,
      totalCoverage: 45000,
      fieldsMonitored: 5,
      totalArea: 12.5,
      riskLevel: 'Low'
    };

    // Get recent policies
    const recentPolicies = await policies.find({ 
      farmerId: req.user?.userId 
    }).limit(5).toArray();

    // Get recent claims
    const recentClaims = await claims.find({ 
      farmerId: req.user?.userId 
    }).limit(5).toArray();

    // Get field data
    const fieldData = await fields.find({ 
      farmerId: req.user?.userId 
    }).toArray();

    res.json({
      success: true,
      data: {
        overview: farmerData,
        policies: recentPolicies,
        claims: recentClaims,
        fields: fieldData
      }
    });

  } catch (error) {
    console.error('Farmer dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: 'An error occurred while fetching farmer data'
    });
  }
});

// Get farmer policies
router.get('/policies', async (req, res) => {
  try {
    const { policies } = getCollections();
    
    const farmerPolicies = await policies.find({ 
      farmerId: req.user?.userId 
    }).toArray();

    res.json({
      success: true,
      data: farmerPolicies
    });

  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({
      error: 'Failed to fetch policies',
      message: 'An error occurred while fetching policies'
    });
  }
});

// Create new claim
router.post('/claims', async (req, res) => {
  try {
    const { crop, damageType, amount, description, fieldId } = req.body;
    
    if (!crop || !damageType || !amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Crop, damage type, and amount are required'
      });
    }

    const { claims } = getCollections();
    
    const newClaim = {
      farmerId: req.user?.userId,
      crop,
      damageType,
      amount: parseFloat(amount),
      description,
      fieldId,
      status: 'pending',
      submittedAt: new Date(),
      claimNumber: `C${Date.now()}`
    };

    const result = await claims.insertOne(newClaim);

    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully',
      data: {
        claimId: result.insertedId,
        claimNumber: newClaim.claimNumber
      }
    });

  } catch (error) {
    console.error('Create claim error:', error);
    res.status(500).json({
      error: 'Failed to create claim',
      message: 'An error occurred while creating the claim'
    });
  }
});

// Get farmer claims
router.get('/claims', async (req, res) => {
  try {
    const { claims } = getCollections();
    
    const farmerClaims = await claims.find({ 
      farmerId: req.user?.userId 
    }).sort({ submittedAt: -1 }).toArray();

    res.json({
      success: true,
      data: farmerClaims
    });

  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({
      error: 'Failed to fetch claims',
      message: 'An error occurred while fetching claims'
    });
  }
});

// Get field monitoring data
router.get('/fields', async (req, res) => {
  try {
    const { fields } = getCollections();
    
    const farmerFields = await fields.find({ 
      farmerId: req.user?.userId 
    }).toArray();

    res.json({
      success: true,
      data: farmerFields
    });

  } catch (error) {
    console.error('Get fields error:', error);
    res.status(500).json({
      error: 'Failed to fetch fields',
      message: 'An error occurred while fetching field data'
    });
  }
});

// Update farmer profile
router.put('/profile', async (req, res) => {
  try {
    const { name, phone, farmName, location, farmSize } = req.body;
    
    const { farmers } = getCollections();
    
    const updateData = {
      name,
      phone,
      farmName,
      location,
      farmSize: parseFloat(farmSize),
      updatedAt: new Date()
    };

    const result = await farmers.updateOne(
      { userId: req.user?.userId },
      { $set: updateData },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: 'An error occurred while updating the profile'
    });
  }
});

export default router;
