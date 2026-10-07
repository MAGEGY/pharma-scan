import { db } from '../server/db';
import { drugInteractions, dosageGuidelines, egyptianDrugs } from '../shared/schema';

async function seedSampleData() {
  console.log('Seeding sample data for advanced features...');

  try {
    // Get some sample drugs from the database
    const sampleDrugs = await db.select().from(egyptianDrugs).limit(10);
    
    if (sampleDrugs.length < 2) {
      console.log('Not enough drugs in database to create interactions');
      return;
    }

    // Sample drug interactions
    const sampleInteractions = [
      {
        drug1Id: sampleDrugs[0]?.id || 1,
        drug2Id: sampleDrugs[1]?.id || 2,
        severity: 'moderate',
        interactionType: 'Pharmacodynamic',
        description: 'Both drugs may increase the risk of bleeding when taken together.',
        recommendation: 'Monitor for signs of bleeding and consider dose adjustments.',
        evidenceLevel: 'moderate',
        isActive: true,
      },
      {
        drug1Id: sampleDrugs[0]?.id || 1,
        drug2Id: sampleDrugs[2]?.id || 3,
        severity: 'major',
        interactionType: 'Pharmacokinetic',
        description: 'The first drug may increase the concentration of the second drug in the blood.',
        recommendation: 'Consider reducing the dose of the second drug and monitor for side effects.',
        evidenceLevel: 'strong',
        isActive: true,
      },
      {
        drug1Id: sampleDrugs[1]?.id || 2,
        drug2Id: sampleDrugs[2]?.id || 3,
        severity: 'minor',
        interactionType: 'Pharmacodynamic',
        description: 'Minor interaction that may cause mild drowsiness.',
        recommendation: 'Be cautious when driving or operating machinery.',
        evidenceLevel: 'limited',
        isActive: true,
      },
    ];

    // Insert sample interactions
    for (const interaction of sampleInteractions) {
      await db.insert(drugInteractions).values(interaction);
      console.log(`Added interaction between drugs ${interaction.drug1Id} and ${interaction.drug2Id}`);
    }

    // Sample dosage guidelines
    const sampleDosageGuidelines = [
      // For the first drug (assuming it's a common medication)
      {
        drugId: sampleDrugs[0]?.id || 1,
        ageGroup: 'adult',
        weightRange: '50-80kg',
        dosagePerKg: '5-10mg/kg/day',
        maxDailyDose: '800mg',
        frequency: '2-3 times daily',
        duration: '5-7 days',
        notes: 'Take with food to reduce stomach upset',
        isActive: true,
      },
      {
        drugId: sampleDrugs[0]?.id || 1,
        ageGroup: 'child',
        weightRange: '20-50kg',
        dosagePerKg: '10-15mg/kg/day',
        maxDailyDose: '600mg',
        frequency: '3 times daily',
        duration: '5-7 days',
        notes: 'Monitor for allergic reactions in children',
        isActive: true,
      },
      {
        drugId: sampleDrugs[0]?.id || 1,
        ageGroup: 'elderly',
        weightRange: '40-70kg',
        dosagePerKg: '3-5mg/kg/day',
        maxDailyDose: '400mg',
        frequency: '2 times daily',
        duration: '5-7 days',
        notes: 'Reduce dose due to decreased kidney function',
        isActive: true,
      },
      // For the second drug
      {
        drugId: sampleDrugs[1]?.id || 2,
        ageGroup: 'adult',
        weightRange: '50-90kg',
        dosagePerKg: '1-2mg/kg/day',
        maxDailyDose: '200mg',
        frequency: 'once daily',
        duration: 'as needed',
        notes: 'Take at the same time each day',
        isActive: true,
      },
      {
        drugId: sampleDrugs[1]?.id || 2,
        ageGroup: 'adolescent',
        weightRange: '40-60kg',
        dosagePerKg: '1.5-2.5mg/kg/day',
        maxDailyDose: '150mg',
        frequency: 'once daily',
        duration: 'as needed',
        notes: 'Monitor for growth and development effects',
        isActive: true,
      },
      // For the third drug
      {
        drugId: sampleDrugs[2]?.id || 3,
        ageGroup: 'adult',
        weightRange: '45-85kg',
        dosagePerKg: '0.5-1mg/kg/day',
        maxDailyDose: '100mg',
        frequency: 'twice daily',
        duration: '10-14 days',
        notes: 'Complete full course of treatment',
        isActive: true,
      },
      {
        drugId: sampleDrugs[2]?.id || 3,
        ageGroup: 'infant',
        weightRange: '5-10kg',
        dosagePerKg: '2-3mg/kg/day',
        maxDailyDose: '30mg',
        frequency: '3 times daily',
        duration: '7-10 days',
        notes: 'Use only under medical supervision',
        isActive: true,
      },
    ];

    // Insert sample dosage guidelines
    for (const guideline of sampleDosageGuidelines) {
      await db.insert(dosageGuidelines).values(guideline);
      console.log(`Added dosage guideline for drug ${guideline.drugId} (${guideline.ageGroup})`);
    }

    console.log('Sample data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding sample data:', error);
  }
}

// Run the seeding function
seedSampleData()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
