import { useEffect, useRef } from "react";

/** Ms since the form mounted; `/api/lead` of a tenant ignores submissions faster than a person can type (E11-S01). */
export function useFillTimer() {
  const mountedAt = useRef(0);
  useEffect(() => { mountedAt.current = Date.now(); }, []);
  return () => (mountedAt.current ? Date.now() - mountedAt.current : 0);
}
