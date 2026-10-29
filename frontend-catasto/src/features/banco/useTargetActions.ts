import { useCallback, useState } from "react";
import { SELECTION_MAX_FUOCHI } from "@catasto/shared";
import { useT } from "../../i18n";
import type { AddTarget } from "./add-target";
import { finderMessages } from "./finder.messages";

/** Esito dell'ultima azione, mostrato in basso; `undo` rimette la lista di prima. */
export interface Notice {
  text: string;
  undo?: () => void;
}

export interface TargetActions {
  /** Aggiunge; `label` è il nome del fuoco quando ne entra uno solo. */
  add: (ids: number[], label: string) => void;
  remove: (id: number, label: string) => void;
  /** Aggiunge se manca, toglie se c'è: la colonna a sinistra della tabella. */
  toggle: (id: number, label: string) => void;
  notice: Notice | null;
  notify: (notice: Notice | null) => void;
}

/**
 * Aggiungere e togliere fuochi dalla destinazione (selezione o raccolta) con
 * lo stesso messaggio e lo stesso «Annulla» da ovunque: ricerca, elenco
 * incollato, tabella, pannello della raccolta.
 */
export function useTargetActions(target: AddTarget): TargetActions {
  const t = useT(finderMessages);
  const [notice, notify] = useState<Notice | null>(null);
  const nome = target.nome;

  const add = useCallback(
    (ids: number[], label: string) => {
      const before = target.ids;
      if (ids.length === 1 && target.has(ids[0])) {
        notify({ text: t("already", { nome: label, in: nome ? t("inCollection", { nome }) : t("inSelection") }) });
        return;
      }
      if (target.full) {
        notify({ text: t("full", { dest: nome ? t("fullCollection", { nome }) : t("fullSelection"), max: SELECTION_MAX_FUOCHI }) });
        return;
      }
      const added = target.add(ids);
      if (added.length === 0) return;
      const to = nome ? t("toCollection", { nome }) : t("toSelection");
      notify({
        text: added.length === 1 ? t("added", { nome: label, to }) : t("addedMany", { n: added.length, to }),
        undo: () => target.restore(before),
      });
    },
    [target, nome, t],
  );

  const remove = useCallback(
    (id: number, label: string) => {
      const before = target.ids;
      target.remove([id]);
      notify({
        text: t("removed", { nome: label, from: nome ? t("fromCollection", { nome }) : t("fromSelection") }),
        undo: () => target.restore(before),
      });
    },
    [target, nome, t],
  );

  const toggle = useCallback(
    (id: number, label: string) => (target.has(id) ? remove(id, label) : add([id], label)),
    [target, add, remove],
  );

  return { add, remove, toggle, notice, notify };
}
