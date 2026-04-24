import { NextResponse } from 'next/server';
import { authenticateRequest, getAlerts, markAlertRead, dismissAlert } from '../../../lib/db';

export async function GET(request) {
  const user = authenticateRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const alerts = getAlerts(user.id);
  return NextResponse.json({ alerts });
}

export async function PUT(request) {
  const user = authenticateRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { alertId, action } = await request.json();
  if (!alertId) return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });

  if (action === 'dismiss') {
    dismissAlert(alertId, user.id);
    return NextResponse.json({ success: true });
  }

  const alert = markAlertRead(alertId, user.id);
  if (!alert) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  return NextResponse.json({ alert });
}
