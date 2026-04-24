import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

let drugsData = null;
let interactionsData = null;
let eventsData = null;
let drugIndex = null;
let searchIndex = null;

function loadData() {
  if (drugsData) return;

  try {
    const drugsPath = path.join(DATA_DIR, 'drugs.json');
    const interactionsPath = path.join(DATA_DIR, 'interactions.json');
    const eventsPath = path.join(DATA_DIR, 'events.json');

    drugsData = JSON.parse(fs.readFileSync(drugsPath, 'utf8'));
    interactionsData = JSON.parse(fs.readFileSync(interactionsPath, 'utf8'));
    eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

    // Build index
    drugIndex = new Map();
    searchIndex = [];

    for (const drug of drugsData) {
      drugIndex.set(drug.id, drug);

      // Index all searchable names
      const names = [
        drug.drugName,
        ...drug.brandNames,
        ...drug.genericNames,
      ].filter(Boolean);

      for (const name of names) {
        searchIndex.push({
          text: name.toLowerCase(),
          drugId: drug.id,
          drugName: drug.drugName,
        });
      }
    }

    console.log(`[DataStore] Loaded: ${drugsData.length} drugs, ${interactionsData.length} interactions, ${eventsData.length} events`);
  } catch (err) {
    console.error('[DataStore] Failed to load data:', err.message);
    drugsData = [];
    interactionsData = [];
    eventsData = [];
    drugIndex = new Map();
    searchIndex = [];
  }
}

export function searchDrugs(query, limit = 20) {
  loadData();
  if (!query) return drugsData.slice(0, limit);

  const q = query.toLowerCase().trim();
  const results = new Map();

  for (const entry of searchIndex) {
    if (entry.text.includes(q)) {
      if (!results.has(entry.drugId)) {
        const drug = drugIndex.get(entry.drugId);
        if (drug) {
          const score = entry.text.startsWith(q) ? 100 : entry.text.indexOf(q) === 0 ? 50 : 10;
          results.set(entry.drugId, { ...drug, _score: score });
        }
      }
    }
  }

  return [...results.values()]
    .sort((a, b) => b._score - a._score || b.eventCount - a.eventCount)
    .slice(0, limit);
}

export function getDrug(drugId) {
  loadData();
  return drugIndex.get(drugId) || null;
}

export function getDrugByName(name) {
  loadData();
  const normalized = name.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
  return drugIndex.get(normalized) || null;
}

export function getAutocompleteSuggestions(query, limit = 8) {
  loadData();
  if (!query || query.length < 2) return [];

  const q = query.toLowerCase().trim();
  const seen = new Set();
  const results = [];

  for (const entry of searchIndex) {
    if (entry.text.startsWith(q) && !seen.has(entry.drugId)) {
      seen.add(entry.drugId);
      results.push({
        id: entry.drugId,
        name: entry.drugName,
        brandNames: drugIndex.get(entry.drugId)?.brandNames || [],
      });
      if (results.length >= limit) break;
    }
  }

  if (results.length < limit) {
    for (const entry of searchIndex) {
      if (entry.text.includes(q) && !seen.has(entry.drugId)) {
        seen.add(entry.drugId);
        results.push({
          id: entry.drugId,
          name: entry.drugName,
          brandNames: drugIndex.get(entry.drugId)?.brandNames || [],
        });
        if (results.length >= limit) break;
      }
    }
  }

  return results;
}

export function checkInteractions(drugIds) {
  loadData();
  const normalized = drugIds.map(id => id.toUpperCase().replace(/[^A-Z0-9 ]/g, ''));
  const found = [];

  for (const interaction of interactionsData) {
    if (normalized.includes(interaction.drug1) && normalized.includes(interaction.drug2)) {
      found.push(interaction);
    }
  }

  return found.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
    return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
  });
}

export function getSideEffects(drugId) {
  loadData();
  const drug = drugIndex.get(drugId);
  if (!drug) return null;
  return {
    drugName: drug.drugName,
    sideEffects: drug.sideEffects,
    eventCount: drug.eventCount,
    seriousEventCount: drug.seriousEventCount,
    riskScore: drug.riskScore,
  };
}

export function getHighRiskDrugs(limit = 10) {
  loadData();
  return drugsData
    .filter(d => d.eventCount >= 3)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, limit);
}

export function getStats() {
  loadData();
  return {
    totalDrugs: drugsData.length,
    totalInteractions: interactionsData.length,
    totalEvents: eventsData.length,
    seriousEvents: eventsData.filter(e => e.serious).length,
  };
}

export function getAllDrugs() {
  loadData();
  return drugsData;
}

export function getEvents(limit = 50) {
  loadData();
  return eventsData.slice(0, limit);
}
