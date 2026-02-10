import express from 'express';
import { getCollections } from '../config/database.js';

const router = express.Router();

// Get assessor dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { assessments, fields, farmers } = getCollections();
    
    // Get dashboard statistics
    const totalAssessments = await assessments.countDocuments();
    const pendingAssessments = await assessments.countDocuments({ status: 'pending' });
    const completedAssessments = await assessments.countDocuments({ status: 'completed' });
    const totalFields = await fields.countDocuments();

    // Get recent assessments
    const recentAssessments = await assessments.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    res.json({
      success: true,
      data: {
        stats: {
          totalAssessments,
          pendingAssessments,
          completedAssessments,
          totalFields
        },
        recentAssessments
      }
    });

  } catch (error) {
    console.error('Assessor dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: 'An error occurred while fetching assessor data'
    });
  }
});

// Get pending assessments
router.get('/assessments/pending', async (req, res) => {
  try {
    const { assessments } = getCollections();
    
    const pendingAssessments = await assessments.find({ 
      status: 'pending' 
    }).sort({ createdAt: 1 }).toArray();

    res.json({
      success: true,
      data: pendingAssessments
    });

  } catch (error) {
    console.error('Get pending assessments error:', error);
    res.status(500).json({
      error: 'Failed to fetch pending assessments',
      message: 'An error occurred while fetching assessments'
    });
  }
});

// Create new assessment
router.post('/assessments', async (req, res) => {
  try {
    const { fieldId, farmerId, assessmentType, notes, riskLevel } = req.body;
    
    if (!fieldId || !farmerId || !assessmentType) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Field ID, farmer ID, and assessment type are required'
      });
    }

    const { assessments } = getCollections();
    
    const newAssessment = {
      fieldId,
      farmerId,
      assessorId: req.user?.userId,
      assessmentType,
      notes,
      riskLevel: riskLevel || 'medium',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await assessments.insertOne(newAssessment);

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: {
        assessmentId: result.insertedId
      }
    });

  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({
      error: 'Failed to create assessment',
      message: 'An error occurred while creating the assessment'
    });
  }
});

// Update assessment
router.put('/assessments/:assessmentId', async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { status, notes, riskLevel, findings } = req.body;
    
    const { assessments } = getCollections();
    
    const updateData = {
      updatedAt: new Date()
    };

    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (riskLevel) updateData.riskLevel = riskLevel;
    if (findings) updateData.findings = findings;

    const result = await assessments.updateOne(
      { _id: assessmentId },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: 'Assessment updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({
      error: 'Failed to update assessment',
      message: 'An error occurred while updating the assessment'
    });
  }
});

// Get assessment history
router.get('/assessments', async (req, res) => {
  try {
    const { assessments } = getCollections();
    
    const allAssessments = await assessments.find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: allAssessments
    });

  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({
      error: 'Failed to fetch assessments',
      message: 'An error occurred while fetching assessments'
    });
  }
});

export default router;
