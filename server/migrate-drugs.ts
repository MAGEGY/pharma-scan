import * as fs from 'fs';
import * as path from 'path';
import { db } from './db';
import { egyptianDrugs } from '../shared/schema';

interface DrugData {
  id: number;
  name: string;
  nameArabic: string;
  activeIngredient: string;
  price: number | null;
  manufacturer: string;
  descriptionArabic: string;
  descriptionEnglish: string;
  category?: string;
  form?: string;
  dosing?: string;
  interactions?: string[];
  contraindications?: string[];
  sideEffects?: string[];
}

async function migrateDrugs() {
  try {
    console.log('Starting Egyptian drugs migration...');
    
    // Read the JSON data
    const dataPath = path.join(__dirname, 'egyptianDrugsData.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const drugsData: DrugData[] = JSON.parse(rawData);
    
    console.log(`Loaded ${drugsData.length} drugs from JSON file`);
    
    // Clear existing data
    await db.delete(egyptianDrugs);
    console.log('Cleared existing Egyptian drugs data');
    
    // Insert data in batches to avoid memory issues
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < drugsData.length; i += batchSize) {
      const batch = drugsData.slice(i, i + batchSize);
      
      try {
        await db.insert(egyptianDrugs).values(
          batch.map(drug => ({
            id: drug.id,
            name: drug.name,
            nameArabic: drug.nameArabic,
            activeIngredient: drug.activeIngredient || null,
            price: drug.price ? String(drug.price) : null,
            manufacturer: drug.manufacturer || null,
            descriptionArabic: drug.descriptionArabic || null,
            descriptionEnglish: drug.descriptionEnglish || null,
            category: drug.category || null,
            form: drug.form || null,
            dosing: drug.dosing || null,
            interactions: drug.interactions || null,
            contraindications: drug.contraindications || null,
            sideEffects: drug.sideEffects || null,
          }))
        );
        
        insertedCount += batch.length;
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(drugsData.length / batchSize)} (${insertedCount}/${drugsData.length} drugs)`);
      } catch (error) {
        console.error(`Error inserting batch starting at index ${i}:`, error);
        // Continue with next batch
      }
    }
    
    console.log(`Migration completed! Inserted ${insertedCount} drugs into database`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateDrugs()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateDrugs };
