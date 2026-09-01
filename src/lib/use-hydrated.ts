import { useEffect, useState } from "react";

/** True only after hydration — used to defer drag-and-drop wiring to the client. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
