import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWarningLevel {
    id: string;
    minutes: number;
    color: string; // Tailwind classes or standard color definition
    soundUrl?: string;
    label: string;
    flash: boolean;
    flashSpeed?: 'slow' | 'normal' | 'fast';
}

export interface ISettings extends Document {
    theme: 'light' | 'dark' | 'system';
    warningLevels: IWarningLevel[];
}

const SettingsSchema: Schema = new Schema({
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    warningLevels: [{
        id: { type: String, required: true },
        minutes: { type: Number, required: true },
        color: { type: String, required: true },
        soundUrl: { type: String },
        label: { type: String, required: true },
        flash: { type: Boolean, default: false },
        flashSpeed: { type: String, enum: ['slow', 'normal', 'fast'], default: 'normal' }
    }]
}, { timestamps: true });

const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
export default Settings;
