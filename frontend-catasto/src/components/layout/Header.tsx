import React from "react";
import { Menu, X, Scroll, Moon, Sun, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import useDarkMode from "../../hooks/useDarkMode";

export default function Header({ isSidebarOpen, setIsSidebarOpen, showHomeLink = false }: any) {
  const [theme, setTheme] = useDarkMode();
  
  const toggleTheme = () => {
    const nuovoTema = theme === "light" ? "dark" : "light";
    setTheme(nuovoTema);
  };
  
  return (
    <header className="bg-bg-header text-white shadow-md border-bg-header-border border-b-4 flex-shrink-0 sticky top-0 z-50 h-16 md:h-20 transition-all duration-300 relative">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center h-full">
          {setIsSidebarOpen ? (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 mr-1 hover:bg-white/10 rounded-md transition-colors focus:outline-none"
              title={isSidebarOpen ? "Chiudi Indice" : "Apri Indice"}
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          ) : showHomeLink ? (
            <Link to="/" className="p-2 mr-1 hover:bg-white/10 rounded-md transition-colors" title="Torna alla Home">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          ) : null}
          
          <div className="h-8 w-[1px] bg-white/20 mx-3 md:mx-4"></div>

          <div className="flex items-center gap-3">
            <Scroll className="h-6 w-6 md:h-8 md:w-8" />
            <div>
              <h1 className="text-lg md:text-2xl font-bold tracking-wide font-serif leading-tight">
                Catasto Fiorentino
                <span className="hidden md:inline"> del 1427/30</span>
              </h1>
              <p className="text-[10px] md:text-xs uppercase tracking-wider font-medium hidden sm:block opacity-80">
                Sistema di Consultazione
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center h-full gap-3 md:gap-4">
          <nav className="hidden md:flex items-center gap-6 mr-4 border-r border-white/20 pr-6">
            <Link to="/" className="text-sm font-semibold hover:text-accent uppercase tracking-wider transition-colors">
              Ricerca
            </Link>
            <Link to="/mestieri" className="text-sm font-semibold hover:text-accent uppercase tracking-wider transition-colors">
              Mestieri
            </Link>
          </nav>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/10 transition-all"
            title={theme === "dark" ? "Passa alla modalità chiara" : "Passa alla modalità scura"}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 animate-in spin-in-90 duration-300" />
            ) : (
              <Moon className="h-5 w-5 animate-in slide-in-from-top-2 duration-300" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
