import { db } from '../server/db';
import { 
  prescriptionBackups,
  usageAnalytics,
  priceTrends,
  marketIntelligence,
  exportHistory,
  userPrescriptions,
  userAllergies,
  drugInteractions,
  dosageGuidelines
} from '../shared/schema';

// Setup test database
export const setupTestDatabase = async () => {
  // Clear all tables
  await db.delete(prescriptionBackups);
  await db.delete(usageAnalytics);
  await db.delete(priceTrends);
  await db.delete(marketIntelligence);
  await db.delete(exportHistory);
  await db.delete(userPrescriptions);
  await db.delete(userAllergies);
  await db.delete(drugInteractions);
  await db.delete(dosageGuidelines);

  // Insert test data
  const testUser = {
    id: 'test-user-e2e',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [testUser] = await db.insert(users).values(testUser).returning();

  const testAllergies = [
    {
      id: 'allergy-1',
      userId: testUser[0].id,
      allergenType: 'drug',
      allergenName: 'Penicillin',
      severity: 'severe',
      reaction: 'Anaphylaxis',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'allergy-2',
      userId: testUser[0].id,
      allergenType: 'food',
      allergenName: 'Peanuts',
      severity: 'moderate',
      reaction: 'Hives',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const [testPrescriptions] = [
    {
      id: 'prescription-1',
      userId: testUser[0].id,
      drugId: 123,
      drugName: 'Aspirin',
      dosage: '500mg',
      frequency: 'twice daily',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prescription-2',
      userId: testUser[0].id,
      drugId: 124,
      drugName: 'Ibuprofen',
      dosage: '400mg',
      frequency: 'three times daily',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const [testDrugInteractions] = [
    {
      id: 'interaction-1',
      drug1Id: 123,
      drug2Id: 124,
      severity: 'major',
      interactionType: 'Pharmacodynamic',
      description: 'Both drugs may increase risk of bleeding when taken together',
      recommendation: 'Monitor for signs of bleeding and consider dose adjustments',
      evidenceLevel: 'strong',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const [testDosageGuidelines] = [
    {
      id: 'dosage-1',
      drugId: 123,
      ageGroup: 'adult',
      weightRange: '50-80kg',
      dosagePerKg: '5-10mg/kg/day',
      maxDailyDose: '800mg',
      frequency: '2-3 times daily',
      duration: '5-7 days',
      notes: 'Take with food to reduce stomach upset',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'dosage-2',
      drugId: 123,
      ageGroup: 'child',
      weightRange: '20-50kg',
      dosagePerKg: '10-15mg/kg/day',
      maxDailyDose: '600mg',
      frequency: '3 times daily',
      duration: '5-7 days',
      notes: 'Use weight-based dosing for children',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await db.insert(userAllergies).values(testAllergies);
  await db.insert(userPrescriptions).values(testPrescriptions);
  await db.insert(drugInteractions).values(testDrugInteractions);
  await db.insert(dosageGuidelines).values(testDosageGuidelines);

  console.log('Test database setup completed');
  return {
    testUser: testUser[0],
    testAllergies,
    testPrescriptions,
    testDrugInteractions,
    testDosageGuidelines,
  };
};

// Cleanup test database
export const cleanupTestDatabase = async () => {
  await db.delete(prescriptionBackups);
  await db.delete(usageAnalytics);
  await db.delete(priceTrends);
  await db.delete(marketIntelligence);
  await db.delete(exportHistory);
  await db.delete(userPrescriptions);
  await db.delete(userAllergies);
  await db.delete(drugInteractions);
  await db.delete(dosageGuidelines);
  await db.delete(users);
};

// Create test environment variables
export const createTestEnvironment = () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.DATABASE_URL = 'postgresql://localhost:5432/pharma-scan-test';
  process.env.TEST_USER_ID = 'test-user-e2e';
  process.env.TEST_EMAIL = 'test@example.com';
  process.env.TEST_DEVICE_ID = 'test-device';
  process.env.TEST_CLOUD_PROVIDER = 'google_drive';
  process.env.TEST_REGION = 'Cairo';
  process.env.TEST_DRUG_ID = '123';
};
