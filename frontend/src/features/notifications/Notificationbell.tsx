import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Settings, ArrowLeft } from "lucide-react";
import {
  useMarkNotificationsRead,
  useNotificationPreferences,
  useNotifications,
  useUpdateNotificationPreferences,
} from "./useNotifications";

function timeAgo(iso: string): string {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000),
  );
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { data } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const updatePrefs = useUpdateNotificationPreferences();

  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  // Notifications non lues à l'ouverture : on les garde mises en avant pendant la consultation.
  const [highlightIds, setHighlightIds] = useState<number[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const { data: prefs } = useNotificationPreferences(open && showPrefs);

  const unreadCount = data?.unreadCount ?? 0;
  const items = data?.items ?? [];

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setShowPrefs(false);
    setHighlightIds(items.filter((n) => !n.read).map((n) => n.id));
    setOpen(true);
    if (unreadCount > 0) markRead.mutate(undefined);
  }

  function togglePref(type: string, enabled: boolean) {
    if (!prefs) return;
    const next: Record<string, boolean> = {};
    for (const t of prefs.types) next[t.type] = t.enabled;
    next[type] = enabled;
    updatePrefs.mutate(next);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        title="Notifications"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
            : "Notifications"
        }
        className="relative p-2 rounded-xl bg-[#121217] hover:bg-[#181820] border border-white/[0.08] text-[#9CA3AF] hover:text-white"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] px-1 py-0.5 rounded-full bg-[#E50914] text-white text-[10px] font-black text-center leading-none border border-[#0B0B0E]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-[4.25rem] sm:top-full sm:mt-2 sm:w-96 max-h-[70vh] overflow-y-auto rounded-2xl bg-[#121217] border border-white/15 shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] sticky top-0 bg-[#121217]">
            {showPrefs ? (
              <button
                type="button"
                onClick={() => setShowPrefs(false)}
                className="flex items-center gap-1.5 text-sm font-black text-[#F3F4F6]"
              >
                <ArrowLeft className="w-4 h-4" />
                Préférences
              </button>
            ) : (
              <span className="text-sm font-black text-[#F3F4F6]">
                Notifications
              </span>
            )}
            {!showPrefs && (
              <button
                type="button"
                onClick={() => setShowPrefs(true)}
                title="Préférences"
                className="text-[#9CA3AF] hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>

          {showPrefs ? (
            <div className="p-2">
              {!prefs && (
                <p className="p-3 text-xs text-[#9CA3AF]">Chargement...</p>
              )}
              {prefs?.types.map((t) => (
                <label
                  key={t.type}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-[#181820] cursor-pointer"
                >
                  <span className="text-xs text-[#F3F4F6]">{t.label}</span>
                  <input
                    type="checkbox"
                    checked={t.enabled}
                    onChange={(e) => togglePref(t.type, e.target.checked)}
                    className="w-4 h-4 accent-[#E50914]"
                  />
                </label>
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="p-6 text-center text-xs text-[#9CA3AF]">
              Aucune notification pour le moment.
            </p>
          ) : (
            <ul>
              {items.map((n) => {
                const isNew = highlightIds.includes(n.id);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        if (n.link) navigate(n.link);
                      }}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-white/[0.05] hover:bg-[#181820] ${
                        isNew ? "bg-[#E50914]/[0.07]" : ""
                      }`}
                    >
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                          isNew ? "bg-[#E50914]" : "bg-transparent"
                        }`}
                      />
                      <span className="min-w-0">
                        <span className="block text-xs text-[#F3F4F6] leading-snug">
                          {n.message}
                        </span>
                        <span className="block text-[10px] text-[#9CA3AF] mt-0.5">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
