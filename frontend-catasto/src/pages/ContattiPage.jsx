import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContattiPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-main font-serif">
      <Header showHomeLink={true} />

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-10">
        <h2 className="text-3xl font-bold mb-6 text-primary">Contattaci</h2>
        
        <div className="bg-bg-dark border border-border-color rounded-lg p-6 md:p-8 shadow-lg">
          <p className="mb-6 leading-relaxed text-text-muted">
            Siamo a disposizione per qualsiasi informazione, richiesta o feedback relativo al progetto Catasto Fiorentino. 
            Utilizza i seguenti recapiti per metterti in contatto con noi. I campi di questa pagina sono attualmente dei modelli e verranno aggiornati a breve con le informazioni definitive.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-text-main border-b border-border-color pb-2 mb-4">
                Recapiti
              </h3>
              
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">Email Principale</h4>
                  <p className="text-text-muted mt-1">info@tua-email.com</p>
                  <p className="text-sm text-text-symbols italic mt-1">(Supporto generale e informazioni)</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">Telefono</h4>
                  <p className="text-text-muted mt-1">+39 012 345 6789</p>
                  <p className="text-sm text-text-symbols italic mt-1">(Disponibile dal Lunedì al Venerdì, 9:00 - 17:00)</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">Sede Operativa</h4>
                  <p className="text-text-muted mt-1">
                    Via dell'Archivio Storico, 42<br />
                    50100 Firenze (FI) - Italia
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-text-main border-b border-border-color pb-2 mb-4">
                Richiedi Informazioni
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Per richieste specifiche in merito all'accesso ai database, all'utilizzo tecnico delle mappe Nodegoat, o 
                per segnalazioni di migliorie, ti invitiamo a mandare un'email direttamente ai responsabili del progetto.
              </p>
              
              {/* This is just a visual placeholder, doesn't do anything yet */}
              <div className="mt-4 p-4 border border-dashed border-border-color rounded bg-bg-hover text-center text-sm text-text-symbols">
                <p>Modulo di contatto rapido in arrivo nelle prossime versioni.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
