import { NextRequest, NextResponse } from 'next/server';
import { recordUnsubscribe } from '@/lib/email-tracker';

/**
 * GET /api/unsubscribe/[trackingId] - Show unsubscribe confirmation page
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unsubscribe</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex; justify-content: center; align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #e2e8f0;
        }
        .card {
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 16px;
          padding: 48px;
          max-width: 480px;
          width: 90%;
          text-align: center;
          box-shadow: 0 25px 50px rgba(0,0,0,0.4);
        }
        .icon { font-size: 48px; margin-bottom: 16px; }
        h1 { font-size: 24px; margin-bottom: 12px; color: #f1f5f9; }
        p { color: #94a3b8; margin-bottom: 24px; line-height: 1.6; }
        .btn {
          display: inline-block; padding: 12px 32px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white; border: none; border-radius: 8px;
          font-size: 16px; font-weight: 600; cursor: pointer;
          text-decoration: none; transition: all 0.2s;
        }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239,68,68,0.4); }
        .btn-secondary {
          display: inline-block; margin-top: 12px;
          color: #64748b; text-decoration: underline; font-size: 14px;
        }
        .success { display: none; }
        .success.show { display: block; }
        .form.hide { display: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="form" id="form">
          <div class="icon">📧</div>
          <h1>Unsubscribe</h1>
          <p>We're sorry to see you go. Click below to unsubscribe from future emails.</p>
          <button class="btn" onclick="doUnsubscribe()">Unsubscribe</button>
          <br>
          <a href="javascript:window.close()" class="btn-secondary">Cancel</a>
        </div>
        <div class="success" id="success">
          <div class="icon">✅</div>
          <h1>Unsubscribed</h1>
          <p>You have been successfully unsubscribed. You will no longer receive emails from this campaign.</p>
        </div>
      </div>
      <script>
        async function doUnsubscribe() {
          try {
            const response = await fetch('/api/unsubscribe/${params.trackingId}', { method: 'POST' });
            if (response.ok) {
              document.getElementById('form').classList.add('hide');
              document.getElementById('success').classList.add('show');
            } else {
              alert('Something went wrong. Please try again.');
            }
          } catch (e) {
            alert('Something went wrong. Please try again.');
          }
        }
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

/**
 * POST /api/unsubscribe/[trackingId] - Process unsubscribe
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  const result = await recordUnsubscribe(params.trackingId);

  if (result.success) {
    return NextResponse.json({
      message: 'Successfully unsubscribed',
      email: result.email,
    });
  } else {
    return NextResponse.json(
      { error: 'Failed to process unsubscribe' },
      { status: 400 }
    );
  }
}
