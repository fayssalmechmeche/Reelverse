import type { RarityKey } from "../../design/rarity";

interface CardRefLite {
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity?: RarityKey;
}

interface ResolvedCard {
  name: string;
  subtitle: string;
  imageUrl: string | null;
  typeEmoji: string;
  typeLabel: string;
}

type PendingEntry = {
  ref: CardRefLite;
  resolve: (value: ResolvedCard) => void;
  reject: (err: Error) => void;
};

let pending: PendingEntry[] = [];
let flushScheduled = false;

function scheduleFlush() {
  if (flushScheduled) return;
  flushScheduled = true;
  queueMicrotask(flush);
}

async function flush() {
  const batch = pending;
  pending = [];
  flushScheduled = false;
  if (batch.length === 0) return;

  try {
    const res = await fetch("/api/cards/resolve", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cards: batch.map((e) => ({
          type: e.ref.type,
          entityId: e.ref.entityId,
        })),
      }),
    });
    if (!res.ok) throw new Error("Erreur lors de la résolution des cartes.");
    const results: (ResolvedCard & { type: string; entityId: number })[] =
      await res.json();
    const byKey = new Map(results.map((r) => [`${r.type}:${r.entityId}`, r]));

    for (const entry of batch) {
      const found = byKey.get(`${entry.ref.type}:${entry.ref.entityId}`);
      if (found) {
        entry.resolve(found);
      } else {
        entry.reject(
          new Error(
            `Carte introuvable (${entry.ref.type}:${entry.ref.entityId}).`,
          ),
        );
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Erreur réseau.");
    for (const entry of batch) entry.reject(error);
  }
}

// Même signature que l'ancien resolveCard() : tout ce qui est appelé dans le même tick JS
// (ex. les 20 annonces du marketplace affichées d'un coup) part en UN SEUL appel réseau.
export function resolveCard(ref: CardRefLite): Promise<ResolvedCard> {
  return new Promise((resolve, reject) => {
    pending.push({ ref, resolve, reject });
    scheduleFlush();
  });
}
