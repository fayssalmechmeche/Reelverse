import { useLoginStreak } from "../loginStreak/useLoginStreak";
import { useQuests } from "./useQuests";

/**
 * Nombre de récompenses prêtes à être récupérées :
 * la récompense de connexion du jour + les quêtes terminées non récupérées.
 */
export function useClaimableRewards(): number {
  const { data: loginStreak } = useLoginStreak();
  const { data: quests } = useQuests();

  const streak = loginStreak?.claimable ? 1 : 0;
  const readyQuests =
    quests?.filter((q) => q.readyToClaim && !q.claimed).length ?? 0;

  return streak + readyQuests;
}
