import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function InfoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-main font-serif">
      <Header showHomeLink={true} />

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-10">
        <h2 className="text-3xl font-bold mb-6 text-primary">Informazioni</h2>
        <div className="bg-bg-sidebar border border-border-base rounded-lg p-6 shadow-lg mb-8">
          <h3 className="text-xl font-bold mb-4 text-primary">Progetto Catasto</h3>
          <p className="mb-4 leading-relaxed">
            Questa applicazione web permette di esplorare e analizzare i dati estratti dal Catasto Fiorentino del 1427.
            Il progetto è un'iniziativa volta a facilitare la consultazione di documenti e archivi storici, 
            permettendo ricerche avanzate, filtraggi e l'esplorazione guidata del materiale tramite un innovativo viewer IIIF integrato.
          </p>
          <p className="leading-relaxed">
            Le informazioni presenti in questo database sono state fedelmente trascritte e organizzate, rispettando 
            i volumi e i registri originali.
          </p>
        </div>

        <div className="bg-bg-sidebar border border-border-base rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-primary">Crediti</h3>
          <ul className="list-disc list-inside space-y-2 text-text-main">
            <li><strong>Sviluppo:</strong> Antonio Orfitelli, Pasquale Ruotolo</li>
            <li><strong>Digitalizzazione:</strong> Team di archivisti e ricercatori</li>
            <li><strong>Tecnologie utilizzate:</strong> React, TailwindCSS, Node.js, Express, MySQL</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
