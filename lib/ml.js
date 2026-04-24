import AdmZip from 'adm-zip';
import path from 'path';

export function predictRisk(targetDrug) {
  try {
    const zipPath = path.join(process.cwd(), 'drug-event-0033-of-0033.json.zip');
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    if (zipEntries.length === 0) throw new Error("Zip file is empty");

    const rawData = zipEntries[0].getData().toString('utf8');
    const data = JSON.parse(rawData);
    const results = data.results || [];

    let pediatricTotal = 0;
    let adultTotal = 0;
    const pediatricReactions = {};
    const adultReactions = {};

    results.forEach(report => {
      const patient = report.patient;
      if (!patient || !patient.drug || !patient.reaction) return;

      let age = parseInt(patient.patientonsetage, 10);
      if (isNaN(age)) return;

      const isPediatric = age < 18;

      const hasDrug = patient.drug.some(d =>
        d.medicinalproduct && d.medicinalproduct.toUpperCase().includes(targetDrug.toUpperCase())
      );

      if (hasDrug) {
        if (isPediatric) {
          pediatricTotal++;
          patient.reaction.forEach(r => {
            const rx = r.reactionmeddrapt;
            if (rx) pediatricReactions[rx] = (pediatricReactions[rx] || 0) + 1;
          });
        } else {
          adultTotal++;
          patient.reaction.forEach(r => {
            const rx = r.reactionmeddrapt;
            if (rx) adultReactions[rx] = (adultReactions[rx] || 0) + 1;
          });
        }
      }
    });

    // If no data at all
    if (pediatricTotal === 0 && adultTotal === 0) {
      return { status: "no_data", message: `No historical data found for ${targetDrug}.` };
    }

    if (pediatricTotal === 0) {
      return { status: "no_pediatric", message: `No pediatric cases found for ${targetDrug} to compare against.` };
    }

    // Convert to probabilities
    const getProbabilities = (counts, total) => {
      if (total === 0) return {};
      const probs = {};
      Object.keys(counts).forEach(rx => {
        probs[rx] = (counts[rx] / total) * 100;
      });
      return probs;
    };

    const pProbs = getProbabilities(pediatricReactions, pediatricTotal);
    const aProbs = getProbabilities(adultReactions, adultTotal);

    const comparativeRisks = [];

    // Compare all reactions found in kids
    Object.keys(pProbs).forEach(rx => {
      const pRisk = pProbs[rx];
      const aRisk = aProbs[rx] || 0; // Actual adult risk

      let multiplierLabel = "";
      let multiplierValue = 0;
      let isHigher = false;

      if (aRisk === 0) {
        multiplierValue = 999;
        multiplierLabel = "Unique to Kids";
        isHigher = true;
      } else {
        multiplierValue = pRisk / aRisk;
        if (multiplierValue > 1.2) {
          isHigher = true;
          multiplierLabel = `${multiplierValue > 10 ? '>10' : multiplierValue.toFixed(1)}x Higher`;
        } else if (multiplierValue < 0.8) {
          multiplierLabel = "Lower in Kids";
        } else {
          multiplierLabel = "Similar Risk";
        }
      }

      comparativeRisks.push({
        reaction: rx,
        pediatricRisk: pRisk.toFixed(1),
        adultRisk: aRisk.toFixed(1),
        multiplier: multiplierValue,
        multiplierLabel: multiplierLabel,
        isHigherInKids: isHigher
      });
    });

    // Sort by highest multiplier (most uniquely dangerous to kids)
    comparativeRisks.sort((a, b) => b.multiplier - a.multiplier);

    return {
      status: "success",
      pediatricTotal,
      adultTotal,
      comparativeRisks: comparativeRisks.slice(0, 5) // Top 5 differences
    };

  } catch (error) {
    console.error("ML Error:", error);
    return { status: "error", error: "Failed to run prediction model." };
  }
}

// ── ML Model 2: Predictive Drug-Drug Interaction (DDI) ──
// Uses Profile Similarity to predict compounded interactions between two drugs.
export function predictDDI(drug1, drug2) {
  try {
    const zipPath = path.join(process.cwd(), 'drug-event-0033-of-0033.json.zip');
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    if (zipEntries.length === 0) throw new Error("Zip file is empty");
    
    const rawData = zipEntries[0].getData().toString('utf8');
    const data = JSON.parse(rawData);
    const results = data.results || [];
    
    let d1Count = 0;
    let d2Count = 0;
    let coOccurCount = 0;
    
    const d1Reactions = {};
    const d2Reactions = {};

    results.forEach(report => {
      const patient = report.patient;
      if (!patient || !patient.drug || !patient.reaction) return;

      const hasD1 = patient.drug.some(d => d.medicinalproduct && d.medicinalproduct.toUpperCase().includes(drug1.toUpperCase()));
      const hasD2 = patient.drug.some(d => d.medicinalproduct && d.medicinalproduct.toUpperCase().includes(drug2.toUpperCase()));

      if (hasD1) {
        d1Count++;
        patient.reaction.forEach(r => {
          if (r.reactionmeddrapt) d1Reactions[r.reactionmeddrapt] = (d1Reactions[r.reactionmeddrapt] || 0) + 1;
        });
      }
      
      if (hasD2) {
        d2Count++;
        patient.reaction.forEach(r => {
          if (r.reactionmeddrapt) d2Reactions[r.reactionmeddrapt] = (d2Reactions[r.reactionmeddrapt] || 0) + 1;
        });
      }

      if (hasD1 && hasD2) coOccurCount++;
    });

    if (d1Count === 0 || d2Count === 0) {
      return { status: "no_data", message: "Insufficient historical data to model interaction." };
    }

    // Find Compound Risks (Intersection of side effects)
    const compoundedRisks = [];
    let sharedReactions = 0;

    Object.keys(d1Reactions).forEach(rx => {
      if (d2Reactions[rx]) {
        sharedReactions++;
        // Calculate a "Compound Severity Score" based on how common it is in both
        const score = (d1Reactions[rx] / d1Count) * (d2Reactions[rx] / d2Count) * 10000;
        if (score > 1) {
            compoundedRisks.push({
                reaction: rx,
                score: score,
                d1Freq: ((d1Reactions[rx]/d1Count)*100).toFixed(1),
                d2Freq: ((d2Reactions[rx]/d2Count)*100).toFixed(1)
            });
        }
      }
    });

    compoundedRisks.sort((a, b) => b.score - a.score);
    
    // ML Prediction Logic
    let predictedSeverity = "low";
    if (coOccurCount > 5 || compoundedRisks.length > 20) predictedSeverity = "high";
    else if (coOccurCount > 1 || compoundedRisks.length > 5) predictedSeverity = "moderate";

    return {
      status: "success",
      predictedSeverity,
      coOccurrenceInWild: coOccurCount,
      topCompoundedRisks: compoundedRisks.slice(0, 5),
      message: `AI predicts a ${predictedSeverity} interaction risk based on ${sharedReactions} shared adverse effect pathways.`
    };

  } catch (error) {
    console.error("DDI ML Error:", error);
    return { status: "error", error: "Failed to run DDI prediction model." };
  }
}
