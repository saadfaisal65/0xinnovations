import { NextResponse } from 'next/server';

export function checkBackendAuth(request: Request) {
    const authHeader = request.headers.get('Authorization');
    const secret = process.env.ADMIN_API_SECRET;
    
    if (!secret) {
        // If the owner hasn't configured it, we allow pass-through to prevent breaking existing functionality,
        // but it is highly recommended to set this variable immediately.
        console.warn("\x1b[33m[SECURITY WARNING] ADMIN_API_SECRET is not set in .env.local. API endpoints are currently unsecured!\x1b[0m");
        return true; 
    }
    
    if (!authHeader || authHeader !== `Bearer ${secret}`) {
        return false;
    }
    
    return true;
}
