/**
 * Age-Based Drug Risk Analysis Engine
 * Evaluates drug safety based on patient age group using FDA adverse event data.
 */
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

let ageRiskCache = null;
let drugAgeProfilesCache = null;

// ── Age group definitions ──
const AGE_GROUPS = [
  { id: 'neonate',    label: 'Neonates',     range: '0–28 days',   minYears: 0,    maxYears: 0.077 },
  { id: 'infant',     label: 'Infants',      range: '1–12 months', minYears: 0.077, maxYears: 1 },
  { id: 'child',      label: 'Children',     range: '1–12 years',  minYears: 1,    maxYears: 12 },
  { id: 'adolescent', label: 'Adolescents',  range: '13–18 years', minYears: 13,   maxYears: 18 },
  { id: 'adult',      label: 'Adults',       range: '19–64 years', minYears: 19,   maxYears: 64 },
  { id: 'elderly',    label: 'Elderly',      range: '65+ years',   minYears: 65,   maxYears: 150 },
];

// ── Known pediatric/geriatric drug concerns (evidence-based rules) ──
const KNOWN_RISKS = {
  pediatric: {
    highRisk: [
      'ASPIRIN', 'METHOTREXATE', 'WARFARIN', 'FLUOROURACIL', 'CYCLOPHOSPHAMIDE',
      'VENETOCLAX', 'DEXAMETHASONE', 'OLANZAPINE', 'LEVETIRACETAM',
    ],
    concerns: {
      ASPIRIN: "Reye's syndrome risk in children under 18 with viral infections",
      METHOTREXATE: 'Severe myelosuppression and hepatotoxicity in pediatric patients',
      WARFARIN: 'Difficult to dose in children; higher bleeding risk',
      OLANZAPINE: 'Not approved for pediatric use; metabolic syndrome risk',
    },
  },
  geriatric: {
    highRisk: [
      'OLANZAPINE', 'PREGABALIN', 'GABAPENTIN', 'DEPAKOTE', 'LEVETIRACETAM',
      'FUROSEMIDE', 'WARFARIN', 'METFORMIN',
    ],
    concerns: {
      OLANZAPINE: 'Increased risk of stroke and death in elderly with dementia',
      PREGABALIN: 'Falls, dizziness, somnolence more severe in elderly',
      FUROSEMIDE: 'Electrolyte imbalances and dehydration risk amplified in elderly',
      WARFARIN: 'Higher bleeding risk; requires more frequent INR monitoring',
      METFORMIN: 'Lactic acidosis risk increases with reduced renal function in elderly',
    },
  },
  pregnancy: {
    // Category X drugs — contraindicated in pregnancy
    categoryX: ['METHOTREXATE', 'WARFARIN', 'FLUOROURACIL', 'LEFLUNOMIDE'],
  },
};

/**
 * Classify age in years into an age group
 */
export function classifyAge(ageYears) {
  if (ageYears == null || isNaN(ageYears) || ageYears < 0) return null;
  for (const group of AGE_GROUPS) {
    if (ageYears >= group.minYears && ageYears <= group.maxYears) {
      return group;
    }
  }
  return AGE_GROUPS[AGE_GROUPS.length - 1]; // elderly fallback
}

/**
 * Convert age input to years
 */
export function normalizeAgeToYears(age, unit = 'years') {
  const num = parseFloat(age);
  if (isNaN(num)) return null;
  switch (unit.toLowerCase()) {
    case 'days': return num / 365.25;
    case 'months': return num / 12;
    case 'weeks': return num / 52.18;
    case 'years': default: return num;
  }
}

/**
 * Build age-stratified risk profiles from events data.
 * Called once, then cached.
 */
function buildAgeRiskProfiles() {
  if (drugAgeProfilesCache) return drugAgeProfilesCache;

  const eventsPath = path.join(DATA_DIR, 'events.json');
  const drugsPath = path.join(DATA_DIR, 'drugs.json');
  let events = [];
  let drugs = [];

  try {
    events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
    drugs = JSON.parse(fs.readFileSync(drugsPath, 'utf8'));
  } catch (err) {
    console.error('[AgeRisk] Failed to load data:', err.message);
    return new Map();
  }

  const drugMap = new Map();
  for (const d of drugs) drugMap.set(d.id, d);

  // Track per-drug per-age-group stats
  const profiles = new Map(); // drugId -> { [ageGroupId]: { events, serious, reactions: Map } }

  for (const event of events) {
    if (!event.patientAge) continue;
    const ageYears = parseFloat(event.patientAge);
    if (isNaN(ageYears)) continue;

    const ageGroup = classifyAge(ageYears);
    if (!ageGroup) continue;

    const eventDrugs = [...new Set(event.drugs || [])];
    for (const drugName of eventDrugs) {
      const key = drugName.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
      if (!profiles.has(key)) {
        profiles.set(key, {});
      }
      const profile = profiles.get(key);
      if (!profile[ageGroup.id]) {
        profile[ageGroup.id] = { events: 0, serious: 0, reactions: new Map() };
      }
      const ageStat = profile[ageGroup.id];
      ageStat.events++;
      if (event.serious) ageStat.serious++;

      for (const reaction of (event.reactions || [])) {
        ageStat.reactions.set(reaction, (ageStat.reactions.get(reaction) || 0) + 1);
      }
    }
  }

  // Convert reaction Maps to sorted arrays
  for (const [drugId, ageGroups] of profiles) {
    for (const [groupId, stats] of Object.entries(ageGroups)) {
      stats.topReactions = [...stats.reactions.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));
      delete stats.reactions;
    }
  }

  drugAgeProfilesCache = profiles;
  console.log(`[AgeRisk] Built age profiles for ${profiles.size} drugs`);
  return profiles;
}

