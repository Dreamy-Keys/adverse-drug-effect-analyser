import { NextResponse } from 'next/server';
import { predictRisk } from '../../../lib/ml';

export async function POST(req) {
  try {
    const body = await req.json();
    const { drug } = body;

    if (!drug) {
      return NextResponse.json({ error: "Missing drug" }, { status: 400 });
    }

    // Run the prediction
    const prediction = predictRisk(drug);

    return NextResponse.json(prediction);
  } catch (error) {
    return NextResponse.json({ error: "Server error during prediction" }, { status: 500 });
  }
}
