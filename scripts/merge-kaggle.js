const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CSV_FILE = path.join(DATA_DIR, 'kaggle_raw', 'drugs_side_effects_drugs_com.csv');
const DRUGS_FILE = path.join(DATA_DIR, 'drugs.json');
const INTERACTIONS_FILE = path.join(DATA_DIR, 'interactions.json');

// ── Simple CSV parser — no embedded newlines in this dataset ──
function parseCSV(text) {
  const lines = text.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim());
  if (lines.length === 0) return [];

  const header = parseCSVLine(lines[0]);
  console.log(`   Headers: ${header.join(', ')}`);
  
  const rows = [];
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    if (vals.length !== header.length) {
      skipped++;
      continue;
    }
    const obj = {};
    header.forEach((h, idx) => obj[h] = vals[idx]);
    rows.push(obj);
  }
  if (skipped > 0) console.log(`   ⚠️  Skipped ${skipped} malformed rows`);
  return rows;
}

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function normalize(str) {
  if (!str) return '';
  return str.toString().trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '');
}

// ── Parse side effects text from Kaggle into structured list ──
function parseSideEffects(text) {
  if (!text || text === 'nan' || text === '') return [];
  
  // The side effects field contains sentences. Extract key symptoms.
  // Common patterns: "symptom1 ; symptom2" or "symptom1, symptom2"
  const effects = [];
  
  // Split by semicolons first (primary delimiter)
  const parts = text.split(';').map(s => s.trim()).filter(Boolean);
  
  for (const part of parts) {
    // Clean up: remove "Common X side effects may include:" type prefixes
    let cleaned = part
      .replace(/^Common\s+\w+\s+side effects (may )?include:\s*/i, '')
      .replace(/^Call your doctor.*$/i, '')
      .replace(/^Get emergency.*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!cleaned || cleaned.length > 80) continue;
    
    // Split by commas for sub-items
    const subParts = cleaned.split(',').map(s => s.trim()).filter(s => s && s.length > 2 && s.length < 60);
    
    for (const sub of subParts) {
      // Remove leading articles/connectors
      const final = sub
        .replace(/^(or|and|o)\s+/i, '')
        .replace(/^\d+\.\s*/, '')
        .trim();
      
      if (final && final.length > 2 && final.length < 50 && !final.includes('http') && !final.includes('www.')) {
        effects.push(final.charAt(0).toUpperCase() + final.slice(1));
      }
    }
  }
  
  return [...new Set(effects)].slice(0, 30);
}

// ── Parse related drugs field ──
function parseRelatedDrugs(text) {
  if (!text || text === 'nan') return [];
  // Format: "drugname: url | drugname: url | ..."
  return text.split('|')
    .map(entry => {
      const name = entry.split(':')[0]?.trim();
      return name && name.length > 1 ? normalize(name) : null;
    })
    .filter(Boolean);
}

// ── Main merge logic ──
function run() {
  console.log('🔬 Drug Analyzer — Kaggle Dataset Merge');
  console.log('========================================\n');

  // Step 1: Load existing data
  console.log('📂 Step 1: Loading existing database...');
  const existingDrugs = JSON.parse(fs.readFileSync(DRUGS_FILE, 'utf8'));
  const existingInteractions = JSON.parse(fs.readFileSync(INTERACTIONS_FILE, 'utf8'));
  
  const drugMap = new Map();
  for (const drug of existingDrugs) {
    drugMap.set(drug.id, drug);
  }
  console.log(`   ✅ ${existingDrugs.length} existing drugs`);
  console.log(`   ✅ ${existingInteractions.length} existing interactions\n`);

  // Step 2: Parse Kaggle CSV
  console.log('📄 Step 2: Parsing Kaggle CSV...');
  const csvText = fs.readFileSync(CSV_FILE, 'utf8');
  const rows = parseCSV(csvText);
  console.log(`   ✅ ${rows.length} rows parsed\n`);

  // Step 3: Process and merge
  console.log('🔀 Step 3: Merging Kaggle data...');
  let newDrugs = 0;
  let enrichedDrugs = 0;
  let newInteractionPairs = 0;

  // Track interactions from Kaggle's "related_drugs" field
  const interactionMap = new Map();
  for (const inter of existingInteractions) {
    const key = `${inter.drug1}|||${inter.drug2}`;
    interactionMap.set(key, inter);
  }

  for (const row of rows) {
    const drugName = row.drug_name || '';
    const genericName = row.generic_name || '';
    const key = normalize(genericName || drugName);
    if (!key) continue;

    // Parse fields
    const brandNames = (row.brand_names || '')
      .split(',')
      .map(s => s.trim())
      .filter(s => s && s !== 'nan');
    
    const drugClasses = (row.drug_classes || '')
      .split(',')
      .map(s => s.trim())
      .filter(s => s && s !== 'nan');
    
    const sideEffects = parseSideEffects(row.side_effects || '');
    const medCondition = row.medical_condition || '';
    const rxOtc = row.rx_otc || '';
    const pregnancyCategory = row.pregnancy_category || '';
    const csa = row.csa || '';
    const alcohol = row.alcohol || '';
    const rating = parseFloat(row.rating) || 0;
    const reviewCount = parseInt(row.no_of_reviews) || 0;

    if (drugMap.has(key)) {
      // ── Enrich existing drug ──
      const existing = drugMap.get(key);
      
      // Add brand names
      const existingBrands = new Set(existing.brandNames || []);
      brandNames.forEach(b => existingBrands.add(b));
      existing.brandNames = [...existingBrands];
      
      // Add generic names
      const existingGenerics = new Set(existing.genericNames || []);
      if (genericName && genericName !== 'nan') existingGenerics.add(genericName.toUpperCase());
      existing.genericNames = [...existingGenerics];
      
      // Add drug class
      const existingClasses = new Set(existing.drugClass || []);
      drugClasses.forEach(c => existingClasses.add(c));
      existing.drugClass = [...existingClasses];
      
      // Add indications from medical condition
      const existingIndications = new Set(existing.indications || []);
      if (medCondition && medCondition !== 'nan') existingIndications.add(medCondition);
      existing.indications = [...existingIndications].slice(0, 15);
      
      // Add side effects
      const seMap = new Map((existing.sideEffects || []).map(se => [se.name, se.count]));
      for (const se of sideEffects) {
        if (!seMap.has(se)) seMap.set(se, 1);
      }
      existing.sideEffects = [...seMap.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50);
      
      // Add new metadata
      if (rxOtc && rxOtc !== 'nan') existing.rxOtc = rxOtc;
      if (pregnancyCategory && pregnancyCategory !== 'nan') existing.pregnancyCategory = pregnancyCategory;
      if (csa && csa !== 'nan') existing.csaSchedule = csa;
      if (alcohol === 'X') existing.alcoholInteraction = true;
      if (rating > 0) existing.userRating = rating;
      if (reviewCount > 0) existing.reviewCount = reviewCount;
      
      enrichedDrugs++;
    } else {
      // ── Create new drug ──
      const sideEffectsArray = sideEffects.map(name => ({ name, count: 1 }));
      
      drugMap.set(key, {
        id: key,
        drugName: genericName || drugName,
        brandNames: brandNames,
        genericNames: genericName && genericName !== 'nan' ? [genericName.toUpperCase()] : [],
        drugClass: drugClasses,
        routes: [],
        indications: medCondition && medCondition !== 'nan' ? [medCondition] : [],
        sideEffects: sideEffectsArray,
        dosageForms: [],
        manufacturers: [],
        eventCount: reviewCount || 1,
        seriousEventCount: 0,
        deathCount: 0,
        riskScore: 0,
        rxOtc: rxOtc !== 'nan' ? rxOtc : undefined,
        pregnancyCategory: pregnancyCategory !== 'nan' ? pregnancyCategory : undefined,
        csaSchedule: csa !== 'nan' ? csa : undefined,
        alcoholInteraction: alcohol === 'X',
        userRating: rating || undefined,
        reviewCount: reviewCount || undefined,
        source: 'kaggle',
      });
      newDrugs++;
    }

    // ── Build interaction pairs from related_drugs ──
    const relatedDrugs = parseRelatedDrugs(row.related_drugs || '');
    for (const relatedKey of relatedDrugs) {
      const [d1, d2] = [key, relatedKey].sort();
      const pairKey = `${d1}|||${d2}`;
      
      if (!interactionMap.has(pairKey) && d1 !== d2) {
        const d1Data = drugMap.get(d1);
        const d2Data = drugMap.get(d2);
        
        interactionMap.set(pairKey, {
          drug1: d1,
          drug1Name: d1Data?.drugName || d1,
          drug2: d2,
          drug2Name: d2Data?.drugName || d2,
          coOccurrenceCount: 1,
          severity: 'low',
          avgSeverityScore: 1,
          seriousCount: 0,
          sharedReactions: [],
          description: `${d1Data?.drugName || d1} and ${d2Data?.drugName || d2} are related drugs used for similar conditions.`,
          source: 'kaggle-related',
        });
        newInteractionPairs++;
      }
    }
  }

  console.log(`   ✅ ${newDrugs} new drugs added`);
  console.log(`   ✅ ${enrichedDrugs} existing drugs enriched with Kaggle metadata`);
  console.log(`   ✅ ${newInteractionPairs} new interaction pairs from related drugs\n`);

  // Step 4: Write updated files
  console.log('💾 Step 4: Writing updated data files...');
  
  const finalDrugs = [...drugMap.values()];
  finalDrugs.sort((a, b) => (b.eventCount || 0) - (a.eventCount || 0));
  fs.writeFileSync(DRUGS_FILE, JSON.stringify(finalDrugs, null, 0));
  console.log(`   drugs.json: ${(fs.statSync(DRUGS_FILE).size / 1024).toFixed(0)} KB (${finalDrugs.length} drugs)`);

  const finalInteractions = [...interactionMap.values()];
  finalInteractions.sort((a, b) => (b.coOccurrenceCount || 0) - (a.coOccurrenceCount || 0));
  fs.writeFileSync(INTERACTIONS_FILE, JSON.stringify(finalInteractions, null, 0));
  console.log(`   interactions.json: ${(fs.statSync(INTERACTIONS_FILE).size / 1024).toFixed(0)} KB (${finalInteractions.length} interactions)`);

  // Print some stats about enrichment
  let withRating = 0, withPregnancy = 0, withAlcohol = 0, withRxOtc = 0;
  for (const drug of finalDrugs) {
    if (drug.userRating) withRating++;
    if (drug.pregnancyCategory) withPregnancy++;
    if (drug.alcoholInteraction) withAlcohol++;
    if (drug.rxOtc) withRxOtc++;
  }

  console.log('\n🎉 Kaggle merge complete!');
  console.log(`   📊 ${finalDrugs.length} total drugs | ${finalInteractions.length} total interactions`);
  console.log(`   📋 Enrichment coverage:`);
  console.log(`      • ${withRating} drugs with user ratings`);
  console.log(`      • ${withPregnancy} drugs with pregnancy categories`);
  console.log(`      • ${withAlcohol} drugs with alcohol interaction flags`);
  console.log(`      • ${withRxOtc} drugs with Rx/OTC classification`);
}

run();
