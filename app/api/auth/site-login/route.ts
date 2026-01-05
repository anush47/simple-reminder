import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();
        const sitePassword = process.env.SITE_PASSWORD;

        if (!sitePassword) {
            return NextResponse.json({ error: 'Site configuration error' }, { status: 500 });
        }

        if (password === sitePassword) {
            const response = NextResponse.json({ success: true });
            response.cookies.set('site_auth', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                sameSite: 'lax'
            });
            return response;
        } else {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
