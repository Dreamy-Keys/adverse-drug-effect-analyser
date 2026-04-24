import { NextResponse } from 'next/server';
import { batchAgeRiskAnalysis, getAgeGroups } from '../../../lib/data/ageRisk';

export async function POST(request) {
  try {
    const body = await request.json();
    const { drugIds, age } = body;

    if (!drugIds || !Array.isArray(drugIds) || drugIds.length === 0) {
      return NextResponse.json({ error: 'drugIds array is required' }, { status: 400 });
    }

    if (!age || isNaN(parseFloat(age))) {
      return NextResponse.json({ error: 'Valid age (in years) is required' }, { status: 400 });
    }

    const ageYears = parseFloat(age);
    const results = batchAgeRiskAnalysis(drugIds, ageYears);

    return NextResponse.json({
      age: ageYears,
      ageGroups: getAgeGroups(),
      results,
      highRiskCount: results.filter(r => r.riskLevel === 'high').length,
      disclaimer: 'This analysis is for informational purposes only and does not constitute medical advice.',
    });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
