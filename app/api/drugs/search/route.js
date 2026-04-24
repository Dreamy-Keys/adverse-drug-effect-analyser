import { NextResponse } from 'next/server';
import { searchDrugs, getAutocompleteSuggestions, getStats } from '../../../../lib/data/store';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const autocomplete = searchParams.get('autocomplete') === 'true';
  const limit = parseInt(searchParams.get('limit') || '20');
  const statsOnly = searchParams.get('stats') === 'true';

  if (statsOnly) {
    return NextResponse.json(getStats());
  }

  if (autocomplete) {
    const suggestions = getAutocompleteSuggestions(query, Math.min(limit, 10));
    return NextResponse.json({ suggestions });
  }

  const results = searchDrugs(query, Math.min(limit, 50));
  return NextResponse.json({
    query,
    count: results.length,
    results: results.map(({ _score, ...drug }) => drug),
  });
}
