import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { useCreateListing } from "./useMarketplace";
import { PriceHints } from "./PriceHints";
import { TAX_PERCENT } from "./marketplaceConfig";

export interface QuickListTarget {
  cardId: number;
  name: string;
  imageUrl: string | null;
  rarityLabel: string;
  quantity: number;
}

// Mise en vente directe sur le marché depuis une carte déjà connue (ex : pendant
// l'ouverture d'un pack). Même règles et mêmes repères de prix que le marché.
export function QuickListModal({
  target,
  onClose,
  onListed,
}: {
  target: QuickListTarget;
  onClose: () => void;
  onListed: () => void;
}) {
  const createListing = useCreateListing();
  const [price, setPrice] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const grossPrice = Math.max(10, Math.round(price || 0));
  const taxAmount = Math.ceil((grossPrice * TAX_PERCENT) / 100);
  const netSeller = grossPrice - taxAmount;

  function submit() {
    setError(null);
    createListing
      .mutateAsync({ cardId: target.cardId, price: grossPrice })
      .then(onListed)
      .catch((err: Error) => setError(err.message));
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-[#121217] border border-white/15 p-5 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-[#F59E0B]">
              Marketplace • Taxe de vente {TAX_PERCENT}%
            </span>
            <h3 className="text-lg font-black text-[#F3F4F6]">
              Mettre en vente
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#181820] border border-[#F59E0B]/40">
          <div className="w-14 h-20 rounded-lg overflow-hidden bg-[#0B0B0E] shrink-0">
            {target.imageUrl && (
              <img
                src={target.imageUrl}
                alt={target.name}
                className="w-full h-full object-cover object-top"
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-[#F3F4F6] truncate">
              {target.name}
            </div>
            <div className="text-[11px] text-[#9CA3AF] mt-0.5 capitalize">
              {target.rarityLabel} • Dispo : ×{target.quantity}
            </div>
          </div>
        </div>

        <PriceHints cardId={target.cardId} onPick={setPrice} />

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#9CA3AF]">
            Votre prix de vente
          </label>
          <input
            type="number"
            min={10}
            step={1}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full p-2.5 rounded-xl bg-[#181820] border border-white/15 font-black text-sm text-[#F59E0B]"
          />
        </div>

        <div className="rounded-xl bg-[#181820] border border-white/10 p-3.5 space-y-1.5 text-xs">
          <div className="flex justify-between text-[#9CA3AF]">
            <span>Prix payé par l'acheteur</span>
            <span className="font-bold text-[#F3F4F6]">{grossPrice} Coins</span>
          </div>
          <div className="flex justify-between text-[#9CA3AF]">
            <span>Taxe du Marché ({TAX_PERCENT}%)</span>
            <span className="font-bold text-[#E50914]">-{taxAmount} Coins</span>
          </div>
          <div className="flex justify-between pt-1.5 border-t border-white/10 text-sm">
            <span className="font-bold text-[#F3F4F6]">Vous recevrez</span>
            <span className="font-black text-[#F59E0B]">{netSeller} Coins</span>
          </div>
        </div>

        <p className="text-[11px] text-[#9CA3AF]">
          🔒 Votre copie sera réservée tant que l'annonce est en ligne.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
            <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#181820] text-xs font-bold text-[#9CA3AF]"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={createListing.isPending}
            onClick={submit}
            className="px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#f6121d] text-white text-xs font-black uppercase disabled:opacity-50"
          >
            Mettre en vente ({grossPrice} Coins)
          </button>
        </div>
      </div>
    </div>
  );
}
