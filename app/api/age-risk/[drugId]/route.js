import { NextResponse } from 'next/server';
import { calculateAgeRisk, getAgeRiskProfile, getAgeGroups } from '../../../../lib/data/ageRisk';

export async function GET(request, { params }) {
  const { drugId } = await params;
  const { searchParams } = new URL(request.url);
  const age = searchParams.get('age');
  const profile = searchParams.get('profile') === 'true';

  const normalizedId = decodeURIComponent(drugId).toUpperCase().replace(/[^A-Z0-9 ]/g, '');

  // Return full age-group profile for chart visualization
  if (profile) {
    const ageProfile = getAgeRiskProfile(normalizedId);
    return NextResponse.json({
      drugId: normalizedId,
      ageGroups: getAgeGroups(),
      profile: ageProfile,
    });
  }

  // Return risk analysis for specific age
  if (!age || isNaN(parseFloat(age))) {
    return NextResponse.json(
      { error: 'Missing or invalid age parameter. Provide ?age=<years>' },
      { status: 400 }
    );
  }

  const ageYears = parseFloat(age);
  const result = calculateAgeRisk(normalizedId, ageYears);

  return NextResponse.json({
    ...result,
    disclaimer: 'This analysis is for informational purposes only and does not constitute medical advice. Always consult a healthcare professional.',
  });
}
