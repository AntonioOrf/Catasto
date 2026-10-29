import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { GLOSSARY, glossaryAnchor } from "../i18n/glossary";
import { useLanguage, useT } from "../i18n";
import { glossaryMessages } from "../features/glossary/glossary.messages";

/** Tutte le voci del glossario, ciascuna con un'ancora raggiungibile dai suggerimenti. */
export default function GlossarioPage() {
  const t = useT(glossaryMessages);
  const { lang } = useLanguage();
  const { hash } = useLocation();
  const collator = new Intl.Collator(lang, { sensitivity: "base" });
  const entries = [...GLOSSARY].sort((a, b) => collator.compare(a.term[lang], b.term[lang]));

  // Arrivando da "Approfondisci" la voce va portata in vista e messa a fuoco.
  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    target?.scrollIntoView({ block: "start" });
    target?.focus({ preventScroll: true });
  }, [hash]);

  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-main font-serif">
      <Header showHomeLink={true} />

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-10">
        <h2 id="glossario-top" className="text-3xl font-bold mb-3 text-primary">{t("pageTitle")}</h2>
        <p className="mb-6 leading-relaxed text-text-accent">{t("pageIntro")}</p>

        <nav aria-label={t("index")} className="mb-8">
          <ul className="flex flex-wrap gap-2">
            {entries.map((entry) => (
              <li key={entry.id}>
                <a
                  href={`#${glossaryAnchor(entry.id)}`}
                  className="inline-flex items-center min-h-11 px-3 rounded-ui border border-border-base bg-bg-sidebar text-sm text-accent-strong hover:bg-item-hover"
                >
                  {entry.term[lang]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <dl className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              id={glossaryAnchor(entry.id)}
              tabIndex={-1}
              className="scroll-mt-6 bg-bg-sidebar border border-border-base rounded-ui p-5 target:border-primary target:ring-2 target:ring-primary/30"
            >
              <dt className="text-xl font-bold text-primary mb-1">{entry.term[lang]}</dt>
              <dd className="leading-relaxed">
                {entry.short[lang]}
                {entry.long && <span className="block mt-1 text-text-main">{entry.long[lang]}</span>}
                <a href="#glossario-top" className="flex w-fit items-center min-h-8 mt-2 text-xs text-text-accent underline underline-offset-2">
                  {t("backToTop")}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </main>

      <Footer />
    </div>
  );
}
