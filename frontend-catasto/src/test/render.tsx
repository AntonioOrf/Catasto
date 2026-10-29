import type { ReactNode } from "react";
import { render, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../i18n";

/** Provider dell'app, con un QueryClient nuovo per test e senza retry. */
export function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export const renderWithProviders = (ui: ReactNode) => render(ui, { wrapper: Wrapper });

export const renderHookWithProviders = <T,>(hook: () => T) => renderHook(hook, { wrapper: Wrapper });
