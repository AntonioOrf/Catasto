import { useEffect, useRef, type RefObject } from "react";

/**
 * Comportamento comune delle finestre modali: Esc chiude, il Tab resta dentro
 * la finestra, alla chiusura il focus torna dove era, e lo scroll della pagina
 * resta bloccato finché c'è almeno una modale aperta.
 *
 * Le modali possono sovrapporsi (la segnalazione si apre sopra il visore):
 * lo stack fa sì che solo quella in cima reagisca a Esc e Tab, e che chiudere
 * quella sopra non riattivi lo scroll sotto quella ancora aperta.
 */
const stack: RefObject<HTMLElement | null>[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModal(
  isOpen: boolean,
  onClose: () => void,
  ref: RefObject<HTMLElement | null>,
) {
  // Ref e non dipendenza dell'effetto: i chiamanti passano spesso una
  // callback inline, che riaggancerebbe i listener a ogni render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    stack.push(ref);
    document.body.style.overflow = "hidden";
    ref.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== ref || !ref.current) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== "Tab") return;
      const focusable = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.tabIndex >= 0,
      );
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !ref.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !ref.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      stack.splice(stack.indexOf(ref), 1);
      if (stack.length === 0) document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [isOpen, ref]);
}
