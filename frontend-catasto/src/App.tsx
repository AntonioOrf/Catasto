import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { FilterProvider } from './context/FilterContext';
import Spinner from './components/common/Spinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useT } from './i18n';
import { appMessages } from './App.messages';
import { TourProvider } from './features/tour/TourProvider';
import { CompareProvider } from './features/compare/CompareProvider';
import CompareView from './features/compare/components/CompareView';

const InfoPage = lazy(() => import('./pages/InfoPage'));
const MappaPage = lazy(() => import('./pages/MappaPage'));
const ContattiPage = lazy(() => import('./pages/ContattiPage'));
const GlossarioPage = lazy(() => import('./pages/GlossarioPage'));
const BancoPage = lazy(() => import('./pages/BancoPage'));

type TitleKey = Exclude<keyof (typeof appMessages)['it'], 'loadingPage'>;

/** Imposta il titolo della scheda (nella lingua attiva) senza toccare le singole pagine. */
function Titled({ title, children }: { title?: TitleKey; children: ReactNode }) {
  const t = useT(appMessages);
  useDocumentTitle(title ? t(title) : undefined);
  return children;
}

function PageFallback() {
  const t = useT(appMessages);
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main">
      <Spinner label={t('loadingPage')} />
    </div>
  );
}

export default function App() {
  return (
    <FilterProvider>
      <Router>
        <TourProvider>
        {/* La selezione dei fuochi vale in Consultazione e nel Banco: sta sopra le route. */}
        <CompareProvider>
        <ErrorBoundary>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Titled><HomePage /></Titled>} />
              <Route path="/informazioni" element={<Titled title="info"><InfoPage /></Titled>} />
              <Route path="/mappa" element={<Titled title="map"><MappaPage /></Titled>} />
              <Route path="/contatti" element={<Titled title="contacts"><ContattiPage /></Titled>} />
              <Route path="/glossario" element={<Titled title="glossary"><GlossarioPage /></Titled>} />
              <Route path="/banco" element={<Titled title="banco"><BancoPage /></Titled>} />
            </Routes>
          </Suspense>
          <CompareView />
        </ErrorBoundary>
        </CompareProvider>
        </TourProvider>
      </Router>
    </FilterProvider>
  );
}
