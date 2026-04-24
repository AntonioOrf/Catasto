import { useEffect, useState } from 'react';

export default function useDarkMode(): [string, React.Dispatch<React.SetStateAction<string>>] {
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);

        localStorage.setItem('theme', theme);
    }, [theme]);

    return [theme, setTheme];
}
