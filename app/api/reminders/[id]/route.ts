import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Reminder from '@/models/Reminder';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Expect params to be a Promise
) {
    await dbConnect();
    const { id } = await params; // Await the params
    try {
        const body = await request.json();
        const reminder = await Reminder.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });
        if (!reminder) {
            return NextResponse.json(
                { error: 'Reminder not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(reminder);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update reminder' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Expect params to be a Promise
) {
    await dbConnect();
    const { id } = await params; // Await the params
    try {
        const reminder = await Reminder.findByIdAndDelete(id);
        if (!reminder) {
            return NextResponse.json(
                { error: 'Reminder not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ message: 'Reminder deleted' });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete reminder' },
            { status: 500 }
        );
    }
}
