import { NextResponse } from 'next/server';
import { authenticateRequest, getMedications, addMedication, updateMedication, deleteMedication, logAdherence } from '../../../lib/db';

export async function GET(request) {
  const user = authenticateRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const medications = getMedications(user.id);
  return NextResponse.json({ medications });
}

export async function POST(request) {
  const user = authenticateRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  if (body.action === 'log') {
    const result = logAdherence(body.medId, user.id, body.date, body.taken);
    if (!result) return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    return NextResponse.json({ medication: result });
  }

  if (!body.drugName) {
    return NextResponse.json({ error: 'Drug name is required' }, { status: 400 });
  }

  const med = addMedication({ userId: user.id, ...body });
  return NextResponse.json({ medication: med }, { status: 201 });
}

export async function PUT(request) {
  const user = authenticateRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = updateMedication(body.id, user.id, body);
  if (!result) return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
  return NextResponse.json({ medication: result });
}

export async function DELETE(request) {
  const user = authenticateRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const medId = searchParams.get('id');
  if (!medId) return NextResponse.json({ error: 'Medication ID required' }, { status: 400 });

  const deleted = deleteMedication(medId, user.id);
  if (!deleted) return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
