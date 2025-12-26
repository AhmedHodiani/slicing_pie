import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 200; // 200 requests per minute per IP (generous for app usage)

function checkRateLimit(ip: string) {
  const now = Date.now();
  const record = rateLimit.get(ip) || { count: 0, lastReset: now };

  if (now - record.lastReset > RATE_LIMIT_WINDOW) {
    record.count = 0;
    record.lastReset = now;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count++;
  rateLimit.set(ip, record);
  return true;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params);
}

async function proxy(request: NextRequest, params: { path: string[] }) {
  // Rate Limit Check
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const pathString = params.path.join('/');
  const searchParams = request.nextUrl.search;
  const targetUrl = `${process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'}/${pathString}${searchParams}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  // Remove content-length to let fetch calculate it, avoiding mismatch errors
  headers.delete('content-length');

  try {
    const body = request.body;

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : body,
      // @ts-ignore - duplex is needed for streaming bodies in some node versions/fetch implementations
      duplex: 'half', 
    });

    const responseHeaders = new Headers(response.headers);
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}
