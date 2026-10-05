interface AvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  compact?: boolean;
}

export function Avatar({
  src,
  name,
  className = "w-14 h-14 text-xl",
  compact = false,
}: AvatarProps) {
  return (
    <div
      className={`bg-[#181820] overflow-hidden flex items-center justify-center font-black text-[#F3F4F6] shrink-0 ${
        compact
          ? "rounded-xl border border-white/10"
          : "rounded-2xl border-2 border-[#E50914]"
      } ${className}`}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}
