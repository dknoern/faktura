import { NextResponse } from 'next/server';
import { getShortUser } from '@/lib/auth-utils';

export async function GET() {
  try {
    const username = await getShortUser();
    
    return NextResponse.json({ username });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    );
  }
}
