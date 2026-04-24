import { NextResponse } from 'next/server';
import { authenticateRequest, getUserById, updateUser } from '../../../../lib/db';

export async function GET(request) {
  const decoded = authenticateRequest(request);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = getUserById(decoded.id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    age: user.age || null,
    dateOfBirth: user.dateOfBirth || null,
    allergies: user.allergies || [],
  });
}

export async function PUT(request) {
  const decoded = authenticateRequest(request);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const updatedUser = updateUser(decoded.id, body);
  
  if (!updatedUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    age: updatedUser.age,
    dateOfBirth: updatedUser.dateOfBirth,
    allergies: updatedUser.allergies,
  });
}
