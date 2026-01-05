'use client';

import { useState, useEffect } from 'react';
import { IReminder, IWarningRule } from '@/models/Reminder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils'; // Ensure you have this utility or use clsx/twMerge directly

interface ReminderFormProps {
    initialData?: IReminder;
    onSubmit: (data: Partial<IReminder>) => Promise<void>;
    onCancel: () => void;
}

const COLOR_PRESETS = [
    { name: 'Red (Critical)', value: 'bg-red-950/90 border-red-500 text-red-500', preview: 'bg-red-950 border-red-500' },
    { name: 'Orange (Warning)', value: 'bg-orange-950/90 border-orange-500 text-orange-500', preview: 'bg-orange-950 border-orange-500' },
    { name: 'Yellow (Caution)', value: 'bg-yellow-950/90 border-yellow-500 text-yellow-500', preview: 'bg-yellow-950 border-yellow-500' },
    { name: 'Blue (Info)', value: 'bg-blue-950/90 border-blue-500 text-blue-500', preview: 'bg-blue-950 border-blue-500' },
    { name: 'Green (Safe)', value: 'bg-green-950/90 border-green-500 text-green-500', preview: 'bg-green-950 border-green-500' },
    { name: 'Neutral (Default)', value: 'bg-slate-900 border-slate-700 text-slate-300', preview: 'bg-slate-900 border-slate-700' },
];

