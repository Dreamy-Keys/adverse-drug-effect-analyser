import { NextResponse } from 'next/server';
import { checkInteractions, getDrug } from '../../../../lib/data/store';

export async function POST(request) {
  try {
    const { drugs } = await request.json();

    if (!drugs || !Array.isArray(drugs) || drugs.length < 2) {
      return NextResponse.json({ error: 'At least 2 drugs are required' }, { status: 400 });
    }

    if (drugs.length > 30) {
      return NextResponse.json({ error: 'Maximum 30 drugs allowed' }, { status: 400 });
    }

    const normalizedDrugs = drugs.map(d => d.toUpperCase().replace(/[^A-Z0-9 ]/g, ''));
    const interactions = checkInteractions(normalizedDrugs);

    const drugDetails = normalizedDrugs.map(id => {
      const drug = getDrug(id);
      return drug ? { id: drug.id, name: drug.drugName, brandNames: drug.brandNames } : { id, name: id, brandNames: [] };
    });

    const overallRisk = interactions.length === 0
      ? 'none'
      : interactions.some(i => i.severity === 'critical')
        ? 'critical'
        : interactions.some(i => i.severity === 'high')
          ? 'high'
          : interactions.some(i => i.severity === 'moderate')
            ? 'moderate'
            : 'low';

    return NextResponse.json({
      drugsChecked: drugDetails,
      interactionCount: interactions.length,
      overallRisk,
      interactions,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Interaction check failed' }, { status: 500 });
  }
}
