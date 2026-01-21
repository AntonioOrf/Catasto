import React from 'react';
import { Menu, X, Scroll } from 'lucide-react';

export default function Header({ isSidebarOpen, setIsSidebarOpen }) {
  return (
    <header className="bg-bg-header text-text-inverted shadow-xl border-b-[5px] border-bg-header-border flex-shrink-0 z-20 h-16 md:h-20 transition-all duration-300 relative">

      <div className="absolute top-0 left-0 w-full h-1 bg-bg-header-accent opacity-50"></div>

      <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

        <div className="flex items-center">

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-bg-header-accent rounded-lg hover:bg-bg-header-border transition-colors focus:outline-none focus:ring-2 focus:ring-text-accent group"
            title={isSidebarOpen ? "Chiudi Indice" : "Apri Indice"}
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6 text-text-accent group-hover:text-white transition-colors" />
            ) : (
              <Menu className="h-6 w-6 text-text-accent group-hover:text-white transition-colors" />
            )}
          </button>

          <div className="h-10 w-[2px] bg-bg-header-border mx-3 md:mx-4 rounded-full opacity-60"></div>

          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-bg-header-accent rounded-full border border-bg-header-border shadow-inner hidden sm:block">
              <Scroll className="h-5 w-5 text-text-accent" />
            </div>

            <div>
              <h1 className="text-lg md:text-2xl font-bold tracking-wide font-serif leading-tight text-text-inverted drop-shadow-sm">
                Catasto Fiorentino
                <span className="hidden md:inline"> del 1427/30</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="h-[1px] w-6 bg-text-accent opacity-50 hidden sm:block"></span>
                <p className="text-[10px] md:text-xs text-text-accent uppercase tracking-wider font-medium">
                  Sistema di Consultazione
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}