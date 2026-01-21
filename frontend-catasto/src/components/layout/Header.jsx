import React from 'react';
import { Menu, X, Scroll, Moon, Sun } from 'lucide-react';
import useDarkMode from '../../hooks/useDarkMode';

export default function Header({ isSidebarOpen, setIsSidebarOpen }) {
  console.log("HEADER CARICATO. Il tema è:", useDarkMode()[0]);
  const [theme, setTheme] = useDarkMode();
  const toggleTheme = () => {
    console.log("Tema attuale:", theme);
    const nuovoTema = theme === 'light' ? 'dark' : 'light';
    console.log("Cambio in:", nuovoTema);
    setTheme(nuovoTema);
  };
  return (
    <header className="bg-bg-header text-text-inverted shadow-md border-b-4 border-bg-header-border flex-shrink-0 z-20 h-16 md:h-20 transition-all duration-300 relative">

      <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

        <div className="flex items-center h-full">

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 mr-1 bg-bg-header-accent/10 hover:bg-bg-header-border/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-text-accent bg-bg-header-accent"
            title={isSidebarOpen ? "Chiudi Indice" : "Apri Indice"}
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6 text-text-accent" />
            ) : (
              <Menu className="h-6 w-6 text-text-accent" />
            )}
          </button>
          <div className="h-8 w-[1px] bg-bg-header-border mx-3 md:mx-4 opacity-50"></div>

          <div className="flex items-center gap-3">
            <Scroll className="h-6 w-6 md:h-8 md:w-8 text-text-accent" />
            <div>
              <h1 className="text-lg md:text-2xl font-bold tracking-wide font-serif leading-tight text-text-inverted">
                Catasto Fiorentino
                <span className="hidden md:inline"> del 1427/30</span>
              </h1>
              <p className="text-[10px] md:text-xs text-text-accent uppercase tracking-wider font-medium hidden sm:block">
                Sistema di Consultazione
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center h-full gap-3 md:gap-4">
          <button
            onClick={toggleTheme}
            className="relative z-50 cursor-pointer p-2 rounded-full transition-all duration-300 bg-bg-header-accent/10 hover:bg-bg-header-border/30 border border-transparent hover:border-border-base/30 group"
            title={theme === 'dark' ? "Passa alla modalità chiara" : "Passa alla modalità scura"}
          >
            {theme === 'dark' ? (
              <Sun key="sun" className="h-5 w-5 text-yellow-400 animate-in spin-in-90 duration-300" />
            ) : (
              <Moon key="moon" className="h-5 w-5 text-text-accent group-hover:text-white transition-colors animate-in slide-in-from-top-2 duration-300" />
            )}
          </button>
        </div>
      </div>
      <div className="w-full h-1.5 bg-bg-header-accent border-bg-header-border"></div>
    </header>
  );
}