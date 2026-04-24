import { NextResponse } from 'next/server';
import { authenticateRequest, getUserById, getUsers } from '../../../../lib/db';
import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'data', 'db');
const USERS_FILE = path.join(DB_DIR, 'users.json');

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
  const users = getUsers();
  const idx = users.findIndex(u => u.id === decoded.id);
  if (idx === -1) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Update allowed fields
  if (body.age !== undefined) users[idx].age = parseFloat(body.age) || null;
  if (body.dateOfBirth !== undefined) users[idx].dateOfBirth = body.dateOfBirth;
  if (body.name !== undefined) users[idx].name = body.name;
  if (body.allergies !== undefined) users[idx].allergies = body.allergies;

  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  return NextResponse.json({
    id: users[idx].id,
    name: users[idx].name,
    email: users[idx].email,
    age: users[idx].age,
    dateOfBirth: users[idx].dateOfBirth,
    allergies: users[idx].allergies,
  });
}
