import express from 'express';
import { getCollections } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Mock JWT secret - in production, use a secure secret
const JWT_SECRET = process.env.JWT_SECRET || 'starhawk-secret-key-2024';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password || !role) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, password, and role are required'
      });
    }

    const { users } = getCollections();
    
    // Find user by email and role
    const user = await users.findOne({ 
      email: email.toLowerCase(), 
      role: role.toLowerCase() 
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'User not found or invalid role'
      });
    }

    // For now, we'll skip password verification since this is a wireframe
    // In production, you would verify the password:
    // const isValidPassword = await bcrypt.compare(password, user.password);
    // if (!isValidPassword) {
    //   return res.status(401).json({ error: 'Invalid credentials' });
    // }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          profile: user.profile
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

// Register endpoint (for creating new users)
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, name, profile } = req.body;
    
    if (!email || !password || !role || !name) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, password, role, and name are required'
      });
    }

    const { users } = getCollections();
    
    // Check if user already exists
    const existingUser = await users.findOne({ 
      email: email.toLowerCase() 
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = {
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role.toLowerCase(),
      name,
      profile: profile || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    const result = await users.insertOne(newUser);

    // Create role-specific profile
    if (role.toLowerCase() === 'farmer') {
      const { farmers } = getCollections();
      await farmers.insertOne({
        userId: result.insertedId,
        name,
        email: email.toLowerCase(),
        phone: profile?.phone || '',
        farmName: profile?.farmName || '',
        location: profile?.location || '',
        farmSize: profile?.farmSize || 0,
        crops: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else if (role.toLowerCase() === 'insurer') {
      const { insurers } = getCollections();
      await insurers.insertOne({
        userId: result.insertedId,
        name,
        email: email.toLowerCase(),
        phone: profile?.phone || '',
        company: profile?.company || '',
        position: profile?.position || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else if (role.toLowerCase() === 'assessor') {
      const { assessors } = getCollections();
      await assessors.insertOne({
        userId: result.insertedId,
        name,
        email: email.toLowerCase(),
        phone: profile?.phone || '',
        company: profile?.company || '',
        position: profile?.position || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.insertedId, 
        email: newUser.email, 
        role: newUser.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: result.insertedId,
          email: newUser.email,
          role: newUser.role,
          name: newUser.name,
          profile: newUser.profile
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Authorization token is required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { users } = getCollections();
    
    const user = await users.findOne({ _id: decoded.userId });
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          profile: user.profile
        }
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
});

export default router;
