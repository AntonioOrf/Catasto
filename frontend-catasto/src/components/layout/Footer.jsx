import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-bg-dark border-t border-border-color py-4 px-6 text-sm text-center text-text-muted">
      <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
        <div>
          &copy; {new Date().getFullYear()} Catasto Fiorentino del 1427/30. Tutti i diritti riservati.
        </div>
        <div className="flex space-x-4">
          <Link to="/informazioni" className="hover:text-primary transition-colors">
            Informazioni
          </Link>
          <Link to="/contatti" className="hover:text-primary transition-colors">
            Contatti
          </Link>
        </div>
      </div>
    </footer>
  );
}
