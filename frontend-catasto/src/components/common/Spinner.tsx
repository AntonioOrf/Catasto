interface SpinnerProps {
  /** Dimensioni e margini, es. "h-8 w-8". */
  className?: string;
  /** Testo per i lettori di schermo; ometterlo se accanto c'è già un testo visibile. */
  label?: string;
}

/** Unico indicatore di caricamento del portale: stesso segno in ogni schermata. */
export default function Spinner({ className = "h-8 w-8", label }: SpinnerProps) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block animate-spin motion-reduce:animate-none rounded-full border-2 border-primary/25 border-t-primary ${className}`}
    />
  );
}
