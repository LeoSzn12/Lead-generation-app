import { NextRequest, NextResponse } from 'next/server';
import { recordOpen, recordClick, getTrackingPixel } from '@/lib/email-tracker';

/**
 * GET /api/track/[trackingId]/open - Tracking pixel (records email open)
 * Returns a 1x1 transparent GIF
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  // Record the open event (non-blocking)
  recordOpen(params.trackingId).catch(console.error);

  // Check if this is a click redirect
  const url = req.nextUrl.searchParams.get('url');
  if (url) {
    // Record click event
    recordClick(params.trackingId).catch(console.error);
    
    // Redirect to the original URL
    return NextResponse.redirect(decodeURIComponent(url));
  }

  // Return tracking pixel
  const pixel = getTrackingPixel();

  return new NextResponse(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
