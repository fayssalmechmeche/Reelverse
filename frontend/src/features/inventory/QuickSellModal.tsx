import { useState } from "react";
import { useSellCard } from "./useInventory";

export interface QuickSellTarget {
  id: number; // UserCard id
  name: string;
  quantity: number;
}

// Modal de vente rapide (contre Coins, 0% taxe), partagé entre "Ma Collection"
// et les pages de détail (Acteur/Film/Série).
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
      <div className="w-full max-w-md rounded-2xl bg-[#121217] border border-white/15 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-[#F59E0B]">
              Vente rapide • 0% Taxe
            </span>
            <h3 className="text-lg font-black text-[#F3F4F6]">
              Vendre {target.name}
            </h3>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white">
            ✕
          </button>
        </div>

        <p className="text-xs text-[#9CA3AF]">
          Vous possédez{" "}
          <strong className="text-white">×{target.quantity}</strong> copie(s).
        </p>

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
          </div>
        </div>

        {actionError && <p className="text-[#F87171] text-sm">{actionError}</p>}

        <div className="flex items-center justify-end gap-2 pt-2">
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
            Vendre
          </button>
        </div>
      </div>
    </div>
  );
}
