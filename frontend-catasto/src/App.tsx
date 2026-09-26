import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { FilterProvider } from './context/FilterContext';
import Spinner from './components/common/Spinner';

const InfoPage = lazy(() => import('./pages/InfoPage'));
const MappaPage = lazy(() => import('./pages/MappaPage'));
const ContattiPage = lazy(() => import('./pages/ContattiPage'));

export default function App() {
  return (
    <FilterProvider>
      <Router>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-bg-main">
            <Spinner label="Caricamento pagina" />
          </div>
        }>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/informazioni" element={<InfoPage />} />
            <Route path="/mappa" element={<MappaPage />} />
            <Route path="/contatti" element={<ContattiPage />} />
          </Routes>
        </Suspense>
      </Router>
    </FilterProvider>
  );
}
