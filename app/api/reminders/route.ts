import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Reminder from '@/models/Reminder';
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
        const reminders = await Reminder.find({ active: true }).sort({
            targetTime: 1,
        });
        return NextResponse.json(reminders);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch reminders' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    await dbConnect();
    try {
        const body = await request.json();
        const reminder = await Reminder.create(body);
        return NextResponse.json(reminder, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create reminder' },
            { status: 500 }
        );
    }
}
