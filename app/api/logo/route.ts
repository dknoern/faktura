import { NextResponse } from 'next/server';
import { fetchDefaultTenant } from '@/lib/data';

export async function GET() {
  try {
    const tenant = await fetchDefaultTenant();
    
    if (!tenant || !tenant.logo) {
      return new Response('Logo not found', { status: 404 });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(tenant.logo, 'base64');
    
    // Return the image with appropriate headers
    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving logo:', error);
    return NextResponse.json({ error: 'Failed to serve logo' }, { status: 500 });
  }
}