export default function ReminderForm({ initialData, onSubmit, onCancel }: ReminderFormProps) {
    const [formData, setFormData] = useState<Partial<IReminder>>({
        title: '',
        description: '',
        imageUrl: '',
        targetTime: '12:00',
        recurrenceType: 'daily',
        weekDays: [],
        monthDays: [],
        warningRules: [
            { minutes: 30, color: 'bg-yellow-950/90 border-yellow-500 text-yellow-500', flash: false, flashSpeed: 'normal' },
            { minutes: 10, color: 'bg-orange-950/90 border-orange-500 text-orange-500', flash: false, flashSpeed: 'normal' },
            { minutes: 0, color: 'bg-red-950/90 border-red-500 text-red-500', flash: true, flashSpeed: 'fast' }
        ],
        active: true,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                weekDays: initialData.weekDays || [],
                monthDays: initialData.monthDays || [],
                warningRules: initialData.warningRules || []
            });
        }
    }, [initialData]);

    const handleChange = (field: keyof IReminder, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleWeekDay = (day: number) => {
        const current = formData.weekDays || [];
        const updated = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day].sort((a, b) => a - b);
        handleChange('weekDays', updated);
    };

    const toggleMonthDay = (day: number) => {
        const current = formData.monthDays || [];
        const updated = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day].sort((a, b) => a - b);
        handleChange('monthDays', updated);
    };

    const addRule = () => {
        const newRule: IWarningRule = {
            minutes: 10,
            color: COLOR_PRESETS[0].value, // Default to Red
            flash: false,
            flashSpeed: 'normal'
        };
        handleChange('warningRules', [...(formData.warningRules || []), newRule]);
    };

    const updateRule = (index: number, field: keyof IWarningRule, value: any) => {
        const rules = [...(formData.warningRules || [])];
        rules[index] = { ...rules[index], [field]: value };
        handleChange('warningRules', rules);
    };

    const removeRule = (index: number) => {
        const rules = [...(formData.warningRules || [])];
        rules.splice(index, 1);
        handleChange('warningRules', rules);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="warnings">Warnings</TabsTrigger>
                </TabsList>

                {/* --- GENERAL TABS --- */}
                <TabsContent value="general" className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Title</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            required
                            placeholder="e.g. Clean Oven"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Target Time</Label>
                        <Input
                            type="time"
                            value={formData.targetTime}
                            onChange={(e) => handleChange('targetTime', e.target.value)}
                            required
                            className="text-lg font-mono"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Optional details..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Image URL (Optional)</Label>
                        <Input
                            value={formData.imageUrl}
                            onChange={(e) => handleChange('imageUrl', e.target.value)}
                            placeholder="https://..."
                        />
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Switch
                            checked={formData.active}
                            onCheckedChange={(c) => handleChange('active', c)}
                        />
                        <Label>Active</Label>
                    </div>
                </TabsContent>

                {/* --- SCHEDULE TABS --- */}
                <TabsContent value="schedule" className="space-y-6 py-4">
                    <div className="grid gap-2">
                        <Label>Recurrence Pattern</Label>
                        <Select
                            value={formData.recurrenceType}
                            onValueChange={(v) => handleChange('recurrenceType', v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="none">One Time (Today Only)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.recurrenceType === 'weekly' && (
                        <div className="space-y-3">
                            <Label>Select Days</Label>
                            <div className="flex flex-wrap gap-2">
                                {weekDays.map((day, idx) => (
                                    <Button
                                        key={day}
                                        type="button"
                                        variant={formData.weekDays?.includes(idx) ? 'default' : 'outline'}
                                        onClick={() => toggleWeekDay(idx)}
                                        className={cn(
                                            "w-12 h-12 rounded-full transition-all",
                                            formData.weekDays?.includes(idx)
                                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        )}
                                    >
                                        {day.charAt(0)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {formData.recurrenceType === 'monthly' && (
                        <div className="space-y-3">
                            <Label>Select Dates</Label>
                            <div className="grid grid-cols-7 gap-2">
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                                    <Button
                                        key={date}
                                        type="button"
                                        variant={formData.monthDays?.includes(date) ? 'default' : 'outline'}
                                        onClick={() => toggleMonthDay(date)}
                                        className={cn(
                                            "h-9 w-full p-0 text-sm",
                                            formData.monthDays?.includes(date) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        {date}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {formData.recurrenceType === 'daily' && (
                        <div className="p-4 bg-muted/50 rounded-lg text-sm text-foreground/70 flex items-center border border-border/50">
                            <Calendar className="mr-2 h-4 w-4" />
                            Reminder will trigger every day at {formData.targetTime}.
                        </div>
                    )}
                </TabsContent>

                {/* --- WARNINGS TABS --- */}
                <TabsContent value="warnings" className="space-y-4 py-4">
                    <div className="flex justify-between items-center">
                        <Label>Warning Thresholds</Label>
                        <Button type="button" size="sm" onClick={addRule} variant="secondary">
                            <Plus className="h-4 w-4 mr-1" /> Add Rule
                        </Button>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {formData.warningRules?.map((rule, idx) => (
                            <Card key={idx} className="bg-card border-border">
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <Label className="text-xs uppercase text-muted-foreground">Trigger</Label>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm">Start</span>
                                                <Input
                                                    type="number"
                                                    value={rule.minutes}
                                                    onChange={(e) => updateRule(idx, 'minutes', parseInt(e.target.value))}
                                                    className="w-20 h-8"
                                                />
                                                <span className="text-sm">mins before due</span>
                                            </div>
                                        </div>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeRule(idx)} className="text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="text-xs uppercase text-muted-foreground">Style</Label>
                                        <div className="flex gap-2 flex-wrap">
                                            {COLOR_PRESETS.map((preset) => (
                                                <button
                                                    key={preset.name}
                                                    type="button"
                                                    onClick={() => updateRule(idx, 'color', preset.value)}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                                                        preset.preview, // Use preview classes for background
                                                        rule.color === preset.value ? "ring-2 ring-offset-2 ring-primary border-transparent" : "border-transparent opacity-70 hover:opacity-100"
                                                    )}
                                                    title={preset.name}
                                                />
                                            ))}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Selected: {COLOR_PRESETS.find(p => p.value === rule.color)?.name || 'Custom'}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    checked={rule.flash}
                                                    onCheckedChange={(c) => updateRule(idx, 'flash', c)}
                                                />
                                                <Label className="text-sm">Flash</Label>
                                            </div>

                                            {rule.flash && (
                                                <>
                                                    <Select
                                                        value={rule.flashSpeed || 'normal'}
                                                        onValueChange={(v) => updateRule(idx, 'flashSpeed', v)}
                                                    >
                                                        <SelectTrigger className="w-[90px] h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="slow">Slow</SelectItem>
                                                            <SelectItem value="normal">Normal</SelectItem>
                                                            <SelectItem value="fast">Fast</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <div className="flex items-center space-x-1">
                                                        <Input
                                                            type="number"
                                                            value={rule.flashDuration ?? 5}
                                                            onChange={(e) => updateRule(idx, 'flashDuration', parseInt(e.target.value))}
                                                            className="w-14 h-8 text-xs"
                                                            title="Duration in minutes"
                                                        />
                                                        <span className="text-[10px] text-muted-foreground">min</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="w-1/2">
                                            <Input
                                                value={rule.soundUrl || ''}
                                                onChange={(e) => updateRule(idx, 'soundUrl', e.target.value)}
                                                placeholder="Sound URL (Optional)"
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur z-10 p-2 -mx-2 -mb-2 rounded-b-lg">
                <Button variant="outline" type="button" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">Save Reminder</Button>
            </div>
        </form>
    );
}
