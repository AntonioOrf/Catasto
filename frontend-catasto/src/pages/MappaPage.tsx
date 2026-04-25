import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function MappaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-main font-serif">
      <Header showHomeLink={true} />

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-10 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold mb-6 text-primary">Mappa del Catasto</h2>
        <div className="bg-bg-sidebar border border-border-base rounded-lg p-10 shadow-lg text-center">
          <p className="text-xl italic text-text-accent">
            La funzionalità mappa è attualmente in fase di sviluppo.
          </p>
          <p className="mt-4 text-text-main">
            Presto sarà possibile visualizzare la distribuzione geografica dei fuochi sulla mappa storica di Firenze.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
