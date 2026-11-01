interface SpinnerProps {
  /** Dimensioni e margini, es. "h-8 w-8". */
  className?: string;
  /** Testo per i lettori di schermo; ometterlo se accanto c'è già un testo visibile. */
  label?: string;
  /** Su fondo scuro (es. il visore delle carte) il segno passa al chiaro. */
  inverted?: boolean;
}

/**
 * Unico indicatore di caricamento del portale: stesso segno in ogni schermata.
 * Una carta d'archivio su cui le righe si scrivono una dopo l'altra, in tema
 * con le portate del catasto. Con "riduci movimento" la carta resta scritta e ferma.
 */
export default function Spinner({ className = "h-8 w-8", label, inverted = false }: SpinnerProps) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block ${inverted ? "text-white/80" : "text-primary"} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="writing-page h-full w-full"
      >
        <path d="M6 2.75h8.5l4.5 4.5v14H6z" />
        <path d="M14.5 2.75v4.5H19" opacity={0.6} />
        <path className="writing-line writing-line-1" pathLength={1} d="M8.5 11h8" />
        <path className="writing-line writing-line-2" pathLength={1} d="M8.5 14.5h8" />
        <path className="writing-line writing-line-3" pathLength={1} d="M8.5 18h5" />
      </svg>
    </span>
  );
}
