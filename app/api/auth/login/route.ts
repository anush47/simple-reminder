import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            console.error('ADMIN_PASSWORD not set in env');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (password === adminPassword) {
            // In a real app, set a secure HTTP-only cookie here using a library like 'cookie' or Next.js 'cookies' helper
            // For simplicity in this scope, we might just return success and let client handle state, 
            // but 'shop friendly' implies validity.
            // We'll set a simple cookie for now.

            const response = NextResponse.json({ success: true });
            response.cookies.set('admin_session', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });
            console.log('Login successful');
            return response;
        } else {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
