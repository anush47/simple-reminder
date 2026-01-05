import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';

export async function GET() {
    await dbConnect();
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            // Initialize with defaults if not exists
            settings = await Settings.create({
                theme: 'dark',
                warningLevels: [
                    {
                        id: '1',
                        minutes: 120,
                        color: 'border-blue-500/50 bg-slate-900/50 text-blue-400',
                        label: 'Upcoming',
                        flash: false
                    },
                    {
                        id: '2',
                        minutes: 60,
                        color: 'border-orange-500/50 bg-orange-900/20 text-orange-400',
                        label: 'Warning',
                        flash: true,
                        flashSpeed: 'slow'
                    },
                    {
                        id: '3',
                        minutes: 0,
                        color: 'border-red-500 bg-red-900/40 text-red-100',
                        label: 'Urgent',
                        flash: true,
                        flashSpeed: 'fast',
                        soundUrl: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'
                    },
                ]
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
