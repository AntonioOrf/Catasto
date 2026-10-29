import { useEffect, useId, useRef, useState } from "react";
import { Menu, X, Moon, Sun, ArrowLeft } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import useDarkMode from "../../hooks/useDarkMode";
import { useLanguage, useT, type Lang } from "../../i18n";
import { headerMessages } from "./Header.messages";
import { useTour } from "../../features/tour/tour-context";
import { tourMessages } from "../../features/tour/tour.messages";

interface HeaderProps {
  /** Con il toggle dell'indice (Home); senza, eventualmente il ritorno alla Home. */
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
  showHomeLink?: boolean;
}

const LANGS: { lang: Lang; label: string; name: "langIt" | "langEn" }[] = [
  { lang: "it", label: "IT", name: "langIt" },
  { lang: "en", label: "EN", name: "langEn" },
];

/** Voce attiva sottolineata: stessa regola per le sezioni e per la lingua. */
const activeText = (active: boolean) =>
  active ? "underline decoration-2 underline-offset-[6px]" : "opacity-85 hover:underline underline-offset-[6px]";

export default function Header({ isSidebarOpen = false, setIsSidebarOpen, showHomeLink = false }: HeaderProps) {
  const [theme, setTheme] = useDarkMode();
  const { lang, setLang } = useLanguage();
  const t = useT(headerMessages);
  const tTour = useT(tourMessages);
  const tour = useTour();
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  // Il menu del telefono si chiude con Esc o toccando fuori.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  const sections = (onNavigate?: () => void) => (
    <>
      <NavLink to="/" end onClick={onNavigate} className={({ isActive }) => `min-h-11 inline-flex items-center ${activeText(isActive)}`}>
        {t("consultazione")}
      </NavLink>
      <NavLink to="/banco" onClick={onNavigate} className={({ isActive }) => `min-h-11 inline-flex items-center ${activeText(isActive)}`}>
        {t("banco")}
      </NavLink>
    </>
  );

  return (
    <header className="bg-bg-header text-white border-bg-header-border border-b-4 flex-shrink-0 z-50 h-16 lg:h-20 relative">
      <div className="w-full px-2 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-2">
        <div className="flex items-center h-full min-w-0">
          {setIsSidebarOpen ? (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 mr-1 hover:bg-white/10 rounded-ui transition-colors"
              title={isSidebarOpen ? t("closeIndex") : t("openIndex")}
              aria-label={isSidebarOpen ? t("closeIndex") : t("openIndex")}
              aria-expanded={isSidebarOpen}
            >
              {isSidebarOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          ) : showHomeLink ? (
            <Link to="/" className="p-2.5 mr-1 hover:bg-white/10 rounded-ui transition-colors" title={t("backHome")} aria-label={t("backHome")}>
              <ArrowLeft className="h-6 w-6" aria-hidden="true" />
            </Link>
          ) : null}

          <div className="h-8 w-[1px] bg-white/20 mx-2 sm:mx-3 lg:mx-4 flex-shrink-0" aria-hidden="true"></div>

          <Link to="/" className="min-w-0">
            {/* Sul telefono il nome breve: quello lungo non ci sta accanto a lingua, tema e menu. */}
            <h1 className="text-lg lg:text-2xl font-bold font-serif leading-tight truncate">
              <span className="sm:hidden">{t("titleShort")}</span>
              <span className="hidden sm:inline">{t("title")}</span>
              <span className="hidden lg:inline">{t("titleSuffix")}</span>
            </h1>
            <p className="text-xs lg:text-sm small-caps hidden sm:block opacity-85 leading-tight">{t("subtitle")}</p>
          </Link>
        </div>

        <div className="flex items-center h-full gap-2 sm:gap-4 lg:gap-6 text-sm lg:text-base">
          <nav aria-label={t("sections")} className="hidden md:flex items-center gap-5">
            {sections()}
          </nav>

          <button onClick={tour.start} className="hidden md:inline-flex min-h-11 items-center opacity-85 hover:underline underline-offset-[6px]" title={tTour("openAria")}>
            {tTour("open")}
          </button>

          {/* La lingua è testo: «IT · EN», con quella attiva sottolineata. Ogni
              voce porta il proprio `lang`, così il lettore di schermo la pronuncia bene. */}
          <div role="group" aria-label={t("language")} className="flex items-center gap-1.5">
            {LANGS.map((l, i) => (
              <span key={l.lang} className="inline-flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true" className="opacity-70">·</span>}
                <button
                  type="button"
                  lang={l.lang}
                  aria-pressed={lang === l.lang}
                  aria-label={t(l.name)}
                  onClick={() => setLang(l.lang)}
                  className={`min-h-11 min-w-8 px-1 font-semibold ${activeText(lang === l.lang)}`}
                >
                  {l.label}
                </button>
              </span>
            ))}
          </div>

          <button
            onClick={toggleTheme}
            className="p-3 rounded-ui hover:bg-white/10 transition-colors"
            title={theme === "dark" ? t("toLight") : t("toDark")}
            aria-label={theme === "dark" ? t("toLight") : t("toDark")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
          </button>

          {/* Sul telefono sezioni e guida passano in un menu. */}
          <div ref={menuRef} className="relative md:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              className="min-h-11 px-2 underline-offset-[6px] hover:underline"
            >
              {t("menu")}
            </button>
            <div
              id={menuId}
              hidden={!menuOpen}
              className="absolute right-0 top-full mt-2 w-56 bg-bg-sidebar text-text-main border border-border-base rounded-ui p-2 flex flex-col"
            >
              <nav aria-label={t("sections")} className="flex flex-col px-2 text-primary">
                {sections(() => setMenuOpen(false))}
              </nav>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  tour.start();
                }}
                className="min-h-11 px-2 text-left text-primary hover:underline underline-offset-[6px]"
              >
                {tTour("open")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
