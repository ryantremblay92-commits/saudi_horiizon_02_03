import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Auth is handled entirely via localStorage on the client side.
    // Each page checks localStorage for 'accessToken' and redirects if missing.
    // Middleware simply passes all requests through.
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/login',
        '/register',
        '/account/:path*'
    ]
};