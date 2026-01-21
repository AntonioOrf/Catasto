import React from 'react';
import { Menu, X, Scroll } from 'lucide-react';

export default function Header({ isSidebarOpen, setIsSidebarOpen }) {
  return (
    <header className="bg-bg-header text-text-inverted shadow-md border-b-4 border-bg-header-border flex-shrink-0 z-20 h-16 md:h-20 transition-all duration-300 relative">

      <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

        {/* --- SEZIONE SINISTRA --- */}
        <div className="flex items-center h-full">

          {/* 1. TASTO MENU */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 mr-1 bg-bg-header-accent/10 hover:bg-bg-header-border/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-text-accent"
            title={isSidebarOpen ? "Chiudi Indice" : "Apri Indice"}
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6 text-text-accent" />
            ) : (
              <Menu className="h-6 w-6 text-text-accent" />
            )}
          </button>

          {/* 2. IL DIVIDER VERTICALE (La "barrettina") */}
          {/* Usa bg-border-base per essere visibile sia su chiaro che su scuro */}
          <div className="h-8 w-[1px] bg-border-base mx-3 md:mx-4 opacity-50"></div>

          {/* 3. ICONA + TITOLO */}
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

        {/* --- SEZIONE DESTRA --- */}
        <div className="flex items-center h-full">

          {/* 4. DIVIDER DESTRO (Prima del server status) */}
          <div className="h-8 w-[1px] bg-border-base mx-4 opacity-50 hidden sm:block"></div>

          {/* STATUS SERVER */}
          <div className="flex items-center gap-2 text-[10px] md:text-xs bg-bg-header-accent/10 px-3 py-1.5 rounded border border-border-base/30 text-text-accent font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="hidden sm:inline opacity-80 uppercase tracking-wider">Server Live</span>
          </div>
        </div>

      </div>
    </header>
  );
}