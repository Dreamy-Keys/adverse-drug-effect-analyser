import { NextResponse } from 'next/server';
import { createUser, generateToken } from '../../../../lib/db';

export async function POST(request) {
  try {
    const { name, email, password, allergies } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const user = createUser({ name, email, password, allergies: allergies || [] });
    const token = generateToken(user);

    return NextResponse.json({ user, token }, { status: 201 });
  } catch (err) {
    if (err.message === 'Email already registered') {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
