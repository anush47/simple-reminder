'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';

export default function SiteLogin() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/site-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.refresh(); // Refresh to let middleware proceed
                // router.push('/'); // Should auto redirect if we were blocked? 
                // Wait, if we are at /login, we want to go /
                window.location.href = '/';
            } else {
                setError('Incorrect password');
            }
        } catch (err) {
            setError('Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 transition-colors duration-500">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Site Access</h2>
                    <p className="mt-2 text-muted-foreground">Please enter the site password to continue.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Site Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-card py-6 text-lg text-center tracking-widest"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center font-medium">{error}</div>
                    )}

                    <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
                        {loading ? 'Verifying...' : 'Enter Site'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
