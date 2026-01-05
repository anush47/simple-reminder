'use client';

import { useEffect, useState, useMemo } from 'react';
import { IReminder, IWarningRule } from '@/models/Reminder';
import { ISettings } from '@/models/Settings';
import { format, parse, differenceInMinutes, getDay, getDate, addMinutes, isAfter } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertTriangle, Bell, Clock } from 'lucide-react';
import { ThemeWatcher } from '@/components/theme-watcher';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Extended types
type ReminderWithStatus = IReminder & {
    activeRule?: IWarningRule;
    minutesUntil: number;
    isOverdue: boolean;
};

export default function DisplayPage() {
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [reminders, setReminders] = useState<IReminder[]>([]);
    const [settings, setSettings] = useState<ISettings | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial Fetch (Settings + Reminders)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [remRes, setRes] = await Promise.all([
                    fetch('/api/reminders'),
                    fetch('/api/settings')
                ]);

                if (remRes.ok) setReminders(await remRes.json());
                if (setRes.ok) setSettings(await setRes.json());
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 1000 * 60); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    // Clock - High precision for flashing sync if needed
    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const processedReminders = useMemo(() => {
        if (!reminders.length) return [];

        const now = currentTime;
        const currentDayOfWk = getDay(now);
        const currentDate = getDate(now);

        // 1. Filter Active & Eligible for Today
        const todaysReminders = reminders.filter(r => {
            if (!r.active) return false;
            if (r.recurrenceType === 'daily') return true;
            if (r.recurrenceType === 'weekly') return r.weekDays?.includes(currentDayOfWk);
            if (r.recurrenceType === 'monthly') return r.monthDays?.includes(currentDate);
            if (r.recurrenceType === 'none') return true; // Assume 'OneTime' is for today
            // Legacy
            if (r.type === 'Recurring' && r.days) {
                const dayName = format(now, 'EEE');
                return r.days.includes('Daily') || r.days.includes(dayName);
            }
            return false;
        });

        return todaysReminders.map(r => {
            const target = parse(r.targetTime, 'HH:mm', now);
            const diff = differenceInMinutes(target, now);

            // Logic: Is it overdue?
            // If diff < 0, it's overdue.
            // We want to show it for maybe 30 mins after due time?
            // Unless user wants "next cycle". But for a "daily display", usually we show "Today's tasks".
            // So if it's 2pm and task was 10am, it's PASSED.
            // If it's 2pm and task is 2:05pm, it's PENDING.

            // Overdue Logic:
            // We'll treat anything from -30 mins to 0 mins as "Overdue / Happening Now".
            // Anything < -30 is "Done" for the display (hidden).

            let activeRule: IWarningRule | undefined;
            let flashActive = false;

            if (r.warningRules && r.warningRules.length > 0) {
                // Sort rules by minutes ascending
                const sortedRules = [...r.warningRules].sort((a, b) => a.minutes - b.minutes);

                // Find the most appropriate rule.
                // We only look for rules that trigger BEFORE or AT due time (positive diff)
                // Since we hide reminders < 0, we don't need to handle past rules much,
                // BUT: A rule could be "0 minutes" (At time). 

                if (diff >= 0) {
                    const applicable = sortedRules.filter(rule => diff <= rule.minutes);
                    if (applicable.length > 0) {
                        activeRule = applicable[0];

                        // Flash Duration Logic
                        // Trigger Time = TargetTime - rule.minutes.
                        // Current Time > Trigger Time.
                        // We need to keep flashing if within duration, even if we are strictly filtering < 0?
                        // Wait, if filter is < 0, then we only show UP TO due time.
                        // So a "0 minute" rule would trigger AT 0.
                        // And "5 minute duration" implies it should flash for 5 mins AFTER due time?
                        // The user said: "once the time pass then its done". 
                        // This implies no flashing after time pass either.
                        // So we assume flashing happens LEADING UP TO the time.
                        // OR: If rule is "10 mins before", it flashes from T-10 to T-0.

                        // Revised Logic based on "Done immediately":
                        // We accept the rule if we are within its window (diff <= rule.minutes).
                        // We flash if activeRule.flash is true. 
                        // We simply don't check duration 'after' due time because the item is gone.
                        // But we might want to check duration if the rule starts ERLY.
                        // e.g. Rule starts at 60m. Flash Duration 5m.
                        // Triggers at T-60. Flashes until T-55. 
                        // Current diff is 30. (Within 60). Should it flash? No.

                        const triggerTime = addMinutes(target, -activeRule.minutes);
                        const minutesSinceTrigger = differenceInMinutes(now, triggerTime);

                        if (activeRule.flash) {
                            const duration = activeRule.flashDuration ?? 5;
                            if (minutesSinceTrigger >= 0 && minutesSinceTrigger < duration) {
                                flashActive = true;
                            }
                        }
                    }
                }
            }

            // Create a modified rule object that only has flash=true if duration check passed
            const displayedRule = activeRule ? { ...activeRule, flash: flashActive } : undefined;

            return {
                ...r,
                activeRule: displayedRule,
                minutesUntil: diff,
                isOverdue: false // No longer used
            };
        })
            .filter(r => r.minutesUntil >= 0) // Strict: Remove immediately when time passes
            .sort((a, b) => a.minutesUntil - b.minutesUntil); // Sort by time remaining

    }, [reminders, currentTime, settings]); // Re-eval loop

    const topReminder = processedReminders[0];
    const otherReminders = processedReminders.slice(1);

    // Audio Logic
    useEffect(() => {
        if (!topReminder?.activeRule?.soundUrl) return;

        // Only play if flash is active (implies we are in the active window)
        // OR simply if rule matches? 
        // User requested "stop flashing after time passed". Likely implies Audio too?
        if (!topReminder.activeRule.flash) return;

        const alarmSound = new Audio(topReminder.activeRule.soundUrl);
        // Play once every 30s
        const interval = setInterval(() => {
            alarmSound.play().catch(() => { });
        }, 30000);
        alarmSound.play().catch(() => { });
        return () => clearInterval(interval);

    }, [topReminder?._id, topReminder?.activeRule?.minutes, topReminder?.activeRule?.flash]);

    if (loading) return <div className="h-screen bg-background flex items-center justify-center text-4xl font-bold text-muted-foreground">Loading Display...</div>;

    // --- Dynamic Styles ---
    const flashMode = settings?.flashMode || 'card';
    const isFullScreenFlash = flashMode === 'screen' && topReminder?.activeRule?.flash;

    // Animation Wrapper
    const getAnimClass = (rule?: IWarningRule) => {
        if (!rule?.flash) return '';
        switch (rule.flashSpeed) {
            case 'fast': return 'animate-[pulse_0.5s_cubic-bezier(0.4,0,0.6,1)_infinite]';
            case 'slow': return 'animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]';
            default: return 'animate-pulse';
        }
    };

    // Background Color Logic
    // If Full Screen Flash: Body gets the color.
    // Else: Body is dark/neutral.

    // Style Helper
    const getWarningStyles = (ruleColor?: string, isFlashing?: boolean) => {
        // Default (No Rule): Dark Mode = Border Neutral, Light Mode = Border Neutral
        if (!ruleColor) return {
            border: 'border-neutral-200 dark:border-neutral-800',
            text: 'text-neutral-900 dark:text-white',
            bg: 'bg-background',
            accent: 'text-neutral-900 dark:text-white'
        };

        let colorName = ruleColor.replace('bg-', '');
        if (colorName === ruleColor) colorName = 'red-500'; // Default fallback

        return {
            border: `border-${colorName}`,
            text: `text-${colorName}`,
            bg: isFlashing ? ruleColor : 'bg-background', // Pulse BG if flashing, else standard BG
            accent: isFlashing ? 'text-white' : `text-${colorName}` // If flashing BG, text must be white. Else colored.
        };
    };

    const isFlashing = topReminder?.activeRule?.flash;
    const style = getWarningStyles(topReminder?.activeRule?.color, isFlashing);

    // Container Classes
    const containerClasses = cn(
        "h-screen w-screen overflow-hidden font-sans flex flex-col p-6 transition-colors duration-500",
        // Base Theme Colors
        "bg-background text-foreground",
        // Flashing Logic (Override Theme)
        (isFullScreenFlash && isFlashing) ? cn(style.bg, getAnimClass(topReminder.activeRule), "text-white") : ""
    );

    // Active Card Container
    const activeCardClasses = cn(
        "col-span-9 rounded-[3rem] p-12 relative overflow-hidden flex flex-col justify-between transition-all duration-500",
        // Border Logic:
        "border-[3px]",
        // CARD FLASH MODE: Fill background with color, white text
        (!isFullScreenFlash && isFlashing) ? cn(style.bg, getAnimClass(topReminder.activeRule), "border-transparent text-white") : "",

        // SCREEN FLASH MODE: Semi-transparent to let screen glow through? 
        // In Light Mode, screen flash might be bright red. Card can be white/10 or just transparent.
        (isFullScreenFlash && isFlashing) ? "bg-white/20 backdrop-blur-md border-white/50 text-white" : "",

        // IDLE / NORMAL MODE: Theme Background + Colored Border
        (!isFlashing) ? cn("bg-background", style.border) : "",

        // Shadow
        "shadow-2xl"
    );

    // Text Colors
    // If flashing (Card or Screen), we forced text-white above.
    // If NOT flashing, we need theme aware colors.
    // style.text handles the colored text (e.g. Red for Warning).
    // But for "Standard" text (Title, Time), we need:
    // Light Mode: Black / Neutral 900
    // Dark Mode: White

    const isAlertActive = !isFullScreenFlash && !isFlashing; // Active Rule but static (not flashing)

    const activeTextColor = isAlertActive ? style.text : "text-foreground dark:text-white";
    // Wait, if alert is active (Red Border), title should be Red? 
    // Yes: style.text is `text-red-500`.
    // If NO alert logic, style.text is `text-neutral-900 dark:text-white`.

    // Muted Text (Description, Labels)
    const activeMutedColor = isAlertActive ? "text-neutral-500 dark:text-neutral-400" : "text-muted-foreground";

    // Header Color Override for Flashing
    const headerTextColor = (isFullScreenFlash && isFlashing) ? "text-white" : "text-foreground";
    const headerMutedColor = (isFullScreenFlash && isFlashing) ? "text-white/60" : "text-muted-foreground";

    return (
        <div className={containerClasses}>
            <ThemeWatcher />

            {/* HEADER - Slim & Clean */}
            <header className="flex justify-between items-center h-24 mb-4 shrink-0 px-2">
                <div className="flex flex-col justify-center">
                    <h1 className={cn("text-5xl font-bold tracking-tight mb-1", headerTextColor)}>
                        {format(currentTime, 'EEEE')}
                    </h1>
                    <div className={cn("text-2xl font-medium tracking-wide uppercase", headerMutedColor)}>
                        {format(currentTime, 'MMMM do')}
                    </div>
                </div>
                {/* Huge Digital Clock */}
                <div className={cn("text-[7rem] font-bold tracking-tighter tabular-nums leading-none flex items-baseline", headerTextColor)}>
                    {format(currentTime, 'HH:mm')}
                    <span className={cn("text-4xl ml-2 font-medium tracking-normal", headerMutedColor)}>{format(currentTime, 'ss')}</span>
                </div>
            </header>

            {/* MAIN CONTENT GRID */}
            <main className="flex-1 grid grid-cols-12 gap-8 min-h-0 pb-2">

                {/* ACTIVE TASK HERO (Columns 1-9) */}
                <section className={activeCardClasses}>

                    {topReminder ? (
                        <>
                            {/* Background Image (Subtle) */}
                            {topReminder.imageUrl && (
                                <div
                                    className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none mix-blend-overlay dark:mix-blend-overlay mix-blend-multiply"
                                    style={{ backgroundImage: `url(${topReminder.imageUrl})` }}
                                />
                            )}

                            {/* Alert Header */}
                            <div className="relative z-10 flex items-center justify-between shrink-0 mb-8">
                                <div className={cn("flex items-center space-x-3 uppercase tracking-widest font-bold text-xl border-b-2 pb-2", isFlashing ? "border-white" : style.border, activeTextColor)}>
                                    {topReminder.activeRule?.flash && <AlertTriangle className="w-6 h-6 animate-bounce" />}
                                    <span>{topReminder.isOverdue ? "Actions Required" : "Current Task"}</span>
                                </div>
                                {/* Recurrence Badge */}
                                <div className={cn("px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider", isFlashing ? "bg-white/20" : "bg-neutral-200 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400")}>
                                    {topReminder.recurrenceType === 'none' ? 'One-Time' : topReminder.recurrenceType}
                                </div>
                            </div>

                            {/* Title & Desc */}
                            <div className="relative z-10 flex-1 flex flex-col justify-center space-y-4">
                                <div className={cn("text-[6.5rem] font-bold leading-[0.9] tracking-tight line-clamp-2", activeTextColor)}>
                                    {topReminder.title}
                                </div>
                                {topReminder.description && (
                                    <div className={cn("text-4xl font-medium leading-snug line-clamp-3 max-w-5xl", activeMutedColor)}>
                                        {topReminder.description}
                                    </div>
                                )}
                            </div>

                            {/* Footer Metrics */}
                            <div className={cn("relative z-10 mt-8 pt-8 border-t flex items-center justify-between shrink-0", isFlashing ? "border-white/20" : "border-neutral-200 dark:border-white/10")}>
                                <div className="flex items-center space-x-6">
                                    <div className="flex flex-col">
                                        <span className={cn("text-sm font-bold uppercase tracking-widest mb-1", activeMutedColor)}>Due At</span>
                                        <span className={cn("text-6xl font-mono font-bold tracking-tighter", activeTextColor)}>
                                            {topReminder.targetTime}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className={cn("text-sm font-bold uppercase tracking-widest mb-1 block", activeMutedColor)}>
                                        {topReminder.isOverdue ? "Time Elapsed" : "Time Remaining"}
                                    </span>
                                    <span className={cn("text-7xl font-bold tracking-tight", topReminder.isOverdue ? (isFlashing ? "text-white" : "text-red-500") : activeTextColor)}>
                                        {topReminder.isOverdue ? (
                                            <span className="flex items-center gap-2">
                                                OVERDUE
                                            </span>
                                        ) : (
                                            <span>{topReminder.minutesUntil}<span className="text-3xl ml-2 opacity-50">min</span></span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                            <Clock className="w-32 h-32 mb-6 text-neutral-400 dark:text-neutral-700" />
                            <div className="text-5xl font-bold text-neutral-400 dark:text-neutral-500">No Active Tasks</div>
                            <div className="text-xl text-neutral-500 dark:text-neutral-600 mt-2">Production schedule is clear for now.</div>
                        </div>
                    )}
                </section>

                {/* UP NEXT SIDEBAR (Columns 10-12) */}
                <aside className="col-span-3 flex flex-col h-full border-l border-neutral-200 dark:border-neutral-900 pl-8 pt-4 group">
                    <h2 className="text-xl font-bold text-neutral-500 dark:text-neutral-600 uppercase tracking-widest mb-8 flex items-center">
                        <Bell className="w-5 h-5 mr-3" /> Up Next
                    </h2>

                    <ul className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {otherReminders.map((r, i) => (
                            <li key={r._id as unknown as string} className="group border-b border-neutral-200 dark:border-neutral-900 pb-4 last:border-0 hover:bg-neutral-100 dark:hover:bg-neutral-900/30 p-2 rounded-xl transition-colors">
                                <div className="flex items-baseline justify-between mb-1">
                                    <span className="text-2xl font-mono font-bold text-neutral-600 dark:text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                                        {r.targetTime}
                                    </span>
                                    <span className="text-xs font-bold text-neutral-400 dark:text-neutral-700 uppercase tracking-wider group-hover:text-neutral-600 dark:group-hover:text-neutral-500">
                                        in {r.minutesUntil}m
                                    </span>
                                </div>
                                <div className="text-xl font-bold text-neutral-500 leading-tight group-hover:text-neutral-900 dark:group-hover:text-neutral-300 transition-colors line-clamp-2">
                                    {r.title}
                                </div>
                            </li>
                        ))}
                        {otherReminders.length === 0 && (
                            <li className="text-neutral-400 dark:text-neutral-800 italic text-lg mt-10">Nothing else scheduled.</li>
                        )}
                    </ul>
                    {/* Admin Link - Visible on Sidebar Hover */}
                    <a href="/admin/dashboard" className="mt-auto opacity-0 group-hover:opacity-100 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white uppercase tracking-widest text-right block py-4 transition-all duration-300">
                        Admin Access
                    </a>
                </aside>
            </main>
        </div >
    );
}
