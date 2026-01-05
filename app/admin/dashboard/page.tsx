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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const [reminders, setReminders] = useState<IReminder[]>([]);
    const [editingReminder, setEditingReminder] = useState<IReminder | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
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
        const res = await fetch('/api/reminders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            setIsDialogOpen(false);
            fetchReminders();
        }
    };

    const handleUpdate = async (data: Partial<IReminder>) => {
        if (!editingReminder) return;
        const res = await fetch(`/api/reminders/${editingReminder._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            setEditingReminder(null);
            setIsDialogOpen(false);
            fetchReminders();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
        fetchReminders();
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
        router.push('/admin/login');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-background text-foreground transition-colors duration-300">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reminders.map((reminder) => (
                    <Card key={reminder._id as unknown as string} className={!reminder.active ? 'opacity-60' : ''}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {reminder.targetTime}
                            </CardTitle>
                            {reminder.active ? (
                                <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 ring-1 ring-inset ring-green-600/20">Active</span>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-muted-foreground/10">Inactive</span>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold mb-2">{reminder.title}</div>
                            <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                                {reminder.description}
                            </p>
                            <div className="text-xs text-muted-foreground mb-4">
                                Runs: {reminder.days?.join(', ') || 'Configured via Rule'}
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="sm" onClick={() => openEdit(reminder)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(reminder._id as unknown as string)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
