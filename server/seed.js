import { connectToDatabase, getCollections } from './config/database.js';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectToDatabase();
    const { users, farmers, insurers, assessors, policies, claims, fields, assessments } = getCollections();

    // Clear existing data (optional - remove in production)
    await users.deleteMany({});
    await farmers.deleteMany({});
    await insurers.deleteMany({});
    await assessors.deleteMany({});
    await policies.deleteMany({});
    await claims.deleteMany({});
    await fields.deleteMany({});
    await assessments.deleteMany({});

    console.log('🗑️ Cleared existing data');

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 12);

    const sampleUsers = [
      {
        email: 'farmer@example.com',
        password: hashedPassword,
        role: 'farmer',
        name: 'Jean Baptiste',
        profile: {
          phone: '+250 123 456 789',
          farmName: 'Green Valley Farm',
          location: 'Kigali, Rwanda',
          farmSize: 12.5
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      },
      {
        email: 'insurer@example.com',
        password: hashedPassword,
        role: 'insurer',
        name: 'Sarah Johnson',
        profile: {
          company: 'AgriInsurance Ltd',
          position: 'Senior Underwriter'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      },
      {
        email: 'assessor@example.com',
        password: hashedPassword,
        role: 'assessor',
        name: 'Michael Brown',
        profile: {
          company: 'Field Assessment Services',
          position: 'Senior Assessor'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      },
      {
        email: 'government@example.com',
        password: hashedPassword,
        role: 'government',
        name: 'Dr. Alice Mukamana',
        profile: {
          department: 'Ministry of Agriculture',
          position: 'Director of Agricultural Policy'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      },
      {
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        name: 'System Administrator',
        profile: {
          department: 'IT Department',
          position: 'System Administrator'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }
    ];

    const userResults = await users.insertMany(sampleUsers);
    console.log('👥 Created sample users');

    // Create sample farmers - find the farmer user ID
    const farmerIndex = sampleUsers.findIndex(u => u.role === 'farmer');
    const farmerId = userResults.insertedIds[farmerIndex];
    const sampleFarmers = [
      {
        userId: farmerId,
        name: 'Jean Baptiste',
        email: 'farmer@example.com',
        phone: '+250 123 456 789',
        farmName: 'Green Valley Farm',
        location: 'Kigali, Rwanda',
        farmSize: 12.5,
        crops: ['Maize', 'Rice', 'Beans'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await farmers.insertMany(sampleFarmers);
    console.log('🌾 Created sample farmers');

    // Create sample fields
    const sampleFields = [
      {
        farmerId: farmerId,
        name: 'North Field - Maize',
        crop: 'Maize',
        area: 3.2,
        location: { lat: -1.9441, lng: 30.0619 },
        status: 'healthy',
        riskLevel: 'low',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        farmerId: farmerId,
        name: 'South Field - Rice',
        crop: 'Rice',
        area: 2.8,
        location: { lat: -1.9441, lng: 30.0619 },
        status: 'good',
        riskLevel: 'low',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        farmerId: farmerId,
        name: 'East Field - Beans',
        crop: 'Beans',
        area: 1.5,
        location: { lat: -1.9441, lng: 30.0619 },
        status: 'needs_attention',
        riskLevel: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        farmerId: farmerId,
        name: 'West Field - Maize',
        crop: 'Maize',
        area: 4.0,
        location: { lat: -1.9441, lng: 30.0619 },
        status: 'excellent',
        riskLevel: 'low',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        farmerId: farmerId,
        name: 'Central Field - Rice',
        crop: 'Rice',
        area: 1.0,
        location: { lat: -1.9441, lng: 30.0619 },
        status: 'good',
        riskLevel: 'low',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const fieldResults = await fields.insertMany(sampleFields);
    console.log('🌍 Created sample fields');

    // Create sample policies
    const samplePolicies = [
      {
        farmerId: farmerId,
        fieldId: fieldResults.insertedIds[0],
        crop: 'Maize',
        status: 'active',
        premium: 2500,
        coverage: 25000,
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-12-15'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        farmerId: farmerId,
        fieldId: fieldResults.insertedIds[1],
        crop: 'Rice',
        status: 'active',
        premium: 1800,
        coverage: 18000,
        startDate: new Date('2024-02-20'),
        endDate: new Date('2024-11-20'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        farmerId: farmerId,
        fieldId: fieldResults.insertedIds[2],
        crop: 'Beans',
        status: 'pending',
        premium: 1200,
        coverage: 12000,
        startDate: new Date('2024-03-10'),
        endDate: new Date('2024-10-10'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await policies.insertMany(samplePolicies);
    console.log('📋 Created sample policies');

    // Create sample claims
    const sampleClaims = [
      {
        farmerId: farmerId,
        fieldId: fieldResults.insertedIds[0],
        crop: 'Maize',
        damageType: 'Drought Damage',
        amount: 5000,
        description: 'Severe drought conditions affecting maize yield',
        status: 'pending',
        submittedAt: new Date('2024-03-12'),
        claimNumber: 'C001',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await claims.insertMany(sampleClaims);
    console.log('📝 Created sample claims');

    // Create sample assessments
    const assessorIndex = sampleUsers.findIndex(u => u.role === 'assessor');
    const assessorId = userResults.insertedIds[assessorIndex];
    const sampleAssessments = [
      {
        fieldId: fieldResults.insertedIds[0],
        farmerId: farmerId,
        assessorId: assessorId,
        assessmentType: 'Field Inspection',
        status: 'completed',
        riskLevel: 'low',
        findings: 'Field in excellent condition, no signs of disease or pest damage',
        notes: 'Regular monitoring recommended',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        fieldId: fieldResults.insertedIds[2],
        farmerId: farmerId,
        assessorId: assessorId,
        assessmentType: 'Risk Assessment',
        status: 'pending',
        riskLevel: 'medium',
        notes: 'Scheduled for next week',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await assessments.insertMany(sampleAssessments);
    console.log('🔍 Created sample assessments');

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Sample Data Summary:');
    console.log('- Users: 5 (farmer, insurer, assessor, government, admin)');
    console.log('- Farmers: 1');
    console.log('- Fields: 5');
    console.log('- Policies: 3');
    console.log('- Claims: 1');
    console.log('- Assessments: 2');
    console.log('\n🔑 Login Credentials:');
    console.log('- Email: farmer@example.com | Password: password123');
    console.log('- Email: insurer@example.com | Password: password123');
    console.log('- Email: assessor@example.com | Password: password123');
    console.log('- Email: government@example.com | Password: password123');
    console.log('- Email: admin@example.com | Password: password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;
