'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });

        if (res.ok) {
            router.push('/admin/dashboard');
        } else {
            setError('Invalid password');
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
            <div className="w-full max-w-sm p-6 bg-card text-card-foreground rounded-lg shadow-md border border-border">
                <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded border-input bg-background"
                            placeholder="Enter Password"
                        />
                    </div>
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground p-2 rounded hover:bg-primary/90"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}
