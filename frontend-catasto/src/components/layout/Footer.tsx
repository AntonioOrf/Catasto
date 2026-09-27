import { Link } from 'react-router-dom';
import { useT } from '../../i18n';
import { footerMessages } from './Footer.messages';

export default function Footer() {
  const t = useT(footerMessages);

  return (
    <footer className="bg-bg-sidebar border-t border-border-base py-4 px-6 text-sm text-center text-text-accent mt-auto">
      <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
        <div>
          {t("copyright", { year: new Date().getFullYear() })}
        </div>
        <div className="flex space-x-4">
          <Link to="/informazioni" className="hover:text-primary transition-colors">
            {t("info")}
          </Link>
          <Link to="/contatti" className="hover:text-primary transition-colors">
            {t("contacts")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
