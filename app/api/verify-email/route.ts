import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail, verifyEmailBatch } from '@/lib/email-verification-free';

export async function POST(req: NextRequest) {
  try {
    const { email, emails } = await req.json();

    if (email) {
      // Single email verification
      const result = await verifyEmail(email);
      return NextResponse.json(result);
    } else if (emails && Array.isArray(emails)) {
      // Batch verification
      const results = await verifyEmailBatch(emails);
      return NextResponse.json(results);
    } else {
      return NextResponse.json(
        { error: 'Please provide either "email" or "emails" array' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to verify email' },
      { status: 500 }
    );
  }
}
