'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { ISettings } from '@/models/Settings';
import Link from 'next/link';

export default function SettingsPage() {
    const [settings, setSettings] = useState<ISettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/settings')
            .then((res) => res.json())
            .then((data) => {
                setSettings(data);
                setLoading(false);
            });
    }, []);

    const saveSettings = async () => {
        if (!settings) return;
        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });
        if (res.ok) {
            alert('Settings saved!');
        } else {
            alert('Failed to save settings');
        }
    };

    if (loading) return <div className="p-8 text-foreground">Loading...</div>;
    if (!settings) return <div className="p-8 text-destructive">Error loading settings</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-screen bg-background text-foreground transition-colors duration-300">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Display Settings</h1>
                <div className="space-x-4">
                    <Link href="/admin/dashboard">
                        <Button variant="outline">
                            Back to Dashboard
                        </Button>
                    </Link>
                    <Button onClick={saveSettings}>
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <Label>Theme</Label>
                            <Select
                                value={settings.theme || 'dark'}
                                onValueChange={(v) => setSettings({ ...settings, theme: v } as any)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground">This setting updates the theme for all displays globally.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
