import { Menu, X, Scroll, Moon, Sun, ArrowLeft, Languages } from "lucide-react";
import { Link } from "react-router-dom";
import useDarkMode from "../../hooks/useDarkMode";
import { useLanguage, useT } from "../../i18n";
import { headerMessages } from "./Header.messages";

interface HeaderProps {
  /** Con il toggle dell'indice (Home); senza, eventualmente il ritorno alla Home. */
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
  showHomeLink?: boolean;
}

export default function Header({ isSidebarOpen = false, setIsSidebarOpen, showHomeLink = false }: HeaderProps) {
  const [theme, setTheme] = useDarkMode();
  const { lang, setLang } = useLanguage();
  const t = useT(headerMessages);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <header className="bg-bg-header text-white shadow-md border-bg-header-border border-b-4 flex-shrink-0 z-50 h-16 lg:h-20 relative">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center h-full">
          {setIsSidebarOpen ? (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 mr-1 hover:bg-white/10 rounded-md transition-colors"
              title={isSidebarOpen ? t("closeIndex") : t("openIndex")}
              aria-label={isSidebarOpen ? t("closeIndex") : t("openIndex")}
              aria-expanded={isSidebarOpen}
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          ) : showHomeLink ? (
            <Link to="/" className="p-2.5 mr-1 hover:bg-white/10 rounded-md transition-colors" title={t("backHome")} aria-label={t("backHome")}>
              <ArrowLeft className="h-6 w-6" aria-hidden="true" />
            </Link>
          ) : null}
          
          <div className="h-8 w-[1px] bg-white/20 mx-3 lg:mx-4" aria-hidden="true"></div>

          <Link to="/" className="flex items-center gap-3">
            <Scroll className="h-6 w-6 lg:h-8 lg:w-8" aria-hidden="true" />
            <div>
              <h1 className="text-lg lg:text-2xl font-bold tracking-wide font-serif leading-tight">
                {t("title")}
                <span className="hidden lg:inline">{t("titleSuffix")}</span>
              </h1>
              <p className="text-[11px] lg:text-xs uppercase tracking-wider font-medium hidden sm:block opacity-80">
                {t("subtitle")}
              </p>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center h-full gap-1 sm:gap-3 lg:gap-4">
          {/* Mostra la lingua di destinazione: chi non legge l'italiano deve riconoscere "EN". */}
          <button
            onClick={() => setLang(lang === "it" ? "en" : "it")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/30 hover:bg-white/10 transition-colors text-sm font-semibold tracking-wider"
            title={t("switchLang")}
            aria-label={t("switchLang")}
            lang={lang === "it" ? "en" : "it"}
          >
            <Languages className="h-4 w-4" aria-hidden="true" />
            <span>{lang === "it" ? "EN" : "IT"}</span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-3 rounded-full hover:bg-white/10 transition-colors"
            title={theme === "dark" ? t("toLight") : t("toDark")}
            aria-label={theme === "dark" ? t("toLight") : t("toDark")}
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
