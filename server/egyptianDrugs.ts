import * as fs from 'fs';
import * as path from 'path';

export interface Drug {
  id: number | string;
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

let EGYPTIAN_DRUGS: Drug[] = [];

try {
  const dataPath = path.join(__dirname, 'egyptianDrugsData.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  EGYPTIAN_DRUGS = JSON.parse(rawData);
  console.log(`Loaded ${EGYPTIAN_DRUGS.length} medicines from Egyptian drug database`);
} catch (error) {
  console.error('Failed to load Egyptian drugs database:', error);
  EGYPTIAN_DRUGS = [];
}

export { EGYPTIAN_DRUGS };

export function searchDrugByName(searchName: string): Drug | undefined {
  const normalizedSearch = searchName.toLowerCase().trim();
  
  return EGYPTIAN_DRUGS.find(drug => {
    const nameMatch = drug.name.toLowerCase().includes(normalizedSearch) ||
                      normalizedSearch.includes(drug.name.toLowerCase());
    const arabicMatch = drug.nameArabic && (
      drug.nameArabic.includes(searchName) ||
      searchName.includes(drug.nameArabic)
    );
    return nameMatch || arabicMatch;
  });
}

export function searchDrugsByActiveIngredient(ingredient: string): Drug[] {
  const normalizedIngredient = ingredient.toLowerCase().trim();
  
  return EGYPTIAN_DRUGS.filter(drug => {
    if (!drug.activeIngredient) return false;
    return drug.activeIngredient.toLowerCase().includes(normalizedIngredient);
  }).slice(0, 5);
}

export function getAllDrugs(): Drug[] {
  return EGYPTIAN_DRUGS;
}
