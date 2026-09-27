import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { FilterProvider } from './context/FilterContext';
import Spinner from './components/common/Spinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useDocumentTitle } from './hooks/useDocumentTitle';

const InfoPage = lazy(() => import('./pages/InfoPage'));
const MappaPage = lazy(() => import('./pages/MappaPage'));
const ContattiPage = lazy(() => import('./pages/ContattiPage'));

/** Imposta il titolo della scheda senza toccare le singole pagine. */
function Titled({ title, children }: { title?: string; children: ReactNode }) {
  useDocumentTitle(title);
  return children;
}

export default function App() {
  return (
    <FilterProvider>
      <Router>
        <ErrorBoundary>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-bg-main">
              <Spinner label="Caricamento pagina" />
            </div>
          }>
            <Routes>
              <Route path="/" element={<Titled><HomePage /></Titled>} />
              <Route path="/informazioni" element={<Titled title="Informazioni"><InfoPage /></Titled>} />
              <Route path="/mappa" element={<Titled title="Mappa"><MappaPage /></Titled>} />
              <Route path="/contatti" element={<Titled title="Contatti"><ContattiPage /></Titled>} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </FilterProvider>
  );
}
