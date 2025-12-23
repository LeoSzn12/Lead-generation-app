import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const leads = await prisma.lead.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    });

    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { error: 'No leads found for this job' },
        { status: 404 }
      );
    }

    // Generate CSV
    const headers = [
      'business_name',
      'category',
      'address',
      'city',
      'state',
      'phone',
      'website',
      'emails',
      'possible_owner_names',
      'source',
      'outreach_email_draft',
    ];

    const rows = leads.map((lead) => [
      escapeCsvValue(lead.businessName),
      escapeCsvValue(lead.category),
      escapeCsvValue(lead.address || ''),
      escapeCsvValue(lead.city || ''),
      escapeCsvValue(lead.state || ''),
      escapeCsvValue(lead.phone || ''),
      escapeCsvValue(lead.website || ''),
      escapeCsvValue(lead.emails?.join('; ') || ''),
      escapeCsvValue(lead.possibleOwnerNames?.join('; ') || ''),
      escapeCsvValue(lead.source),
      escapeCsvValue(lead.outreachEmailDraft),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads-${jobId}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to export CSV' },
      { status: 500 }
    );
  }
}

function escapeCsvValue(value: string): string {
  if (!value) return '""';
  
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  const escaped = value.replace(/"/g, '""');
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
    return `"${escaped}"`;
  }
  return `"${escaped}"`;
}
