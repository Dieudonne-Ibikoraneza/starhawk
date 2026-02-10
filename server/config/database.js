import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://uzasolutionsltd_db_user:f5worjQbrVkfraJ8@cluster0.bu0bdxj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = process.env.DATABASE_NAME || 'starhawk_db';

let client;
let db;

export const connectToDatabase = async () => {
  try {
    if (client && db) {
      return { client, db };
    }

    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);

    await client.connect();
    console.log('Connected to MongoDB successfully!');
    
    db = client.db(DATABASE_NAME);
    
    return { client, db };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
};

export const closeDatabaseConnection = async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed.');
  }
};

// Database collections
export const getCollections = () => {
  const database = getDatabase();
  return {
    users: database.collection('users'),
    farmers: database.collection('farmers'),
    insurers: database.collection('insurers'),
    assessors: database.collection('assessors'),
    policies: database.collection('policies'),
    claims: database.collection('claims'),
    assessments: database.collection('assessments'),
    fields: database.collection('fields'),
    reports: database.collection('reports'),
    notifications: database.collection('notifications')
  };
};
