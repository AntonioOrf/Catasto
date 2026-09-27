import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { translate } from "../../i18n";
import { errorBoundaryMessages } from "./ErrorBoundary.messages";

// Componente a classe: niente hook, legge la lingua attiva al momento del render.
const t = (key: keyof (typeof errorBoundaryMessages)["it"]) => translate(errorBoundaryMessages, key);

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Ultima difesa contro gli errori di render: senza, un'eccezione in un
 * componente smonta l'intera app e lascia la pagina bianca.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Errore di render", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main text-text-main font-serif p-6">
        <div
          role="alert"
          className="bg-bg-card border border-border-base rounded-lg p-8 shadow-lg max-w-md text-center space-y-4"
        >
          <AlertCircle className="h-10 w-10 mx-auto text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
          <p className="text-text-accent">
            {t("body")}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-primary text-on-primary font-bold hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" /> {t("reload")}
          </button>
        </div>
      </div>
    );
  }
}