/**
 * Calculate age-based risk score for a specific drug and age
 */
export function calculateAgeRisk(drugId, ageYears) {
  const normalizedId = drugId.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
  const ageGroup = classifyAge(ageYears);
  if (!ageGroup) {
    return {
      drugId: normalizedId,
      ageGroup: null,
      riskScore: 0,
      riskLevel: 'unknown',
      explanation: 'Unable to classify age.',
      factors: [],
      recommendedAction: 'Provide a valid age for analysis.',
    };
  }

  const profiles = buildAgeRiskProfiles();
  const drugProfile = profiles.get(normalizedId) || {};
  const groupStats = drugProfile[ageGroup.id] || { events: 0, serious: 0, topReactions: [] };

  // Load the drug's base data for enrichment
  const drugsPath = path.join(DATA_DIR, 'drugs.json');
  let drugData = null;
  try {
    const allDrugs = JSON.parse(fs.readFileSync(drugsPath, 'utf8'));
    drugData = allDrugs.find(d => d.id === normalizedId);
  } catch {}

  // ── Risk scoring algorithm ──
  let score = 0;
  const factors = [];
  const precautions = [];

  // Factor 1: Adverse event frequency in this age group (0–30 pts)
  const totalEvents = Object.values(drugProfile).reduce((s, g) => s + g.events, 0) || 1;
  const groupEventRatio = groupStats.events / totalEvents;
  const eventScore = Math.min(30, Math.round(groupEventRatio * 60));
  if (groupStats.events > 0) {
    factors.push({
      factor: 'Adverse Event Frequency',
      score: eventScore,
      detail: `${groupStats.events} adverse events reported in ${ageGroup.label} (${(groupEventRatio * 100).toFixed(1)}% of all reports)`,
    });
  }
  score += eventScore;

  // Factor 2: Seriousness ratio (0–25 pts)
  const seriousRatio = groupStats.events > 0 ? groupStats.serious / groupStats.events : 0;
  const seriousScore = Math.min(25, Math.round(seriousRatio * 30));
  if (groupStats.serious > 0) {
    factors.push({
      factor: 'Serious Event Rate',
      score: seriousScore,
      detail: `${(seriousRatio * 100).toFixed(0)}% of events in ${ageGroup.label} were classified as serious`,
    });
  }
  score += seriousScore;

  // Factor 3: Known age-specific contraindications (0–25 pts)
  const isPediatric = ['neonate', 'infant', 'child'].includes(ageGroup.id);
  const isGeriatric = ageGroup.id === 'elderly';

  if (isPediatric && KNOWN_RISKS.pediatric.highRisk.includes(normalizedId)) {
    score += 25;
    const concern = KNOWN_RISKS.pediatric.concerns[normalizedId] || 'Known pediatric safety concern';
    factors.push({
      factor: 'Pediatric Contraindication',
      score: 25,
      detail: concern,
    });
    precautions.push('Consult a pediatric specialist before use');
  }

  if (isGeriatric && KNOWN_RISKS.geriatric.highRisk.includes(normalizedId)) {
    score += 20;
    const concern = KNOWN_RISKS.geriatric.concerns[normalizedId] || 'Known geriatric safety concern';
    factors.push({
      factor: 'Geriatric Concern',
      score: 20,
      detail: concern,
    });
    precautions.push('Dose adjustment may be necessary for elderly patients');
  }

  // Factor 4: Drug metadata signals (0–20 pts)
  if (drugData) {
    // Pregnancy category for applicable age groups
    if (drugData.pregnancyCategory === 'X' && ageGroup.id === 'adult') {
      factors.push({
        factor: 'Pregnancy Category X',
        score: 10,
        detail: 'Contraindicated in pregnancy — risk of fetal harm',
      });
      score += 10;
    }

    // Alcohol interaction amplified in elderly
    if (drugData.alcoholInteraction && isGeriatric) {
      factors.push({
        factor: 'Alcohol Interaction (Elderly)',
        score: 5,
        detail: 'Alcohol interaction effects are amplified in elderly patients',
      });
      score += 5;
    }

    // High base risk score amplified for extremes of age
    if (drugData.riskScore >= 80 && (isPediatric || isGeriatric)) {
      const amplify = Math.min(15, Math.round((drugData.riskScore - 70) / 3));
      factors.push({
        factor: 'High-Risk Drug in Vulnerable Age',
        score: amplify,
        detail: `Base risk score of ${drugData.riskScore} is amplified for ${ageGroup.label}`,
      });
      score += amplify;
    }

    // Death count consideration
    if (drugData.deathCount > 0 && (isPediatric || isGeriatric)) {
      const deathScore = Math.min(10, drugData.deathCount);
      factors.push({
        factor: 'Mortality Reports',
        score: deathScore,
        detail: `${drugData.deathCount} death(s) reported — higher concern for ${ageGroup.label}`,
      });
      score += deathScore;
    }
  }

  // Factor 5: Missing data penalty — if no events for this age group, moderate caution
  if (groupStats.events === 0 && totalEvents > 5) {
    score += 15;
    factors.push({
      factor: 'Limited Age-Group Data',
      score: 15,
      detail: `No adverse events reported for ${ageGroup.label} — insufficient safety data for this age group`,
    });
    precautions.push('Limited safety data available for this age group');
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine risk level
  let riskLevel, riskColor;
  if (score <= 30) { riskLevel = 'low'; riskColor = '#10b981'; }
  else if (score <= 70) { riskLevel = 'moderate'; riskColor = '#f59e0b'; }
  else { riskLevel = 'high'; riskColor = '#ef4444'; }

  // Build explanation
  const explanation = buildExplanation(normalizedId, ageGroup, score, riskLevel, factors, drugData);

  // Build recommended actions
  const recommendedAction = buildRecommendation(riskLevel, ageGroup, factors, precautions);

  return {
    drugId: normalizedId,
    drugName: drugData?.drugName || normalizedId,
    ageYears,
    ageGroup: {
      id: ageGroup.id,
      label: ageGroup.label,
      range: ageGroup.range,
    },
    riskScore: score,
    riskLevel,
    riskColor,
    explanation,
    factors,
    recommendedAction,
    precautions,
    ageGroupStats: groupStats,
    topReactions: groupStats.topReactions || [],
  };
}

/**
 * Get risk across ALL age groups for a single drug (for chart visualization)
 */
export function getAgeRiskProfile(drugId) {
  return AGE_GROUPS.map(group => {
    const midAge = (group.minYears + Math.min(group.maxYears, 100)) / 2;
    const result = calculateAgeRisk(drugId, midAge);
    return {
      ageGroup: group.id,
      label: group.label,
      range: group.range,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      riskColor: result.riskColor,
      events: result.ageGroupStats?.events || 0,
      serious: result.ageGroupStats?.serious || 0,
      topReactions: result.topReactions?.slice(0, 5) || [],
    };
  });
}

/**
 * Batch analyze multiple drugs for a given age
 */
export function batchAgeRiskAnalysis(drugIds, ageYears) {
  return drugIds.map(id => calculateAgeRisk(id, ageYears));
}

/**
 * Get all age group definitions
 */
export function getAgeGroups() {
  return AGE_GROUPS;
}

// ── Helper functions ──

function buildExplanation(drugId, ageGroup, score, riskLevel, factors, drugData) {
  const drugName = drugData?.drugName || drugId;
  const parts = [];

  if (riskLevel === 'low') {
    parts.push(`${drugName} shows a LOW risk profile for ${ageGroup.label} (${ageGroup.range}).`);
    parts.push('Based on available adverse event data, this drug appears to have an acceptable safety profile for this age group.');
  } else if (riskLevel === 'moderate') {
    parts.push(`${drugName} shows MODERATE risk for ${ageGroup.label} (${ageGroup.range}).`);
    parts.push('Some safety concerns have been identified. Use with appropriate clinical monitoring.');
  } else {
    parts.push(`${drugName} shows HIGH risk for ${ageGroup.label} (${ageGroup.range}).`);
    parts.push('Significant safety concerns identified. Careful clinical evaluation is essential.');
  }

  if (factors.length > 0) {
    parts.push(`Key factors: ${factors.map(f => f.factor).join(', ')}.`);
  }

  return parts.join(' ');
}

function buildRecommendation(riskLevel, ageGroup, factors, precautions) {
  const recs = [];

  if (riskLevel === 'high') {
    recs.push('⚠️ Consult healthcare provider before use');
    recs.push('Consider safer alternatives if available');
    recs.push('Close monitoring required if prescribed');
  } else if (riskLevel === 'moderate') {
    recs.push('Use under medical supervision');
    recs.push('Monitor for adverse effects');
  } else {
    recs.push('Generally considered safe for this age group');
    recs.push('Standard monitoring recommended');
  }

  if (['neonate', 'infant', 'child'].includes(ageGroup.id)) {
    recs.push('Weight-based dosing required for pediatric patients');
  }
  if (ageGroup.id === 'elderly') {
    recs.push('Start with lowest effective dose');
    recs.push('Monitor renal and hepatic function');
  }

  recs.push(...precautions);

  return [...new Set(recs)];
}
