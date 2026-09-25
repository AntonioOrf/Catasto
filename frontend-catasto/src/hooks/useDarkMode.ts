import { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

// localStorage può lanciare (storage bloccato, alcune modalità private): qui
// verrebbe eseguito durante il primo render e lascerebbe la pagina bianca.
const readStoredTheme = (): string | null => {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
};

const systemTheme = (): string =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export default function useDarkMode(): [string, React.Dispatch<React.SetStateAction<string>>] {
    const [theme, setTheme] = useState(() => {
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
