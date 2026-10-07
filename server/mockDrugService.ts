import { EgyptianDrug } from '../shared/schema';

// Mock Egyptian drug data for testing
const mockDrugs: EgyptianDrug[] = [
  {
    id: 1,
    name: 'Panadol',
    nameArabic: 'بانادول',
    activeIngredient: 'Paracetamol',
    category: 'Analgesic',
    manufacturer: 'GSK',
    form: 'Tablet',
    price: 25.50,
    dosing: 'Adults: 1-2 tablets every 4-6 hours as needed. Maximum 8 tablets in 24 hours.',
    descriptionEnglish: 'Pain reliever and fever reducer',
    descriptionArabic: 'مسكن للألم وخافض للحرارة',
    interactions: ['Warfarin', 'Alcohol'],
    contraindications: ['Liver disease', 'Allergy to paracetamol'],
    sideEffects: ['Nausea', 'Liver toxicity (high doses)'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Augmentin',
    nameArabic: 'أوجمنتين',
    activeIngredient: 'Amoxicillin/Clavulanate',
    category: 'Antibiotic',
    manufacturer: 'GSK',
    form: 'Tablet',
    price: 85.00,
    dosing: 'Adults: 1 tablet every 8 hours for 7-10 days.',
    descriptionEnglish: 'Broad-spectrum antibiotic',
    descriptionArabic: 'مضاد حيوي واسع المدى',
    interactions: ['Oral contraceptives', 'Warfarin'],
    contraindications: ['Penicillin allergy'],
    sideEffects: ['Diarrhea', 'Nausea', 'Yeast infections'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Concor',
    nameArabic: 'كونكور',
    activeIngredient: 'Bisoprolol',
    category: 'Beta Blocker',
    manufacturer: 'Merck',
    form: 'Tablet',
    price: 45.75,
    dosing: 'Adults: 2.5-10 mg once daily, usually in the morning.',
    descriptionEnglish: 'Beta blocker for hypertension and heart conditions',
    descriptionArabic: 'حاصر بيتا لعلاج ارتفاع ضغط الدم وأمراض القلب',
    interactions: ['Other beta blockers', 'Calcium channel blockers'],
    contraindications: ['Severe asthma', 'Heart block'],
    sideEffects: ['Fatigue', 'Dizziness', 'Bradycardia'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 4,
    name: 'Glucophage',
    nameArabic: 'جلوكوفاج',
    activeIngredient: 'Metformin',
    category: 'Antidiabetic',
    manufacturer: 'Merck',
    form: 'Tablet',
    price: 35.25,
    dosing: 'Adults: 500 mg twice daily with meals, gradually increase as needed.',
    descriptionEnglish: 'Oral diabetes medication',
    descriptionArabic: 'دواء فموي للسكري',
    interactions: ['Contrast media', 'Alcohol'],
    contraindications: ['Renal impairment', 'Metabolic acidosis'],
    sideEffects: ['GI upset', 'Lactic acidosis (rare)'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 5,
    name: 'Zyrtec',
    nameArabic: 'زيرتيك',
    activeIngredient: 'Cetirizine',
    category: 'Antihistamine',
    manufacturer: 'UCB',
    form: 'Tablet',
    price: 28.90,
    dosing: 'Adults and children over 12: 10 mg once daily.',
    descriptionEnglish: 'Antihistamine for allergies',
    descriptionArabic: 'مضاد هيستامين للحساسية',
    interactions: ['Alcohol', 'CNS depressants'],
    contraindications: ['Severe renal impairment'],
    sideEffects: ['Drowsiness', 'Dry mouth'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 6,
    name: 'Ventolin',
    nameArabic: 'فنتولين',
    activeIngredient: 'Salbutamol',
    category: 'Bronchodilator',
    manufacturer: 'GSK',
    form: 'Inhaler',
    price: 42.30,
    dosing: '1-2 puffs every 4-6 hours as needed for asthma symptoms.',
    descriptionEnglish: 'Bronchodilator inhaler for asthma',
    descriptionArabic: 'بخاخ موسع للقصبات الهوائية للربو',
    interactions: ['Beta blockers'],
    contraindications: ['Tachyarrhythmias'],
    sideEffects: ['Tremor', 'Tachycardia', 'Headache'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 7,
    name: 'Aspirin Protect',
    nameArabic: 'أسبرين بروتك',
    activeIngredient: 'Aspirin',
    category: 'Antiplatelet',
    manufacturer: 'Bayer',
    form: 'Tablet',
    price: 18.45,
    dosing: 'Adults: 100 mg once daily for cardiovascular protection.',
    descriptionEnglish: 'Low-dose aspirin for heart protection',
    descriptionArabic: 'أسبرين منخفض الجرعة لحماية القلب',
    interactions: ['Warfarin', 'NSAIDs', 'Alcohol'],
    contraindications: ['Bleeding disorders', 'Peptic ulcer'],
    sideEffects: ['GI bleeding', 'Tinnitus'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 8,
    name: 'Nexium',
    nameArabic: 'نيكسيوم',
    activeIngredient: 'Esomeprazole',
    category: 'PPI',
    manufacturer: 'AstraZeneca',
    form: 'Capsule',
    price: 95.50,
    dosing: '20-40 mg once daily before meals for 4-8 weeks.',
    descriptionEnglish: 'Proton pump inhibitor for acid reflux',
    descriptionArabic: 'مثبط مضخة البروتون للارتجاع الحمضي',
    interactions: ['Ketoconazole', 'Warfarin'],
    contraindications: ['Severe liver disease'],
    sideEffects: ['Headache', 'Diarrhea', 'Abdominal pain'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class MockDrugService {
  // Search drugs by name (English or Arabic)
  async searchDrugByName(searchName: string): Promise<EgyptianDrug | undefined> {
    const normalizedSearch = searchName.toLowerCase().trim();
    
    return mockDrugs.find(drug => 
      drug.name.toLowerCase().includes(normalizedSearch) ||
      drug.nameArabic.toLowerCase().includes(normalizedSearch)
    );
  }

  // Search drugs with filters
  async searchDrugs(filters: {
    name?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<EgyptianDrug[]> {
    let filteredDrugs = [...mockDrugs];
    
    if (filters.name) {
      const normalizedSearch = filters.name.toLowerCase().trim();
      filteredDrugs = filteredDrugs.filter(drug =>
        drug.name.toLowerCase().includes(normalizedSearch) ||
        drug.nameArabic.toLowerCase().includes(normalizedSearch)
      );
    }
    
    if (filters.category && filters.category !== 'All') {
      filteredDrugs = filteredDrugs.filter(drug =>
        drug.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }
    
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    
    return filteredDrugs.slice(offset, offset + limit);
  }

  // Get all drugs with pagination
  async getAllDrugs(limit: number = 50, offset: number = 0): Promise<EgyptianDrug[]> {
    return mockDrugs.slice(offset, offset + limit);
  }

  // Get total count
  async getTotalCount(): Promise<number> {
    return mockDrugs.length;
  }

  // Get drug by ID
  async getDrugById(id: number): Promise<EgyptianDrug | undefined> {
    return mockDrugs.find(drug => drug.id === id);
  }

  // Find alternatives
  async findAlternatives(
    excludeName: string,
    activeIngredient?: string,
    category?: string,
    limit: number = 5
  ): Promise<EgyptianDrug[]> {
    return mockDrugs
      .filter(drug => 
        drug.name.toLowerCase() !== excludeName.toLowerCase() &&
        (
          (activeIngredient && drug.activeIngredient.toLowerCase().includes(activeIngredient.toLowerCase())) ||
          (category && drug.category.toLowerCase() === category.toLowerCase())
        )
      )
      .slice(0, limit);
  }
}

export const mockDrugService = new MockDrugService();
