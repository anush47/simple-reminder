'use client';

import { useState, useEffect } from 'react';
import { IReminder } from '@/models/Reminder';
import ReminderForm from '@/components/ReminderForm';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { format } from 'date-fns';

export default function AdminDashboard() {
    const [reminders, setReminders] = useState<IReminder[]>([]);
    const [editingReminder, setEditingReminder] = useState<IReminder | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const router = useRouter();

    const fetchReminders = async () => {
        const res = await fetch('/api/reminders');
        if (res.ok) {
            setReminders(await res.json());
        }
    };

    useEffect(() => {
        fetchReminders();
    }, []);

    const handleCreate = async (data: Partial<IReminder>) => {
        const loadingToast = toast.loading("Creating reminder...");
        const res = await fetch('/api/reminders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            toast.dismiss(loadingToast);
            toast.success("Reminder created successfully");
            setIsDialogOpen(false);
            fetchReminders();
        } else {
            toast.dismiss(loadingToast);
            toast.error("Failed to create reminder");
        }
    };

    const handleUpdate = async (data: Partial<IReminder>) => {
        if (!editingReminder) return;
        const loadingToast = toast.loading("Updating reminder...");
        const res = await fetch(`/api/reminders/${editingReminder._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            toast.dismiss(loadingToast);
            toast.success("Reminder updated successfully");
            setEditingReminder(null);
            setIsDialogOpen(false);
            fetchReminders();
        } else {
            toast.dismiss(loadingToast);
            toast.error("Failed to update reminder");
        }
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        const loadingToast = toast.loading("Deleting reminder...");
        const res = await fetch(`/api/reminders/${deletingId}`, { method: 'DELETE' });
        if (res.ok) {
            toast.dismiss(loadingToast);
            toast.success("Reminder deleted successfully");
            setDeletingId(null);
            fetchReminders();
        } else {
            toast.dismiss(loadingToast);
            toast.error("Failed to delete");
        }
    };

    const openEdit = (reminder: IReminder) => {
        setEditingReminder(reminder);
        setIsDialogOpen(true);
    };

    const openCreate = () => {
        setEditingReminder(null);
        setIsDialogOpen(true);
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        toast.success("Logged out successfully");
        router.push('/admin/login');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-background text-foreground transition-colors duration-300">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Manage your display reminders.</p>
                </div>
                <div className="space-x-4 flex items-center">
                    <Button onClick={() => router.push('/admin/settings')} variant="outline">Settings</Button>
                    <Button onClick={() => router.push('/display')} variant="secondary">Go to Display</Button>
                    <Button onClick={handleLogout} variant="ghost" className="text-muted-foreground hover:text-destructive">Sign Out</Button>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Reminder</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingReminder ? 'Edit Reminder' : 'Create Reminder'}</DialogTitle>
                            </DialogHeader>
                            <ReminderForm
                                initialData={editingReminder || undefined}
                                onSubmit={editingReminder ? handleUpdate : handleCreate}
                                onCancel={() => setIsDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* LIST VIEW */}
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <div className="col-span-1">Time</div>
                    <div className="col-span-4">Title</div>
                    <div className="col-span-3">Recurrence</div>
                    <div className="col-span-2">Next Run</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                <div className="divide-y">
                    {reminders.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            No reminders found. Create one to get started.
                        </div>
                    ) : (
                        reminders.map((reminder) => {
                            // Helper to display recurrence nicely
                            let recurrenceText = "One Time";
                            if (reminder.recurrenceType === 'daily') recurrenceText = "Daily";
                            else if (reminder.recurrenceType === 'weekly') {
                                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                recurrenceText = reminder.weekDays?.map(d => days[d]).join(', ') || "Weekly";
                            }
                            else if (reminder.recurrenceType === 'monthly') recurrenceText = `Monthly (${reminder.monthDays?.join(', ') || ''})`;
                            // Legacy
                            else if (reminder.days && reminder.days.length > 0) recurrenceText = reminder.days.join(', ');

                            return (
                                <div key={reminder._id as unknown as string} className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors ${!reminder.active ? 'opacity-50 grayscale' : ''}`}>
                                    <div className="col-span-1 font-mono font-bold text-lg">
                                        {reminder.targetTime}
                                    </div>
                                    <div className="col-span-4">
                                        <div className="font-semibold text-base">{reminder.title}</div>
                                        {reminder.description && <div className="text-sm text-muted-foreground truncate">{reminder.description}</div>}
                                    </div>
                                    <div className="col-span-3 text-sm text-muted-foreground">
                                        <div className="flex flex-wrap gap-1">
                                            {reminder.recurrenceType === 'none' ? (
                                                <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-xs">
                                                    {reminder.date ? format(new Date(reminder.date), 'MMM do, yyyy') : 'Today'}
                                                </span>
                                            ) : (
                                                <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-medium">
                                                    {recurrenceText}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-sm text-muted-foreground">
                                        {/* Placeholder for 'Next Run' logic if we wanted it calculated here too */}
                                        <span className={reminder.active ? "text-green-600 dark:text-green-500 font-medium text-xs uppercase" : "text-neutral-400 text-xs uppercase"}>
                                            {reminder.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="col-span-2 flex justify-end space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(reminder)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setDeletingId(reminder._id as unknown as string)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the reminder.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
