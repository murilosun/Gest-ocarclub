interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export function Avatar({ name, size = 34, className = "" }: AvatarProps) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-primary/10 text-primary font-semibold select-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  );
}
