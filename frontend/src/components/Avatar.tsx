interface AvatarProps {
  src?: string | null;
  name: string;
  className?: string;
}

export function Avatar({
  src,
  name,
  className = "w-14 h-14 text-xl",
}: AvatarProps) {
  return (
    <div
      className={`rounded-2xl bg-[#181820] border-2 border-[#E50914] overflow-hidden flex items-center justify-center font-black text-[#F3F4F6] shrink-0 ${className}`}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}
