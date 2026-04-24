import { NextResponse } from 'next/server';
import { getDrug, getSideEffects } from '../../../../lib/data/store';

export async function GET(request, { params }) {
  const { name } = await params;
  const drugId = decodeURIComponent(name).toUpperCase().replace(/[^A-Z0-9 ]/g, '');

  const drug = getDrug(drugId);
  if (!drug) {
    return NextResponse.json({ error: 'Drug not found' }, { status: 404 });
  }

  const sideEffectData = getSideEffects(drugId);

  return NextResponse.json({
    ...drug,
    sideEffectAnalysis: sideEffectData,
  });
}
