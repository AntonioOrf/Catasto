import { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

// localStorage può lanciare (storage bloccato, alcune modalità private): qui
// verrebbe eseguito durante il primo render e lascerebbe la pagina bianca.
type Theme = 'light' | 'dark';

const readStoredTheme = (): Theme | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === 'light' || stored === 'dark' ? stored : null;
    } catch {
        return null;
    }
};

const systemTheme = (): Theme =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

// public/theme-init.js applica la stessa scelta prima del primo paint.
export default function useDarkMode(): [Theme, React.Dispatch<React.SetStateAction<Theme>>] {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'light';
        return readStoredTheme() ?? systemTheme();
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);

        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // preferenza non persistita: il tema resta valido per la sessione
        }
    }, [theme]);

    return [theme, setTheme];
}
