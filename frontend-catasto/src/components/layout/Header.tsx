import { Menu, X, Scroll, Moon, Sun, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import useDarkMode from "../../hooks/useDarkMode";

interface HeaderProps {
  /** Con il toggle dell'indice (Home); senza, eventualmente il ritorno alla Home. */
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
  showHomeLink?: boolean;
}

export default function Header({ isSidebarOpen = false, setIsSidebarOpen, showHomeLink = false }: HeaderProps) {
  const [theme, setTheme] = useDarkMode();

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <header className="bg-bg-header text-white shadow-md border-bg-header-border border-b-4 flex-shrink-0 z-50 h-16 lg:h-20 relative">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center h-full">
          {setIsSidebarOpen ? (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 mr-1 hover:bg-white/10 rounded-md transition-colors"
              title={isSidebarOpen ? "Chiudi Indice" : "Apri Indice"}
              aria-label={isSidebarOpen ? "Chiudi indice" : "Apri indice"}
              aria-expanded={isSidebarOpen}
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          ) : showHomeLink ? (
            <Link to="/" className="p-2.5 mr-1 hover:bg-white/10 rounded-md transition-colors" title="Torna alla Home" aria-label="Torna alla Home">
              <ArrowLeft className="h-6 w-6" aria-hidden="true" />
            </Link>
          ) : null}
          
          <div className="h-8 w-[1px] bg-white/20 mx-3 lg:mx-4" aria-hidden="true"></div>

          <Link to="/" className="flex items-center gap-3">
            <Scroll className="h-6 w-6 lg:h-8 lg:w-8" aria-hidden="true" />
            <div>
              <h1 className="text-lg lg:text-2xl font-bold tracking-wide font-serif leading-tight">
                Catasto Fiorentino
                <span className="hidden lg:inline"> del 1427/30</span>
              </h1>
              <p className="text-[11px] lg:text-xs uppercase tracking-wider font-medium hidden sm:block opacity-80">
                Sistema di Consultazione
              </p>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center h-full gap-3 lg:gap-4">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-full hover:bg-white/10 transition-colors"
            title={theme === "dark" ? "Passa alla modalità chiara" : "Passa alla modalità scura"}
            aria-label={theme === "dark" ? "Passa alla modalità chiara" : "Passa alla modalità scura"}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
