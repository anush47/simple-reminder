"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

// This component will be mounted inside the ThemeProvider
// It fetches the theme from the API and sets it via useTheme.
// It also provides a context or hook for other components to access the *configured* theme if needed
// though useTheme gives the *active* theme.

export function ThemeWatcher() {
    const { setTheme } = useTheme()

    useEffect(() => {
        // Poll for settings changes (or we could use a context, but polling matches our architecture)
        const fetchTheme = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.theme) {
                        setTheme(data.theme);
                    }
                }
            } catch (e) {
                console.error("Theme sync failed", e);
            }
        };

        fetchTheme();
        // Sync every 5 seconds? Or just on load? 
        // User requested "configurable from admin page"
        // Ideally it should update relatively quickly on Display page.
        const interval = setInterval(fetchTheme, 5000);
        return () => clearInterval(interval);
    }, [setTheme]);

    return null;
}
