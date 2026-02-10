import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const VAPI_BASE_URL = 'https://api.vapi.ai';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId, phoneNumber } = await req.json();

    if (!leadId || !phoneNumber) {
      return NextResponse.json({ error: 'Missing leadId or phoneNumber' }, { status: 400 });
    }

    // specific Vapi Phone Number ID (optional, but good if you have one bought in Vapi)
    // For now we'll assume the user has configured a default assistant or we use a specific one
    const vapiPublicKey = process.env.VAPI_PUBLIC_KEY;
    const vapiPrivateKey = process.env.VAPI_PRIVATE_KEY;
    // You might want to store a specific assistant ID in env or DB
    const assistantId = process.env.VAPI_ASSISTANT_ID; 

    if (!vapiPrivateKey || !assistantId) {
      return NextResponse.json({ error: 'Vapi not configured (Missing Keys/Assistant ID)' }, { status: 500 });
    }

    console.log(`Initiating Vapi call to ${phoneNumber} for lead ${leadId}...`);

    // 1. Trigger Call via Vapi API
    const response = await fetch(`${VAPI_BASE_URL}/call/phone`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiPrivateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: {
            identifier: phoneNumber // The number to call
        },
        assistantId: assistantId,
        // Optional: Pass custom data to the assistant
        assistantOverrides: {
            variableValues: {
                leadId: leadId,
                userId: user.id
            }
        }
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Vapi Call Error:', errorText);
        return NextResponse.json({ error: `Vapi Error: ${response.statusText}`, details: errorText }, { status: 500 });
    }

    const data = await response.json();
    const callId = data.id;

    // 2. Log Activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        leadId: leadId,
        type: 'call_made',
        content: 'Initiated AI Phone Call',
        vapiCallId: callId,
        metadata: JSON.stringify({ provider: 'vapi', status: 'initiated', phone: phoneNumber })
      }
    });

    // 3. Update Lead Status (optional)
    await prisma.lead.update({
        where: { id: leadId },
        data: { 
            isContacted: true, 
            status: 'contacted',
            lastActivityAt: new Date()
        }
    });

    return NextResponse.json({ success: true, callId, status: 'initiated' });

  } catch (error: any) {
    console.error('Call endpoint error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
