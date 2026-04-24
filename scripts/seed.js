const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const ZIP_PATH = path.join(__dirname, '..', 'drug-event-0033-of-0033.json.zip');
const DATA_DIR = path.join(__dirname, '..', 'data');
const DRUGS_FILE = path.join(DATA_DIR, 'drugs.json');
const INTERACTIONS_FILE = path.join(DATA_DIR, 'interactions.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function normalize(str) {
  if (!str) return '';
  return str.toString().trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '');
}

function extractDrugInfo(drug) {
  const openfda = drug.openfda || {};
  return {
    medicinalProduct: drug.medicinalproduct || '',
    brandNames: openfda.brand_name || [],
    genericNames: openfda.generic_name || [],
    drugClass: openfda.pharm_class_epc || [],
    routes: openfda.route || [],
    indication: drug.drugindication || '',
    dosageText: drug.drugdosagetext || '',
    dosageForm: drug.drugdosageform || '',
    characterization: drug.drugcharacterization || '1',
    activeSubstance: drug.activesubstance?.activesubstancename || '',
    manufacturerName: (openfda.manufacturer_name || [])[0] || '',
  };
}

function run() {
  console.log('🔬 Drug Analyzer — Data Ingestion Pipeline');
  console.log('==========================================\n');

  ensureDir(DATA_DIR);

  // Step 1: Extract ZIP
  console.log('📦 Step 1: Extracting ZIP file...');
  if (!fs.existsSync(ZIP_PATH)) {
    console.error(`❌ ZIP file not found at: ${ZIP_PATH}`);
    console.log('Please place drug-event-0033-of-0033.json.zip in the project root.');
    process.exit(1);
  }

  const zip = new AdmZip(ZIP_PATH);
  const entries = zip.getEntries();
  console.log(`   Found ${entries.length} file(s) in ZIP`);

  let rawData = null;
  for (const entry of entries) {
    if (entry.entryName.endsWith('.json')) {
      console.log(`   Reading: ${entry.entryName} (${(entry.header.size / 1024 / 1024).toFixed(1)} MB)`);
      const buffer = entry.getData();
      rawData = JSON.parse(buffer.toString('utf8'));
      break;
    }
  }

  if (!rawData || !rawData.results) {
    console.error('❌ Could not parse JSON data from ZIP');
    process.exit(1);
  }

  console.log(`   ✅ Parsed ${rawData.results.length} event reports\n`);

  // Step 2: Process events
  console.log('⚙️  Step 2: Processing events...');
  const drugMap = new Map();
  const drugPairCounts = new Map();
  const processedEvents = [];

  for (const event of rawData.results) {
    const patient = event.patient || {};
    const drugs = patient.drug || [];
    const reactions = patient.reaction || [];

    const reactionNames = reactions
      .map(r => r.reactionmeddrapt)
      .filter(Boolean)
      .map(r => r.replace(/\^/g, "'"));

    const reactionOutcomes = reactions
      .map(r => ({ name: (r.reactionmeddrapt || '').replace(/\^/g, "'"), outcome: r.reactionoutcome }));

    const seriousness = {
      serious: event.serious === '1',
      death: event.seriousnessdeath === '1',
      lifeThreatening: event.seriousnesslifethreatening === '1',
      hospitalization: event.seriousnesshospitalization === '1',
      disabling: event.seriousnessdisabling === '1',
      congenitalAnomaly: event.seriousnesscongenitalanomali === '1',
      other: event.seriousnessother === '1',
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
      const info = extractDrugInfo(drug);
      const key = normalize(info.medicinalProduct || info.activeSubstance || (info.brandNames[0] || ''));
      if (!key) continue;

      eventDrugNames.push(key);

      if (!drugMap.has(key)) {
        drugMap.set(key, {
          drugName: info.medicinalProduct || info.activeSubstance || info.brandNames[0] || key,
          brandNames: new Set(info.brandNames),
          genericNames: new Set(info.genericNames),
          drugClass: new Set(info.drugClass),
          routes: new Set(info.routes),
          indications: new Set(),
          sideEffects: new Map(),
          eventCount: 0,
          seriousEventCount: 0,
          deathCount: 0,
          dosageForms: new Set(),
          manufacturers: new Set(),
        });
      }

      const d = drugMap.get(key);
      d.eventCount++;
      if (seriousness.serious) d.seriousEventCount++;
      if (seriousness.death) d.deathCount++;

      info.brandNames.forEach(b => d.brandNames.add(b));
      info.genericNames.forEach(g => d.genericNames.add(g));
      info.drugClass.forEach(c => d.drugClass.add(c));
      info.routes.forEach(r => d.routes.add(r));
      if (info.indication) d.indications.add(info.indication.replace(/\^/g, "'"));
      if (info.dosageForm) d.dosageForms.add(info.dosageForm);
      if (info.manufacturerName) d.manufacturers.add(info.manufacturerName);

      for (const reaction of reactionNames) {
        d.sideEffects.set(reaction, (d.sideEffects.get(reaction) || 0) + 1);
      }
    }

    // Track drug co-occurrences for interaction detection
    const uniqueDrugs = [...new Set(eventDrugNames)].sort();
    for (let i = 0; i < uniqueDrugs.length; i++) {
      for (let j = i + 1; j < uniqueDrugs.length; j++) {
        const pairKey = `${uniqueDrugs[i]}|||${uniqueDrugs[j]}`;
        if (!drugPairCounts.has(pairKey)) {
          drugPairCounts.set(pairKey, {
            drug1: uniqueDrugs[i],
            drug2: uniqueDrugs[j],
            count: 0,
            sharedReactions: new Map(),
            severitySum: 0,
            seriousCount: 0,
          });
        }
        const pair = drugPairCounts.get(pairKey);
        pair.count++;
        pair.severitySum += severityScore;
        if (seriousness.serious) pair.seriousCount++;
        for (const reaction of reactionNames) {
          pair.sharedReactions.set(reaction, (pair.sharedReactions.get(reaction) || 0) + 1);
        }
      }
    }

    processedEvents.push({
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

  console.log(`   ✅ Processed ${processedEvents.length} events\n`);

  // Step 3: Serialize drugs
  console.log('💊 Step 3: Building drug database...');
  const drugsArray = [];
  for (const [key, drug] of drugMap) {
    const sideEffectsArray = [...drug.sideEffects.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    drugsArray.push({
      id: key,
      drugName: drug.drugName,
      brandNames: [...drug.brandNames],
      genericNames: [...drug.genericNames],
      drugClass: [...drug.drugClass],
      routes: [...drug.routes],
      indications: [...drug.indications].slice(0, 10),
      sideEffects: sideEffectsArray.slice(0, 50),
      dosageForms: [...drug.dosageForms],
      manufacturers: [...drug.manufacturers],
      eventCount: drug.eventCount,
      seriousEventCount: drug.seriousEventCount,
      deathCount: drug.deathCount,
      riskScore: drug.eventCount > 0
        ? Math.min(100, Math.round((drug.seriousEventCount / drug.eventCount) * 100))
        : 0,
    });
  }

  drugsArray.sort((a, b) => b.eventCount - a.eventCount);
  console.log(`   ✅ ${drugsArray.length} unique drugs indexed\n`);

  // Step 4: Build interactions
  console.log('🔗 Step 4: Building interaction database...');
  const interactionsArray = [];
  for (const [, pair] of drugPairCounts) {
    if (pair.count < 2) continue; // Only include pairs seen together multiple times

    const sharedReactions = [...pair.sharedReactions.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const avgSeverity = pair.severitySum / pair.count;
    let severity = 'low';
    if (avgSeverity >= 4) severity = 'critical';
    else if (avgSeverity >= 3) severity = 'high';
    else if (avgSeverity >= 2) severity = 'moderate';

    const drug1Data = drugMap.get(pair.drug1);
    const drug2Data = drugMap.get(pair.drug2);

    interactionsArray.push({
      drug1: pair.drug1,
      drug1Name: drug1Data?.drugName || pair.drug1,
      drug2: pair.drug2,
      drug2Name: drug2Data?.drugName || pair.drug2,
      coOccurrenceCount: pair.count,
      severity,
      avgSeverityScore: Math.round(avgSeverity * 10) / 10,
      seriousCount: pair.seriousCount,
      sharedReactions,
      description: `${drug1Data?.drugName || pair.drug1} and ${drug2Data?.drugName || pair.drug2} were reported together in ${pair.count} adverse event report(s). ${pair.seriousCount} of these were classified as serious.`,
    });
  }

  interactionsArray.sort((a, b) => b.coOccurrenceCount - a.coOccurrenceCount);
  console.log(`   ✅ ${interactionsArray.length} drug interaction pairs detected\n`);

  // Step 5: Write files
  console.log('💾 Step 5: Writing data files...');
  fs.writeFileSync(DRUGS_FILE, JSON.stringify(drugsArray, null, 0));
  console.log(`   drugs.json: ${(fs.statSync(DRUGS_FILE).size / 1024).toFixed(0)} KB`);

  fs.writeFileSync(INTERACTIONS_FILE, JSON.stringify(interactionsArray, null, 0));
  console.log(`   interactions.json: ${(fs.statSync(INTERACTIONS_FILE).size / 1024).toFixed(0)} KB`);

  fs.writeFileSync(EVENTS_FILE, JSON.stringify(processedEvents, null, 0));
  console.log(`   events.json: ${(fs.statSync(EVENTS_FILE).size / 1024).toFixed(0)} KB`);

  console.log('\n🎉 Data ingestion complete!');
  console.log(`   📊 ${drugsArray.length} drugs | ${interactionsArray.length} interactions | ${processedEvents.length} events`);
}

run();
