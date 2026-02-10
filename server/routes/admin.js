import express from 'express';
import { getCollections } from '../config/database.js';

const router = express.Router();

// Get admin dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { users, farmers, insurers, assessors, policies, claims } = getCollections();
    
    // Get system statistics
    const totalUsers = await users.countDocuments();
    const totalFarmers = await farmers.countDocuments();
    const totalInsurers = await insurers.countDocuments();
    const totalAssessors = await assessors.countDocuments();
    const totalPolicies = await policies.countDocuments();
    const totalClaims = await claims.countDocuments();

    // Get recent activities
    const recentUsers = await users.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const recentClaims = await claims.find({})
      .sort({ submittedAt: -1 })
      .limit(10)
      .toArray();

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalFarmers,
          totalInsurers,
          totalAssessors,
          totalPolicies,
          totalClaims
        },
        recentUsers,
        recentClaims
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: 'An error occurred while fetching admin data'
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { users } = getCollections();
    
    const allUsers = await users.find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Remove sensitive data
    const safeUsers = allUsers.map(user => ({
      _id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({
      success: true,
      data: safeUsers
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: 'An error occurred while fetching users'
    });
  }
});

// Update user status
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, role } = req.body;
    
    const { users } = getCollections();
    
    const updateData = {
      updatedAt: new Date()
    };

    if (isActive !== undefined) updateData.isActive = isActive;
    if (role) updateData.role = role;

    const result = await users.updateOne(
      { _id: userId },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: 'An error occurred while updating the user'
    });
  }
});

// Get system logs (mock for now)
router.get('/logs', async (req, res) => {
  try {
    // Mock system logs
    const systemLogs = [
      {
        id: 1,
        timestamp: new Date(),
        level: 'INFO',
        message: 'User login successful',
        userId: 'user123',
        action: 'LOGIN'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 300000),
        level: 'WARN',
        message: 'Failed login attempt',
        userId: 'user456',
        action: 'LOGIN_FAILED'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 600000),
        level: 'INFO',
        message: 'New policy created',
        userId: 'user789',
        action: 'POLICY_CREATED'
      }
    ];

    res.json({
      success: true,
      data: systemLogs
    });

  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      error: 'Failed to fetch logs',
      message: 'An error occurred while fetching system logs'
    });
  }
});

// Get system settings
router.get('/settings', async (req, res) => {
  try {
    // Mock system settings
    const systemSettings = {
      maintenanceMode: false,
      registrationEnabled: true,
      maxFileSize: '10MB',
      supportedFileTypes: ['jpg', 'png', 'pdf'],
      notificationSettings: {
        email: true,
        sms: false,
        push: true
      }
    };

    res.json({
      success: true,
      data: systemSettings
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      error: 'Failed to fetch settings',
      message: 'An error occurred while fetching system settings'
    });
  }
});

// Update system settings
router.put('/settings', async (req, res) => {
  try {
    const { maintenanceMode, registrationEnabled, notificationSettings } = req.body;
    
    // In a real application, you would save these to a settings collection
    const updatedSettings = {
      maintenanceMode: maintenanceMode || false,
      registrationEnabled: registrationEnabled !== undefined ? registrationEnabled : true,
      notificationSettings: notificationSettings || {}
    };

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      error: 'Failed to update settings',
      message: 'An error occurred while updating system settings'
    });
  }
});

export default router;
