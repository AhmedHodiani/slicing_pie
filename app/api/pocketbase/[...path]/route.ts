import { NextRequest, NextResponse } from 'next/server';

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
