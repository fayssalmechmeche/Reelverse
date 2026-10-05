import { useEffect, useRef } from "react";

/**
 * Mémorise la position de scroll de la page pendant qu'on est dessus, et la
 * restaure une fois que le contenu est prêt (`ready`), au retour sur l'écran.
 */
export function useScrollRestoration(key: string, ready: boolean) {
  const storageKey = `scroll:${key}`;
  const restored = useRef(false);

  useEffect(() => {
    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(storageKey, String(window.scrollY));
        } catch {
          // ignoré
        }
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [storageKey]);

  useEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    try {
      const saved = Number(sessionStorage.getItem(storageKey));
      if (saved > 0) {
        requestAnimationFrame(() => window.scrollTo(0, saved));
      }
    } catch {
      // ignoré
    }
  }, [ready, storageKey]);
}
