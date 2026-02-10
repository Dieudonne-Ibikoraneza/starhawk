import express from 'express';
import { getCollections } from '../config/database.js';

const router = express.Router();

// Get government dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { farmers, policies, claims, assessments } = getCollections();
    
    // Get national statistics
    const totalFarmers = await farmers.countDocuments();
    const totalPolicies = await policies.countDocuments();
    const totalClaims = await claims.countDocuments();
    const totalAssessments = await assessments.countDocuments();

    // Get regional data (mock for now)
    const regionalData = [
      { region: 'Northern Province', farmers: 150, policies: 120, claims: 15 },
      { region: 'Southern Province', farmers: 200, policies: 180, claims: 25 },
      { region: 'Eastern Province', farmers: 100, policies: 85, claims: 10 },
      { region: 'Western Province', farmers: 180, policies: 160, claims: 20 }
    ];

    // Get recent activities
    const recentClaims = await claims.find({})
      .sort({ submittedAt: -1 })
      .limit(10)
      .toArray();

    res.json({
      success: true,
      data: {
        nationalStats: {
          totalFarmers,
          totalPolicies,
          totalClaims,
          totalAssessments
        },
        regionalData,
        recentClaims
      }
    });

  } catch (error) {
    console.error('Government dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: 'An error occurred while fetching government data'
    });
  }
});

// Get national reports
router.get('/reports', async (req, res) => {
  try {
    const { reports } = getCollections();
    
    const nationalReports = await reports.find({ 
      type: 'national' 
    }).sort({ createdAt: -1 }).toArray();

    res.json({
      success: true,
      data: nationalReports
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      error: 'Failed to fetch reports',
      message: 'An error occurred while fetching reports'
    });
  }
});

// Generate national report
router.post('/reports/generate', async (req, res) => {
  try {
    const { reportType, period, region } = req.body;
    
    if (!reportType || !period) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Report type and period are required'
      });
    }

    const { reports } = getCollections();
    
    const newReport = {
      type: 'national',
      reportType,
      period,
      region: region || 'all',
      status: 'generating',
      createdAt: new Date(),
      generatedBy: req.user?.userId
    };

    const result = await reports.insertOne(newReport);

    // Simulate report generation
    setTimeout(async () => {
      await reports.updateOne(
        { _id: result.insertedId },
        { 
          $set: { 
            status: 'completed',
            data: {
              summary: 'National agricultural insurance report generated',
              totalFarmers: 630,
              totalPolicies: 545,
              totalClaims: 70,
              totalCoverage: 5450000
            }
          } 
        }
      );
    }, 2000);

    res.status(201).json({
      success: true,
      message: 'Report generation started',
      data: {
        reportId: result.insertedId
      }
    });

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      message: 'An error occurred while generating the report'
    });
  }
});

// Get regional analytics
router.get('/analytics/regional', async (req, res) => {
  try {
    // Mock regional analytics data
    const regionalAnalytics = [
      {
        region: 'Northern Province',
        farmers: 150,
        policies: 120,
        claims: 15,
        coverage: 1200000,
        riskLevel: 'Low'
      },
      {
        region: 'Southern Province',
        farmers: 200,
        policies: 180,
        claims: 25,
        coverage: 1800000,
        riskLevel: 'Medium'
      },
      {
        region: 'Eastern Province',
        farmers: 100,
        policies: 85,
        claims: 10,
        coverage: 850000,
        riskLevel: 'Low'
      },
      {
        region: 'Western Province',
        farmers: 180,
        policies: 160,
        claims: 20,
        coverage: 1600000,
        riskLevel: 'Medium'
      }
    ];

    res.json({
      success: true,
      data: regionalAnalytics
    });

  } catch (error) {
    console.error('Get regional analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch regional analytics',
      message: 'An error occurred while fetching analytics'
    });
  }
});

export default router;
