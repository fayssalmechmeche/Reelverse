import { useState } from "react";
import { useSellCard } from "./useInventory";
import { QUICK_SELL_PRICE } from "./sellPricing";
import { RARITY_CONFIG, type RarityKey } from "../../design/rarity";

export interface QuickSellTarget {
  id: number; // UserCard id
  name: string;
  quantity: number;
  imageUrl?: string | null;
  rarity?: RarityKey | null;
  typeLabel?: string;
}

// Modal de vente rapide (contre Coins, 0% taxe), partagé entre "Ma Collection",
// les pages de détail et l'ouverture de pack.
export function QuickSellModal({
  target,
  onClose,
  onSold,
}: {
  target: QuickSellTarget;
  onClose: () => void;
  onSold?: () => void;
}) {
  const sellCard = useSellCard();
  const [sellAmount, setSellAmount] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  const unitPrice = target.rarity ? QUICK_SELL_PRICE[target.rarity] : null;
  const total = unitPrice !== null ? unitPrice * sellAmount : null;
  const remaining = target.quantity - sellAmount;
  const rarityConfig = target.rarity ? RARITY_CONFIG[target.rarity] : null;

  function confirmSell() {
    setActionError(null);
    sellCard.mutate(
      { id: target.id, quantity: sellAmount },
      {
        onSuccess: () => (onSold ?? onClose)(),
        onError: (err: Error) => setActionError(err.message),
      },
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-[#121217] border border-white/15 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-bold uppercase text-[#F59E0B]">
            Vente rapide • 0% Taxe
          </span>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#181820] border border-white/10">
          <div className="w-16 aspect-[2/3] rounded-lg overflow-hidden bg-[#0B0B0E] shrink-0">
            {target.imageUrl && (
              <img
                src={target.imageUrl}
                alt={target.name}
                className="w-full h-full object-cover object-top"
              />
            )}
          </div>
          <div className="min-w-0 space-y-1">
            {rarityConfig && (
              <span
                style={rarityConfig.badgeStyle}
                className="inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              >
                {rarityConfig.label}
              </span>
            )}
            <h3 className="text-base font-black text-[#F3F4F6] leading-tight">
              {target.name}
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              {target.typeLabel ? `${target.typeLabel} • ` : ""}Vous en possédez{" "}
              <strong className="text-white">×{target.quantity}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-[#181820] p-3.5 rounded-xl border border-white/10">
          <span className="text-xs font-semibold text-[#9CA3AF]">
            Quantité à vendre
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSellAmount((q) => Math.max(1, q - 1))}
              className="w-7 h-7 rounded-lg bg-[#22222C] font-bold text-white"
            >
              -
            </button>
            <span className="font-black text-sm w-6 text-center">
              {sellAmount}
            </span>
            <button
              onClick={() =>
                setSellAmount((q) => Math.min(target.quantity, q + 1))
              }
              className="w-7 h-7 rounded-lg bg-[#22222C] font-bold text-white"
            >
              +
            </button>
            {target.quantity > 1 && (
              <button
                onClick={() => setSellAmount(target.quantity)}
                className="ml-1 px-2 h-7 rounded-lg bg-[#22222C] text-[10px] font-bold uppercase text-[#9CA3AF] hover:text-white"
              >
                Tout
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-[#181820] border border-white/10 p-3.5 space-y-1.5 text-xs">
          {unitPrice !== null && total !== null && (
            <>
              <div className="flex justify-between text-[#9CA3AF]">
                <span>Prix unitaire</span>
                <span className="font-bold text-[#F3F4F6]">
                  {unitPrice} Coins
                </span>
              </div>
              <div className="flex justify-between text-[#9CA3AF]">
                <span>Quantité</span>
                <span className="font-bold text-[#F3F4F6]">×{sellAmount}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-white/10 text-sm">
                <span className="font-bold text-[#F3F4F6]">Vous gagnez</span>
                <span className="font-black text-[#F59E0B]">
                  +{total} Coins
                </span>
              </div>
            </>
          )}
          <div
            className={`flex justify-between text-[#9CA3AF] ${
              unitPrice !== null ? "pt-1.5 border-t border-white/10" : ""
            }`}
          >
            <span>Il vous en restera</span>
            <span
              className={`font-bold ${remaining === 0 ? "text-[#E50914]" : "text-[#F3F4F6]"}`}
            >
              ×{remaining}
            </span>
          </div>
        </div>

        {remaining === 0 && (
          <p className="text-[11px] text-[#F59E0B]">
            C'est votre dernier exemplaire : la carte repassera dans vos cartes
            manquantes.
          </p>
        )}

        {actionError && <p className="text-[#F87171] text-sm">{actionError}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#181820] text-xs font-bold text-[#9CA3AF]"
          >
            Annuler
          </button>
          <button
            onClick={confirmSell}
            disabled={sellCard.isPending}
            className="px-4 py-2 rounded-xl bg-[#E50914] text-white text-xs font-black uppercase disabled:opacity-50"
          >
            {total !== null ? `Vendre (+${total} Coins)` : "Vendre"}
          </button>
        </div>
      </div>
    </div>
  );
}
