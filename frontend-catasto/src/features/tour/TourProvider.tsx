import { useCallback, useMemo, useState, type ReactNode } from "react";
import { TourContext } from "./tour-context";
import { markTourSeen, tourSeen } from "./tour-storage";
import GuidedTour from "./GuidedTour";

export function TourProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const start = useCallback(() => setOpen(true), []);
  const startIfFirstVisit = useCallback(() => {
    if (!tourSeen()) setOpen(true);
  }, []);
  const finish = useCallback(() => {
    markTourSeen();
    setOpen(false);
  }, []);

  const value = useMemo(() => ({ open, start, startIfFirstVisit, finish }), [open, start, startIfFirstVisit, finish]);

  return (
    <TourContext.Provider value={value}>
      {children}
      <GuidedTour />
    </TourContext.Provider>
  );
}
