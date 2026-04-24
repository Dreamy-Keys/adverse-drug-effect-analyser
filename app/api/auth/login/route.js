import { NextResponse } from 'next/server';
import { getUserByEmail, comparePassword, generateToken } from '../../../../lib/db';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!comparePassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name });
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, allergies: user.allergies },
      token,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
