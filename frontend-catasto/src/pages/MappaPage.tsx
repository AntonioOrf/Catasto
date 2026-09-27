import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useT } from '../i18n';
import { mappaPageMessages } from './MappaPage.messages';

export default function MappaPage() {
  const t = useT(mappaPageMessages);

  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-main font-serif">
      <Header showHomeLink={true} />

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-10 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold mb-6 text-primary">{t("title")}</h2>
        <div className="bg-bg-sidebar border border-border-base rounded-lg p-10 shadow-lg text-center">
          <p className="text-xl italic text-text-accent">
            {t("wip")}
          </p>
          <p className="mt-4 text-text-main">
            {t("soon")}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
