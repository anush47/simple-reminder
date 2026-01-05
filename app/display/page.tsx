'use client';

import { useEffect, useState, useMemo } from 'react';
import { IReminder, IWarningRule } from '@/models/Reminder';
import { ISettings } from '@/models/Settings';
import { format, parse, differenceInMinutes, getDay, getDate } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertTriangle, Bell, Clock } from 'lucide-react';
import { ThemeWatcher } from '@/components/theme-watcher';

// Utility
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Extended types
type ReminderWithStatus = IReminder & {
    activeRule?: IWarningRule;
    minutesUntil: number;
};

export default function DisplayPage() {
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [reminders, setReminders] = useState<IReminder[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                const remRes = await fetch('/api/reminders');
                if (remRes.ok) setReminders(await remRes.json());
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Refresh every minute to ensure fresh data and rules
        const interval = setInterval(fetchData, 1000 * 60);
        return () => clearInterval(interval);
    }, []);

    // Clock
    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Process Reminders
    const processedReminders = useMemo(() => {
        if (!reminders.length) return [];

        const now = currentTime;
        const currentDayOfWk = getDay(now); // 0-6
        const currentDate = getDate(now); // 1-31

        // Filter functionality
        const activeReminders = reminders.filter(r => {
            if (!r.active) return false;

            // New Recurrence Logic
            if (r.recurrenceType === 'daily') return true;
            if (r.recurrenceType === 'weekly') {
                return r.weekDays?.includes(currentDayOfWk);
            }
            if (r.recurrenceType === 'monthly') {
                return r.monthDays?.includes(currentDate);
            }
            if (r.recurrenceType === 'none') {
                // Check if created today or specific logic? 
                // For "One Time" usually means "Today" if user created it for a time.
                // Or we can check if it matches legacy date.
                // For simplicity in this app, "One Time" often implies "Run today at this time".
                return true;
            }

            // Legacy Fallback
            if (r.type === 'Recurring' && r.days) {
                const dayName = format(now, 'EEE');
                return r.days.includes('Daily') || r.days.includes(dayName);
            }

            return false;
        });

        return activeReminders.map(r => {
            const target = parse(r.targetTime, 'HH:mm', now);
            const diff = differenceInMinutes(target, now);

            // Find appropriate warning rule (Per Reminder)
            let activeRule: IWarningRule | undefined;

            if (r.warningRules && r.warningRules.length > 0) {
                const sortedRules = [...r.warningRules].sort((a, b) => a.minutes - b.minutes);
                // Logic: Find the highest severity rule that applies? 
                // Usually: If diff <= rule.minutes.
                // We want the *closest* threshold.
                // e.g. Rules: 60m (Yellow), 10m (Red).
                // Diff 30: Matches 60m rule.
                // Diff 5: Matches 60m AND 10m. We want 10m (Red).

                // So we sort ascending (10, 60).
                // Filter applicable: diff <= rule.minutes.
                // Take the first one (smallest minutes).

                if (diff >= -30) {
                    const applicable = sortedRules.filter(rule => diff <= rule.minutes);
                    if (applicable.length > 0) {
                        activeRule = applicable[0];
                    }
                }
            }

            return { ...r, activeRule, minutesUntil: diff };
        })
            .filter(r => r.minutesUntil >= -30) // Hide old ones
            .sort((a, b) => a.minutesUntil - b.minutesUntil);

    }, [reminders, currentTime]);

    const topReminder = processedReminders[0];
    const otherReminders = processedReminders.slice(1);

    // Audio Logic
    useEffect(() => {
        if (!topReminder?.activeRule?.soundUrl) return;

        const alarmSound = new Audio(topReminder.activeRule.soundUrl);
        const shouldLoop = topReminder.activeRule.flash;

        if (shouldLoop) {
            const interval = setInterval(() => {
                alarmSound.play().catch(() => { });
            }, 30000);
            alarmSound.play().catch(() => { });
            return () => clearInterval(interval);
        } else {
            alarmSound.play().catch(() => { });
        }
    }, [topReminder?.activeRule, topReminder?._id]);

    if (loading) return <div className="h-screen bg-background text-foreground flex items-center justify-center">Loading...</div>;

    const containerClass = "bg-background text-foreground";

    // Dynamic Animation Class
    const getAnimClass = (rule?: IWarningRule) => {
        if (!rule?.flash) return '';
        switch (rule.flashSpeed) {
            case 'fast': return 'animate-[pulse_0.5s_cubic-bezier(0.4,0,0.6,1)_infinite]';
            case 'slow': return 'animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]';
            default: return 'animate-pulse';
        }
    };

    return (
        <div className={cn(
            "min-h-screen overflow-hidden font-sans transition-colors duration-500",
            containerClass
        )}>
            <ThemeWatcher />
            <div className="flex flex-col h-full p-8">
                <header className="flex justify-between items-center mb-12">
                    <h1 className="text-3xl font-bold tracking-tight text-muted-foreground">P&S Reminder Display</h1>
                    <div className="text-7xl font-black tracking-tighter tabular-nums">
                        {format(currentTime, 'hh:mm:ss a')}
                    </div>
                </header>

                <main className="flex-1 grid grid-cols-3 gap-8">
                    <section className={cn(
                        "col-span-2 rounded-3xl p-10 border relative overflow-hidden flex flex-col justify-center transition-all duration-500",
                        topReminder?.activeRule?.color || "bg-card border-border",
                        getAnimClass(topReminder?.activeRule)
                    )}>
                        {/* Background Image Overlay */}
                        {topReminder?.imageUrl && (
                            <div
                                className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none mix-blend-overlay"
                                style={{ backgroundImage: `url(${topReminder.imageUrl})` }}
                            />
                        )}

                        {topReminder ? (
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center space-x-4 mb-2">
                                    {(topReminder.activeRule?.flash) && <AlertTriangle className="w-12 h-12 text-current animate-bounce" />}
                                    <h2 className="text-2xl font-medium tracking-wide opacity-90">
                                        {topReminder.title}
                                    </h2>
                                </div>

                                <div className="text-6xl font-bold leading-tight">
                                    {topReminder.description || topReminder.title}
                                </div>

                                <div className="mt-8 p-6 rounded-2xl border inline-flex items-center space-x-4 bg-background/20 backdrop-blur-sm border-border/20">
                                    <Clock className="w-8 h-8" />
                                    <span className="text-3xl font-mono font-bold">
                                        {topReminder.targetTime}
                                    </span>
                                    <span className="text-xl opacity-70">
                                        (in {topReminder.minutesUntil} minutes)
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground text-2xl">
                                No active reminders for today.
                            </div>
                        )}
                    </section>

                    <aside className="col-span-1 bg-card/50 rounded-3xl p-6 border border-border flex flex-col">
                        <h2 className="text-xl font-medium text-muted-foreground mb-6 flex items-center">
                            <Bell className="w-5 h-5 mr-2" />
                            Coming Up
                        </h2>
                        <ul className="space-y-4 flex-1 overflow-y-auto">
                            {otherReminders.map((r, i) => (
                                <li key={r._id as string} className="p-5 bg-card rounded-xl border border-border">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="text-xl font-semibold">{r.title}</div>
                                        <span className="text-sm font-mono text-muted-foreground">{r.targetTime}</span>
                                    </div>
                                    {r.description && <div className="text-sm text-muted-foreground line-clamp-2">{r.description}</div>}
                                </li>
                            ))}
                            {otherReminders.length === 0 && (
                                <li className="text-muted-foreground text-center italic mt-10">Nothing else today</li>
                            )}
                        </ul>
                    </aside>
                </main>
            </div>
        </div>
    );
}
