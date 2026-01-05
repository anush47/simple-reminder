import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { isSiteAuthenticated } from '@/lib/auth-check';

async function checkAuth() {
    if (!(await isSiteAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}

export async function GET() {
    await dbConnect();
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            // Initialize with defaults if not exists
            settings = await Settings.create({
                theme: 'dark',
                flashMode: 'card'
            });
        }
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();
    try {
        const body = await request.json();
        // Use findOneAndUpdate with upsert to maintain single settings document
        const settings = await Settings.findOneAndUpdate({}, body, { new: true, upsert: true });
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
