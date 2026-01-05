import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWarningRule {
    minutes: number; // Minutes remaining
    color: string; // Tailwind class
    flash: boolean;
    flashSpeed?: 'slow' | 'normal' | 'fast';
    flashDuration?: number; // Minutes to keep flashing
    soundUrl?: string;
}

export interface IReminder extends Document {
    title: string;
    description?: string;
    imageUrl?: string;
    targetTime: string; // HH:mm

    // New Recurrence Logic
    recurrenceType: 'none' | 'daily' | 'weekly' | 'monthly';
    weekDays?: number[]; // 0=Sun, 1=Mon...
    monthDays?: number[]; // 1, 15, 31...

    // Legacy support (optional, can migrate later or keep for backward compat)
    days?: string[];
    type?: 'Recurring' | 'OneTime';
    date?: Date;

    // Per-Reminder Warnings
    warningRules?: IWarningRule[];

    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ReminderSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        imageUrl: { type: String },
        targetTime: { type: String, required: true },

        recurrenceType: {
            type: String,
            enum: ['none', 'daily', 'weekly', 'monthly'],
            default: 'daily'
        },
        weekDays: { type: [Number] }, // 0-6
        monthDays: { type: [Number] }, // 1-31

        // Per-Reminder Rules
        warningRules: [{
            minutes: Number,
            color: String,
            flash: Boolean,
            flashSpeed: String,
            flashDuration: { type: Number, default: 5 }, // Default 5 mins
            soundUrl: String
        }],

        // Legacy fields kept for safety during migration
        days: { type: [String] },
        type: { type: String },
        date: { type: Date },

        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Prevent overwriting the model if it's already compiled
// In dev mode, we might need to delete the model to ensure new schema is applied
if (process.env.NODE_ENV === 'development' && mongoose.models.Reminder) {
    delete mongoose.models.Reminder;
}

const Reminder: Model<IReminder> =
    mongoose.models.Reminder ||
    mongoose.model<IReminder>('Reminder', ReminderSchema);

export default Reminder;
