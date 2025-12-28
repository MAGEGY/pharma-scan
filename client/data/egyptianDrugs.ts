export interface Drug {
  id: string;
  name: string;
  nameArabic: string;
  activeIngredient: string;
  category: string;
  manufacturer: string;
  form: string;
  price: string;
  dosing: string;
  interactions?: string[];
  contraindications?: string[];
  sideEffects?: string[];
}

export const EGYPTIAN_DRUGS: Drug[] = [
  {
    id: "1",
    name: "Augmentin",
    nameArabic: "اوجمنتين",
    activeIngredient: "Amoxicillin/Clavulanic Acid",
    category: "Antibiotic",
    manufacturer: "GlaxoSmithKline",
    form: "Tablets 1g",
    price: "85",
    dosing: "Adults: 1g every 12 hours for 7-10 days. Take with food to reduce GI side effects.",
    interactions: [
      "Warfarin - increased bleeding risk",
      "Methotrexate - increased toxicity",
      "Oral contraceptives - reduced effectiveness"
    ],
    contraindications: [
      "Penicillin allergy",
      "History of hepatic dysfunction with amoxicillin/clavulanic acid",
      "Infectious mononucleosis"
    ],
    sideEffects: ["Diarrhea", "Nausea", "Skin rash", "Vaginitis"]
  },
  {
    id: "2",
    name: "Panadol Extra",
    nameArabic: "بانادول اكسترا",
    activeIngredient: "Paracetamol/Caffeine",
    category: "Analgesic",
    manufacturer: "GlaxoSmithKline",
    form: "Tablets 500mg/65mg",
    price: "35",
    dosing: "Adults: 1-2 tablets every 4-6 hours. Maximum 8 tablets in 24 hours.",
    interactions: [
      "Warfarin - increased INR with chronic use",
      "Carbamazepine - increased hepatotoxicity risk"
    ],
    contraindications: [
      "Severe hepatic impairment",
      "Caffeine sensitivity"
    ],
    sideEffects: ["Rare at recommended doses", "Insomnia (due to caffeine)", "Allergic reactions"]
  },
  {
    id: "3",
    name: "Concor",
    nameArabic: "كونكور",
    activeIngredient: "Bisoprolol",
    category: "Antihypertensive",
    manufacturer: "Merck",
    form: "Tablets 5mg",
    price: "62",
    dosing: "Start with 5mg once daily. May increase to 10mg if needed. Take in the morning.",
    interactions: [
      "Verapamil/Diltiazem - severe bradycardia",
      "Insulin - masks hypoglycemia symptoms",
      "NSAIDs - reduced antihypertensive effect"
    ],
    contraindications: [
      "Acute heart failure",
      "Cardiogenic shock",
      "Second or third degree AV block",
      "Sick sinus syndrome",
      "Severe asthma"
    ],
    sideEffects: ["Fatigue", "Dizziness", "Bradycardia", "Cold extremities"]
  },
  {
    id: "4",
    name: "Glucophage",
    nameArabic: "جلوكوفاج",
    activeIngredient: "Metformin",
    category: "Antidiabetic",
    manufacturer: "Merck",
    form: "Tablets 500mg",
    price: "28",
    dosing: "Start 500mg twice daily with meals. Maximum 2550mg/day in divided doses.",
    interactions: [
      "Iodinated contrast - risk of lactic acidosis",
      "Alcohol - increased lactic acidosis risk",
      "Cimetidine - increased metformin levels"
    ],
    contraindications: [
      "eGFR < 30 mL/min",
      "Metabolic acidosis",
      "Diabetic ketoacidosis"
    ],
    sideEffects: ["GI upset", "Metallic taste", "Vitamin B12 deficiency", "Lactic acidosis (rare)"]
  },
  {
    id: "5",
    name: "Zyrtec",
    nameArabic: "زيرتك",
    activeIngredient: "Cetirizine",
    category: "Antihistamine",
    manufacturer: "UCB Pharma",
    form: "Tablets 10mg",
    price: "45",
    dosing: "Adults: 10mg once daily. Can be taken with or without food.",
    interactions: [
      "CNS depressants - enhanced sedation",
      "Theophylline - reduced cetirizine clearance"
    ],
    contraindications: [
      "Severe renal impairment without dose adjustment",
      "End-stage renal disease"
    ],
    sideEffects: ["Drowsiness", "Dry mouth", "Fatigue", "Headache"]
  },
  {
    id: "6",
    name: "Cipro",
    nameArabic: "سيبرو",
    activeIngredient: "Ciprofloxacin",
    category: "Antibiotic",
    manufacturer: "Bayer",
    form: "Tablets 500mg",
    price: "95",
    dosing: "250-750mg every 12 hours depending on infection. Duration 7-14 days.",
    interactions: [
      "Tizanidine - contraindicated",
      "Theophylline - increased toxicity",
      "Warfarin - increased bleeding risk",
      "Antacids - reduced absorption"
    ],
    contraindications: [
      "Myasthenia gravis",
      "History of tendon disorders with fluoroquinolones",
      "QT prolongation"
    ],
    sideEffects: ["Nausea", "Diarrhea", "Tendon rupture risk", "Photosensitivity"]
  },
  {
    id: "7",
    name: "Amaryl",
    nameArabic: "اماريل",
    activeIngredient: "Glimepiride",
    category: "Antidiabetic",
    manufacturer: "Sanofi",
    form: "Tablets 2mg",
    price: "52",
    dosing: "Start 1-2mg once daily with breakfast. Maximum 8mg/day.",
    interactions: [
      "Beta-blockers - masked hypoglycemia",
      "Fluconazole - increased hypoglycemia",
      "Alcohol - enhanced hypoglycemia"
    ],
    contraindications: [
      "Type 1 diabetes",
      "Diabetic ketoacidosis",
      "Severe hepatic impairment",
      "G6PD deficiency"
    ],
    sideEffects: ["Hypoglycemia", "Weight gain", "GI disturbances", "Allergic skin reactions"]
  },
  {
    id: "8",
    name: "Nexium",
    nameArabic: "نيكسيوم",
    activeIngredient: "Esomeprazole",
    category: "Antiulcer",
    manufacturer: "AstraZeneca",
    form: "Tablets 40mg",
    price: "115",
    dosing: "20-40mg once daily, 30-60 minutes before a meal. Duration varies by condition.",
    interactions: [
      "Clopidogrel - reduced antiplatelet effect",
      "Methotrexate - increased toxicity",
      "Digoxin - increased absorption"
    ],
    contraindications: [
      "Rilpivirine-containing products",
      "Hypersensitivity to PPIs"
    ],
    sideEffects: ["Headache", "Diarrhea", "Nausea", "Vitamin B12 deficiency", "Fracture risk"]
  },
  {
    id: "9",
    name: "Lipitor",
    nameArabic: "ليبيتور",
    activeIngredient: "Atorvastatin",
    category: "Antihyperlipidemic",
    manufacturer: "Pfizer",
    form: "Tablets 20mg",
    price: "125",
    dosing: "10-80mg once daily at any time. Avoid grapefruit juice.",
    interactions: [
      "Cyclosporine - use contraindicated",
      "Gemfibrozil - increased myopathy risk",
      "Warfarin - monitor INR"
    ],
    contraindications: [
      "Active liver disease",
      "Unexplained elevated transaminases",
      "Pregnancy and lactation"
    ],
    sideEffects: ["Myalgia", "Elevated liver enzymes", "GI upset", "Rhabdomyolysis (rare)"]
  },
  {
    id: "10",
    name: "Ventolin",
    nameArabic: "فينتولين",
    activeIngredient: "Salbutamol",
    category: "Bronchodilator",
    manufacturer: "GlaxoSmithKline",
    form: "Inhaler 100mcg",
    price: "55",
    dosing: "1-2 puffs every 4-6 hours as needed. Maximum 8 puffs in 24 hours.",
    interactions: [
      "Beta-blockers - antagonism",
      "Diuretics - increased hypokalemia risk",
      "MAOIs - increased cardiovascular effects"
    ],
    contraindications: [
      "Hypersensitivity to salbutamol"
    ],
    sideEffects: ["Tremor", "Tachycardia", "Headache", "Muscle cramps"]
  },
  {
    id: "11",
    name: "Aspirin Protect",
    nameArabic: "اسبرين بروتكت",
    activeIngredient: "Acetylsalicylic Acid",
    category: "Antiplatelet",
    manufacturer: "Bayer",
    form: "Tablets 100mg",
    price: "38",
    dosing: "75-100mg once daily for cardiovascular protection. Take with food.",
    interactions: [
      "Warfarin - increased bleeding",
      "NSAIDs - increased GI bleeding",
      "Methotrexate - increased toxicity"
    ],
    contraindications: [
      "Active peptic ulcer",
      "Bleeding disorders",
      "Children with viral infections (Reye's syndrome)"
    ],
    sideEffects: ["GI bleeding", "Dyspepsia", "Bruising", "Tinnitus (high doses)"]
  },
  {
    id: "12",
    name: "Januvia",
    nameArabic: "جانوفيا",
    activeIngredient: "Sitagliptin",
    category: "Antidiabetic",
    manufacturer: "MSD",
    form: "Tablets 100mg",
    price: "245",
    dosing: "100mg once daily. Reduce to 50mg if eGFR 30-50, 25mg if eGFR <30.",
    interactions: [
      "Digoxin - slightly increased levels",
      "Sulfonylureas/Insulin - increased hypoglycemia risk"
    ],
    contraindications: [
      "Type 1 diabetes",
      "Diabetic ketoacidosis",
      "History of pancreatitis"
    ],
    sideEffects: ["Upper respiratory infection", "Headache", "Pancreatitis (rare)", "Joint pain"]
  }
];

export function findDrugByName(name: string): Drug | undefined {
  const normalized = name.toLowerCase().trim();
  return EGYPTIAN_DRUGS.find(
    (drug) =>
      drug.name.toLowerCase().includes(normalized) ||
      drug.nameArabic.includes(name) ||
      drug.activeIngredient.toLowerCase().includes(normalized)
  );
}

export function searchDrugs(query: string): Drug[] {
  const normalized = query.toLowerCase().trim();
  return EGYPTIAN_DRUGS.filter(
    (drug) =>
      drug.name.toLowerCase().includes(normalized) ||
      drug.nameArabic.includes(query) ||
      drug.activeIngredient.toLowerCase().includes(normalized) ||
      drug.category.toLowerCase().includes(normalized)
  );
}
