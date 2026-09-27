import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useT } from '../i18n';
import { infoPageMessages } from './InfoPage.messages';

export default function InfoPage() {
  const t = useT(infoPageMessages);

  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-main font-serif">
      <Header showHomeLink={true} />

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-10">
        <h2 className="text-3xl font-bold mb-6 text-primary">{t("title")}</h2>
        <div className="bg-bg-sidebar border border-border-base rounded-lg p-6 shadow-lg mb-8">
          <h3 className="text-xl font-bold mb-4 text-primary">{t("projectTitle")}</h3>
          <p className="mb-4 leading-relaxed">{t("projectP1")}</p>
          <p className="leading-relaxed">{t("projectP2")}</p>
        </div>

        <div className="bg-bg-sidebar border border-border-base rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-primary">{t("credits")}</h3>
          <ul className="list-disc list-inside space-y-2 text-text-main">
            <li><strong>{t("development")}</strong> Antonio Orfitelli, Pasquale Ruotolo</li>
            <li><strong>{t("digitization")}</strong> {t("digitizationTeam")}</li>
            <li><strong>{t("technologies")}</strong> React, TailwindCSS, Node.js, Express, MySQL</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
