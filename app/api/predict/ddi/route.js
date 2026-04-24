import { NextResponse } from 'next/server';
import { predictDDI } from '../../../../lib/ml';

export async function POST(req) {
  try {
    const body = await req.json();
    const { drug1, drug2 } = body;

    if (!drug1 || !drug2) {
      return NextResponse.json({ error: "Missing drug1 or drug2" }, { status: 400 });
    }

    // Run the DDI prediction
    const prediction = predictDDI(drug1, drug2);

    return NextResponse.json(prediction);
  } catch (error) {
    return NextResponse.json({ error: "Server error during DDI prediction" }, { status: 500 });
  }
}
