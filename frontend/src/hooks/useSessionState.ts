import { useEffect, useState } from "react";

/**
 * Comme useState, mais la valeur survit à la navigation (ex: ouvrir une fiche
 * puis revenir en arrière) en la gardant dans sessionStorage, propre à l'onglet.
 */
export function useSessionState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // stockage indisponible (navigation privée, quota) : on ignore
    }
  }, [key, value]);

  return [value, setValue] as const;
}
