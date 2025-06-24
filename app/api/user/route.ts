import { NextResponse } from 'next/server';
import { getShortUserFromToken } from '@/lib/auth-utils';

export async function GET() {
  try {
    const username = await getShortUserFromToken();
    
    return NextResponse.json({ username });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    );
  }
}
