const mongoose = require('mongoose');
const dotenv = require('dotenv');
const LabTest = require('../models/LabTest');

// Load environment variables
dotenv.config({ path: './.env' }); // Adjust path if needed depending on where you run it

const labTestsData = [
  // --- 1. BLOOD TESTS ---
  // Hematology
  { name: 'Complete Blood Count (CBC)', category: 'Blood Tests', subcategory: 'Hematology', price: 15.00 },
  { name: 'Hemoglobin (Hb)', category: 'Blood Tests', subcategory: 'Hematology', price: 5.00 },
  { name: 'Hematocrit (HCT/PCV)', category: 'Blood Tests', subcategory: 'Hematology', price: 5.00 },
  { name: 'RBC count', category: 'Blood Tests', subcategory: 'Hematology', price: 7.00 },
  { name: 'WBC count', category: 'Blood Tests', subcategory: 'Hematology', price: 7.00 },
  { name: 'Platelet count', category: 'Blood Tests', subcategory: 'Hematology', price: 8.00 },
  { name: 'ESR', category: 'Blood Tests', subcategory: 'Hematology', price: 6.00 },
  { name: 'Blood film / peripheral smear', category: 'Blood Tests', subcategory: 'Hematology', price: 12.00 },
  { name: 'Differential WBC count', category: 'Blood Tests', subcategory: 'Hematology', price: 8.00 },
  { name: 'Reticulocyte count', category: 'Blood Tests', subcategory: 'Hematology', price: 10.00 },

  // Blood Chemistry
  { name: 'Blood glucose — fasting', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 5.00 },
  { name: 'Blood glucose — random', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 5.00 },
  { name: 'Blood glucose — post-prandial', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 5.00 },
  { name: 'HbA1c', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 25.00 },
  { name: 'Blood urea', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 8.00 },
  { name: 'Creatinine', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 8.00 },
  { name: 'Uric acid', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 8.00 },
  { name: 'Total cholesterol', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 10.00 },
  { name: 'HDL cholesterol', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 10.00 },
  { name: 'LDL cholesterol', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 10.00 },
  { name: 'Triglycerides', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 10.00 },
  { name: 'Total protein', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 9.00 },
  { name: 'Albumin', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 9.00 },
  { name: 'Total bilirubin', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 9.00 },
  { name: 'Direct bilirubin', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 9.00 },
  { name: 'AST/SGOT', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 10.00 },
  { name: 'ALT/SGPT', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 10.00 },
  { name: 'ALP', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 10.00 },
  { name: 'Calcium', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 12.00 },
  { name: 'Sodium', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 12.00 },
  { name: 'Potassium', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 12.00 },
  { name: 'Chloride', category: 'Blood Tests', subcategory: 'Blood Chemistry', price: 12.00 },

  // Serology / Immunology
  { name: 'HIV 1/2 screening', category: 'Blood Tests', subcategory: 'Serology / Immunology', price: 10.00 },
  { name: 'Hepatitis B surface antigen (HBsAg)', category: 'Blood Tests', subcategory: 'Serology / Immunology', price: 12.00 },
  { name: 'Hepatitis C antibody', category: 'Blood Tests', subcategory: 'Serology / Immunology', price: 15.00 },
  { name: 'Syphilis screening (RPR/VDRL)', category: 'Blood Tests', subcategory: 'Serology / Immunology', price: 10.00 },
  { name: 'CRP', category: 'Blood Tests', subcategory: 'Serology / Immunology', price: 14.00 },
  { name: 'Rheumatoid factor (RF)', category: 'Blood Tests', subcategory: 'Serology / Immunology', price: 12.00 },
  { name: 'ASO titre', category: 'Blood Tests', subcategory: 'Serology / Immunology', price: 12.00 },
  { name: 'Widal test', category: 'Blood Tests', subcategory: 'Serology / Immunology', price: 10.00 },
  { name: 'Pregnancy test — serum β-hCG', category: 'Blood Tests', subcategory: 'Serology / Immunology', price: 15.00 },

  // Blood Grouping
  { name: 'ABO blood group', category: 'Blood Tests', subcategory: 'Blood Grouping', price: 8.00 },
  { name: 'Rh factor', category: 'Blood Tests', subcategory: 'Blood Grouping', price: 8.00 },
  { name: 'ABO + Rh typing', category: 'Blood Tests', subcategory: 'Blood Grouping', price: 12.00 },
  { name: 'Cross-matching', category: 'Blood Tests', subcategory: 'Blood Grouping', price: 20.00 },

  // --- 2. URINE TESTS ---
  // Routine Urinalysis
  { name: 'Physical appearance (Urine)', category: 'Urine Tests', subcategory: 'Routine Urinalysis', price: 5.00 },
  { name: 'Color (Urine)', category: 'Urine Tests', subcategory: 'Routine Urinalysis', price: 5.00 },
  { name: 'Transparency (Urine)', category: 'Urine Tests', subcategory: 'Routine Urinalysis', price: 5.00 },
  { name: 'Specific gravity (Urine)', category: 'Urine Tests', subcategory: 'Routine Urinalysis', price: 5.00 },
  { name: 'pH (Urine)', category: 'Urine Tests', subcategory: 'Routine Urinalysis', price: 5.00 },
  { name: 'Protein (Urine Dipstick)', category: 'Urine Tests', subcategory: 'Routine Urinalysis', price: 5.00 },
  { name: 'Glucose (Urine Dipstick)', category: 'Urine Tests', subcategory: 'Routine Urinalysis', price: 5.00 },
  { name: 'Ketones (Urine)', category: 'Urine Tests', subcategory: 'Routine Urinalysis', price: 5.00 },
  { name: 'Blood (Urine Dipstick)', category: 'Urine Tests', subcategory: 'Routine Urinalysis', price: 5.00 },
  { name: 'Bilirubin (Urine)', category: 'Urine Tests', subcategory: 'Routine Urinalysis', price: 5.00 },
  { name: 'Urobilinogen (Urine)', category: 'Urine Tests', subcategory: 'Routine Urinalysis', price: 5.00 },
  { name: 'Nitrite (Urine)', category: 'Urine Tests', subcategory: 'Routine Urinalysis', price: 5.00 },
  { name: 'Leukocyte esterase (Urine)', category: 'Urine Tests', subcategory: 'Routine Urinalysis', price: 5.00 },

  // Urine Microscopy
  { name: 'Urine Microscopy - RBC', category: 'Urine Tests', subcategory: 'Urine Microscopy', price: 8.00 },
  { name: 'Urine Microscopy - WBC', category: 'Urine Tests', subcategory: 'Urine Microscopy', price: 8.00 },
  { name: 'Urine Microscopy - Epithelial cells', category: 'Urine Tests', subcategory: 'Urine Microscopy', price: 8.00 },
  { name: 'Urine Microscopy - Bacteria', category: 'Urine Tests', subcategory: 'Urine Microscopy', price: 8.00 },
  { name: 'Urine Microscopy - Yeast', category: 'Urine Tests', subcategory: 'Urine Microscopy', price: 8.00 },
  { name: 'Urine Microscopy - Crystals', category: 'Urine Tests', subcategory: 'Urine Microscopy', price: 8.00 },
  { name: 'Urine Microscopy - Casts', category: 'Urine Tests', subcategory: 'Urine Microscopy', price: 8.00 },
  { name: 'Urine Microscopy - Mucus', category: 'Urine Tests', subcategory: 'Urine Microscopy', price: 8.00 },

  // Other Urine Tests
  { name: 'Urine pregnancy test', category: 'Urine Tests', subcategory: 'Other Urine Tests', price: 8.00 },
  { name: 'Urine culture', category: 'Urine Tests', subcategory: 'Other Urine Tests', price: 20.00 },
  { name: '24-hour urine protein', category: 'Urine Tests', subcategory: 'Other Urine Tests', price: 18.00 },
  { name: 'Urine albumin', category: 'Urine Tests', subcategory: 'Other Urine Tests', price: 12.00 },
  { name: 'Microalbumin/albumin-creatinine ratio', category: 'Urine Tests', subcategory: 'Other Urine Tests', price: 15.00 },

  // --- 3. STOOL TESTS ---
  // Routine Stool Examination
  { name: 'Stool Color & Consistency', category: 'Stool Tests', subcategory: 'Routine Stool Examination', price: 6.00 },
  { name: 'Stool Occult blood', category: 'Stool Tests', subcategory: 'Routine Stool Examination', price: 10.00 },
  { name: 'Stool Mucus & Cells (RBC/WBC)', category: 'Stool Tests', subcategory: 'Routine Stool Examination', price: 8.00 },
  { name: 'Stool Parasites / Ova / Cysts', category: 'Stool Tests', subcategory: 'Routine Stool Examination', price: 10.00 },

  // Specific Stool Tests
  { name: 'Stool culture', category: 'Stool Tests', subcategory: 'Specific Stool Tests', price: 22.00 },
  { name: 'H. pylori stool antigen', category: 'Stool Tests', subcategory: 'Specific Stool Tests', price: 25.00 },
  { name: 'Giardia examination', category: 'Stool Tests', subcategory: 'Specific Stool Tests', price: 12.00 },
  { name: 'Amoeba examination', category: 'Stool Tests', subcategory: 'Specific Stool Tests', price: 12.00 },
  { name: 'Cryptosporidium test', category: 'Stool Tests', subcategory: 'Specific Stool Tests', price: 15.00 },
  { name: 'Rotavirus antigen', category: 'Stool Tests', subcategory: 'Specific Stool Tests', price: 18.00 },

  // --- 4. MICROBIOLOGY ---
  // Bacterial Tests
  { name: 'Wound swab culture', category: 'Microbiology', subcategory: 'Bacterial Tests', price: 22.00 },
  { name: 'Pus culture', category: 'Microbiology', subcategory: 'Bacterial Tests', price: 22.00 },
  { name: 'Sputum culture', category: 'Microbiology', subcategory: 'Bacterial Tests', price: 22.00 },
  { name: 'Throat swab culture', category: 'Microbiology', subcategory: 'Bacterial Tests', price: 22.00 },

  // Microscopy
  { name: 'Gram stain', category: 'Microbiology', subcategory: 'Microscopy', price: 10.00 },
  { name: 'AFB stain / TB microscopy', category: 'Microbiology', subcategory: 'Microscopy', price: 12.00 },
  { name: 'KOH preparation for fungal infection', category: 'Microbiology', subcategory: 'Microscopy', price: 12.00 },

  // Antibiotic Sensitivity
  { name: 'Antibiotic susceptibility testing (AST)', category: 'Microbiology', subcategory: 'Antibiotic Sensitivity', price: 18.00 },

  // --- 5. RAPID / POINT-OF-CARE TESTS ---
  { name: 'Malaria rapid diagnostic test', category: 'Rapid / Point-of-Care Tests', subcategory: 'Rapid Tests', price: 8.00 },
  { name: 'HIV rapid test', category: 'Rapid / Point-of-Care Tests', subcategory: 'Rapid Tests', price: 8.00 },
  { name: 'Hepatitis B rapid test', category: 'Rapid / Point-of-Care Tests', subcategory: 'Rapid Tests', price: 10.00 },
  { name: 'Hepatitis C rapid test', category: 'Rapid / Point-of-Care Tests', subcategory: 'Rapid Tests', price: 12.00 },
  { name: 'Syphilis rapid test', category: 'Rapid / Point-of-Care Tests', subcategory: 'Rapid Tests', price: 8.00 },
  { name: 'Pregnancy rapid test', category: 'Rapid / Point-of-Care Tests', subcategory: 'Rapid Tests', price: 5.00 },
  { name: 'COVID-19 antigen test', category: 'Rapid / Point-of-Care Tests', subcategory: 'Rapid Tests', price: 15.00 },
  { name: 'H. pylori rapid test', category: 'Rapid / Point-of-Care Tests', subcategory: 'Rapid Tests', price: 15.00 },
  { name: 'Dengue rapid test', category: 'Rapid / Point-of-Care Tests', subcategory: 'Rapid Tests', price: 18.00 },

  // --- 6. SPUTUM / RESPIRATORY TESTS ---
  { name: 'Sputum routine examination', category: 'Sputum / Respiratory Tests', subcategory: 'Respiratory Examination', price: 10.00 },
  { name: 'Sputum AFB microscopy', category: 'Sputum / Respiratory Tests', subcategory: 'Respiratory Examination', price: 12.00 },
  { name: 'TB molecular test (GeneXpert)', category: 'Sputum / Respiratory Tests', subcategory: 'Respiratory Examination', price: 35.00 },
  { name: 'Sputum Gram stain', category: 'Sputum / Respiratory Tests', subcategory: 'Respiratory Examination', price: 10.00 },
  { name: 'Fungal examination (Sputum)', category: 'Sputum / Respiratory Tests', subcategory: 'Respiratory Examination', price: 14.00 },

  // --- 7. OTHER SPECIMEN TESTS ---
  { name: 'Wound/Pus Gram stain & Microscopy', category: 'Other Specimen Tests', subcategory: 'Wound/Pus', price: 12.00 },
  { name: 'Throat swab examination', category: 'Other Specimen Tests', subcategory: 'Swabs', price: 12.00 },
  { name: 'Nasal swab examination', category: 'Other Specimen Tests', subcategory: 'Swabs', price: 12.00 },
  { name: 'Vaginal/cervical swab examination', category: 'Other Specimen Tests', subcategory: 'Swabs', price: 15.00 },
  { name: 'Skin scraping KOH test', category: 'Other Specimen Tests', subcategory: 'Skin', price: 12.00 },

  // --- 8. SPECIAL TESTS — OPTIONAL ---
  { name: 'Thyroid Panel (TSH, T3, T4)', category: 'Special Tests — Optional', subcategory: 'Endocrine & Hormones', price: 40.00 },
  { name: 'Ferritin', category: 'Special Tests — Optional', subcategory: 'Biomarkers', price: 25.00 },
  { name: 'Vitamin B12', category: 'Special Tests — Optional', subcategory: 'Vitamins', price: 30.00 },
  { name: 'Folate', category: 'Special Tests — Optional', subcategory: 'Vitamins', price: 30.00 },
  { name: 'Vitamin D', category: 'Special Tests — Optional', subcategory: 'Vitamins', price: 35.00 },
  { name: 'PSA (Prostate Specific Antigen)', category: 'Special Tests — Optional', subcategory: 'Tumor Markers', price: 30.00 },
  { name: 'LH', category: 'Special Tests — Optional', subcategory: 'Endocrine & Hormones', price: 22.00 },
  { name: 'FSH', category: 'Special Tests — Optional', subcategory: 'Endocrine & Hormones', price: 22.00 },
  { name: 'Prolactin', category: 'Special Tests — Optional', subcategory: 'Endocrine & Hormones', price: 25.00 },
  { name: 'Testosterone', category: 'Special Tests — Optional', subcategory: 'Endocrine & Hormones', price: 28.00 },
  { name: 'Estradiol', category: 'Special Tests — Optional', subcategory: 'Endocrine & Hormones', price: 28.00 },
  { name: 'Progesterone', category: 'Special Tests — Optional', subcategory: 'Endocrine & Hormones', price: 28.00 }
];

const seedDB = async () => {
  try {
    // Connect to MongoDB using the URI from .env
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Clear existing lab tests to avoid duplicate key errors on 'name'
    await LabTest.deleteMany();
    console.log('Existing lab tests cleared.');

    // Insert new structured dataset
    await LabTest.insertMany(labTestsData);
    console.log(`Successfully seeded ${labTestsData.length} lab tests across 8 categories!`);

    process.exit();
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedDB();