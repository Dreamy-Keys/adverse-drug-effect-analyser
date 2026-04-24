const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DRUGS_FILE = path.join(DATA_DIR, 'drugs.json');
const INTERACTIONS_FILE = path.join(DATA_DIR, 'interactions.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

function normalize(str) {
  if (!str) return '';
  return str.toString().trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '');
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Parse error: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

async function fetchDrugEvents(skip = 0, limit = 100) {
  const url = `https://api.fda.gov/drug/event.json?limit=${limit}&skip=${skip}`;
  return fetchJSON(url);
}

async function fetchDrugLabel(drugName) {
  const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(drugName)}"&limit=1`;
  try {
    return await fetchJSON(url);
  } catch { return null; }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('🔬 Drug Analyzer — API Data Expansion');
  console.log('======================================\n');

  // Load existing data
  console.log('📂 Step 1: Loading existing database...');
  let existingDrugs = [];
  if (fs.existsSync(DRUGS_FILE)) {
    existingDrugs = JSON.parse(fs.readFileSync(DRUGS_FILE, 'utf8'));
  }
  console.log(`   ✅ ${existingDrugs.length} existing drugs\n`);

  // Create lookup map
  const drugMap = new Map();
  for (const drug of existingDrugs) {
    drugMap.set(drug.id, drug);
  }

  // Load existing interactions
  let existingInteractions = [];
  if (fs.existsSync(INTERACTIONS_FILE)) {
    existingInteractions = JSON.parse(fs.readFileSync(INTERACTIONS_FILE, 'utf8'));
  }
  console.log(`   ✅ ${existingInteractions.length} existing interactions`);

  // Load existing events
  let existingEvents = [];
  if (fs.existsSync(EVENTS_FILE)) {
    existingEvents = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
  }
  console.log(`   ✅ ${existingEvents.length} existing events\n`);

  // Step 2: Fetch additional events from OpenFDA API
  // We'll fetch multiple pages, each with 100 events
  const PAGES_TO_FETCH = 10; // 10 pages × 100 events = 1,000 new events
  const PAGE_SIZE = 100;
  
  console.log(`📥 Step 2: Fetching ${PAGES_TO_FETCH * PAGE_SIZE} events from OpenFDA API...\n`);

  const newDrugMap = new Map();
  const newPairCounts = new Map();
  const newEvents = [];
  let totalFetched = 0;

  for (let page = 0; page < PAGES_TO_FETCH; page++) {
    const skip = page * PAGE_SIZE;
    
    try {
      process.stdout.write(`   Page ${page + 1}/${PAGES_TO_FETCH} (skip=${skip})... `);
      const data = await fetchDrugEvents(skip, PAGE_SIZE);
      
      if (!data.results || data.results.length === 0) {
        console.log('No more results');
        break;
      }

      for (const event of data.results) {
        const patient = event.patient || {};
        const drugs = patient.drug || [];
        const reactions = patient.reaction || [];

        const reactionNames = reactions
          .map(r => r.reactionmeddrapt)
          .filter(Boolean)
          .map(r => r.replace(/\^/g, "'"));

        const seriousness = {
          serious: event.serious === '1',
          death: event.seriousnessdeath === '1',
          lifeThreatening: event.seriousnesslifethreatening === '1',
          hospitalization: event.seriousnesshospitalization === '1',
          disabling: event.seriousnessdisabling === '1',
        };

        let severityScore = 0;
        if (seriousness.death) severityScore = 5;
        else if (seriousness.lifeThreatening) severityScore = 4;
        else if (seriousness.hospitalization) severityScore = 3;
        else if (seriousness.disabling) severityScore = 3;
        else if (seriousness.serious) severityScore = 2;
        else severityScore = 1;

        const eventDrugNames = [];

        for (const drug of drugs) {
          const openfda = drug.openfda || {};
          const medProduct = drug.medicinalproduct || '';
          const brandNames = openfda.brand_name || [];
          const genericNames = openfda.generic_name || [];
          const activeSubstance = drug.activesubstance?.activesubstancename || '';
          const key = normalize(medProduct || activeSubstance || (brandNames[0] || ''));
          if (!key) continue;

          eventDrugNames.push(key);

          if (!newDrugMap.has(key)) {
            newDrugMap.set(key, {
              drugName: medProduct || activeSubstance || brandNames[0] || key,
              brandNames: new Set(brandNames),
              genericNames: new Set(genericNames),
              drugClass: new Set(openfda.pharm_class_epc || []),
              routes: new Set(openfda.route || []),
              indications: new Set(),
              sideEffects: new Map(),
              eventCount: 0,
              seriousEventCount: 0,
              deathCount: 0,
              dosageForms: new Set(),
              manufacturers: new Set(),
            });
          }

          const d = newDrugMap.get(key);
          d.eventCount++;
          if (seriousness.serious) d.seriousEventCount++;
          if (seriousness.death) d.deathCount++;

          brandNames.forEach(b => d.brandNames.add(b));
          genericNames.forEach(g => d.genericNames.add(g));
          (openfda.pharm_class_epc || []).forEach(c => d.drugClass.add(c));
          (openfda.route || []).forEach(r => d.routes.add(r));
          if (drug.drugindication) d.indications.add(drug.drugindication.replace(/\^/g, "'"));
          if (drug.drugdosageform) d.dosageForms.add(drug.drugdosageform);
          if ((openfda.manufacturer_name || [])[0]) d.manufacturers.add(openfda.manufacturer_name[0]);

          for (const reaction of reactionNames) {
            d.sideEffects.set(reaction, (d.sideEffects.get(reaction) || 0) + 1);
          }
        }

        // Track co-occurrences
        const uniqueDrugs = [...new Set(eventDrugNames)].sort();
        for (let i = 0; i < uniqueDrugs.length; i++) {
          for (let j = i + 1; j < uniqueDrugs.length; j++) {
            const pairKey = `${uniqueDrugs[i]}|||${uniqueDrugs[j]}`;
            if (!newPairCounts.has(pairKey)) {
              newPairCounts.set(pairKey, {
                drug1: uniqueDrugs[i], drug2: uniqueDrugs[j],
                count: 0, sharedReactions: new Map(), severitySum: 0, seriousCount: 0,
              });
            }
            const pair = newPairCounts.get(pairKey);
            pair.count++;
            pair.severitySum += severityScore;
            if (seriousness.serious) pair.seriousCount++;
            for (const reaction of reactionNames) {
              pair.sharedReactions.set(reaction, (pair.sharedReactions.get(reaction) || 0) + 1);
            }
          }
        }

        newEvents.push({
          reportId: event.safetyreportid,
          receiveDate: event.receivedate,
          serious: seriousness.serious,
          severityScore,
          drugs: eventDrugNames,
          reactions: reactionNames.slice(0, 20),
          patientAge: patient.patientonsetage || null,
          patientSex: patient.patientsex || null,
          country: event.occurcountry || event.primarysourcecountry || '',
        });
      }

      totalFetched += data.results.length;
      console.log(`✅ ${data.results.length} events (${newDrugMap.size} drugs found so far)`);
      
      // Rate limit: OpenFDA allows ~240 req/min without API key
      await sleep(300);
    } catch (err) {
      console.log(`⚠️  Error: ${err.message}`);
      if (err.message.includes('429')) {
        console.log('   Rate limited, waiting 10 seconds...');
        await sleep(10000);
        page--; // Retry this page
      }
    }
  }

  console.log(`\n   📊 Fetched ${totalFetched} events, discovered ${newDrugMap.size} drugs\n`);

  // Step 3: Merge with existing data
  console.log('🔀 Step 3: Merging with existing database...');
  let newDrugCount = 0;
  let updatedDrugCount = 0;

  for (const [key, newDrug] of newDrugMap) {
    if (drugMap.has(key)) {
      // Merge into existing drug
      const existing = drugMap.get(key);
      existing.eventCount += newDrug.eventCount;
      existing.seriousEventCount += newDrug.seriousEventCount;
      existing.deathCount += newDrug.deathCount;
      
      // Merge brand names
      const existingBrands = new Set(existing.brandNames || []);
      [...newDrug.brandNames].forEach(b => existingBrands.add(b));
      existing.brandNames = [...existingBrands];
      
      // Merge generic names
      const existingGenerics = new Set(existing.genericNames || []);
      [...newDrug.genericNames].forEach(g => existingGenerics.add(g));
      existing.genericNames = [...existingGenerics];
      
      // Merge drug class
      const existingClass = new Set(existing.drugClass || []);
      [...newDrug.drugClass].forEach(c => existingClass.add(c));
      existing.drugClass = [...existingClass];
      
      // Merge routes
      const existingRoutes = new Set(existing.routes || []);
      [...newDrug.routes].forEach(r => existingRoutes.add(r));
      existing.routes = [...existingRoutes];
      
      // Merge indications
      const existingIndications = new Set(existing.indications || []);
      [...newDrug.indications].forEach(i => existingIndications.add(i));
      existing.indications = [...existingIndications].slice(0, 10);
      
      // Merge side effects
      const seMap = new Map((existing.sideEffects || []).map(se => [se.name, se.count]));
      for (const [name, count] of newDrug.sideEffects) {
        seMap.set(name, (seMap.get(name) || 0) + count);
      }
      existing.sideEffects = [...seMap.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50);
      
      // Merge manufacturers
      const existingMfrs = new Set(existing.manufacturers || []);
      [...newDrug.manufacturers].forEach(m => existingMfrs.add(m));
      existing.manufacturers = [...existingMfrs];
      
      // Merge dosage forms
      const existingForms = new Set(existing.dosageForms || []);
      [...newDrug.dosageForms].forEach(f => existingForms.add(f));
      existing.dosageForms = [...existingForms];
      
      // Recalculate risk score
      existing.riskScore = existing.eventCount > 0
        ? Math.min(100, Math.round((existing.seriousEventCount / existing.eventCount) * 100))
        : 0;
      
      updatedDrugCount++;
    } else {
      // New drug - convert from Map format to serialized format
      const sideEffectsArray = [...newDrug.sideEffects.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50);

      drugMap.set(key, {
        id: key,
        drugName: newDrug.drugName,
        brandNames: [...newDrug.brandNames],
        genericNames: [...newDrug.genericNames],
        drugClass: [...newDrug.drugClass],
        routes: [...newDrug.routes],
        indications: [...newDrug.indications].slice(0, 10),
        sideEffects: sideEffectsArray,
        dosageForms: [...newDrug.dosageForms],
        manufacturers: [...newDrug.manufacturers],
        eventCount: newDrug.eventCount,
        seriousEventCount: newDrug.seriousEventCount,
        deathCount: newDrug.deathCount,
        riskScore: newDrug.eventCount > 0
          ? Math.min(100, Math.round((newDrug.seriousEventCount / newDrug.eventCount) * 100))
          : 0,
      });
      newDrugCount++;
    }
  }

  console.log(`   ✅ ${newDrugCount} new drugs added`);
  console.log(`   ✅ ${updatedDrugCount} existing drugs enriched\n`);

  // Step 4: Merge interactions
  console.log('🔗 Step 4: Merging interactions...');
  const interactionMap = new Map();
  
  // Load existing interactions
  for (const inter of existingInteractions) {
    const key = `${inter.drug1}|||${inter.drug2}`;
    interactionMap.set(key, inter);
  }
  
  let newInteractions = 0;
  for (const [pairKey, pair] of newPairCounts) {
    if (pair.count < 2) continue;
    
    if (interactionMap.has(pairKey)) {
      // Merge
      const existing = interactionMap.get(pairKey);
      existing.coOccurrenceCount += pair.count;
      existing.seriousCount += pair.seriousCount;
      // Merge shared reactions
      const reactionMap = new Map((existing.sharedReactions || []).map(r => [r.name, r.count]));
      for (const [name, count] of pair.sharedReactions) {
        reactionMap.set(name, (reactionMap.get(name) || 0) + count);
      }
      existing.sharedReactions = [...reactionMap.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    } else {
      const drug1Data = drugMap.get(pair.drug1);
      const drug2Data = drugMap.get(pair.drug2);
      const avgSeverity = pair.severitySum / pair.count;
      let severity = 'low';
      if (avgSeverity >= 4) severity = 'critical';
      else if (avgSeverity >= 3) severity = 'high';
      else if (avgSeverity >= 2) severity = 'moderate';

      interactionMap.set(pairKey, {
        drug1: pair.drug1,
        drug1Name: drug1Data?.drugName || pair.drug1,
        drug2: pair.drug2,
        drug2Name: drug2Data?.drugName || pair.drug2,
        coOccurrenceCount: pair.count,
        severity,
        avgSeverityScore: Math.round(avgSeverity * 10) / 10,
        seriousCount: pair.seriousCount,
        sharedReactions: [...pair.sharedReactions.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        description: `${drug1Data?.drugName || pair.drug1} and ${drug2Data?.drugName || pair.drug2} co-occur in ${pair.count} adverse event reports.`,
      });
      newInteractions++;
    }
  }

  console.log(`   ✅ ${newInteractions} new interaction pairs\n`);

  // Step 5: Write updated files
  console.log('💾 Step 5: Writing updated data files...');
  
  const finalDrugs = [...drugMap.values()];
  finalDrugs.sort((a, b) => (b.eventCount || 0) - (a.eventCount || 0));
  fs.writeFileSync(DRUGS_FILE, JSON.stringify(finalDrugs, null, 0));
  console.log(`   drugs.json: ${(fs.statSync(DRUGS_FILE).size / 1024).toFixed(0)} KB (${finalDrugs.length} drugs)`);

  const finalInteractions = [...interactionMap.values()];
  finalInteractions.sort((a, b) => (b.coOccurrenceCount || 0) - (a.coOccurrenceCount || 0));
  fs.writeFileSync(INTERACTIONS_FILE, JSON.stringify(finalInteractions, null, 0));
  console.log(`   interactions.json: ${(fs.statSync(INTERACTIONS_FILE).size / 1024).toFixed(0)} KB (${finalInteractions.length} interactions)`);

  const finalEvents = [...existingEvents, ...newEvents];
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(finalEvents, null, 0));
  console.log(`   events.json: ${(fs.statSync(EVENTS_FILE).size / 1024).toFixed(0)} KB (${finalEvents.length} events)`);

  console.log('\n🎉 Data expansion complete!');
  console.log(`   📊 ${finalDrugs.length} drugs | ${finalInteractions.length} interactions | ${finalEvents.length} events`);
  console.log(`   ➕ ${newDrugCount} new drugs | ${updatedDrugCount} enriched | ${newInteractions} new interactions`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
