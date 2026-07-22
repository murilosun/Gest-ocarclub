interface BadgeProps {
  text: string;
  color: string;
  className?: string;
}

export function Badge({ text, color, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${className}`}
      style={{
        color,
        background: `${color}1F`,
        borderColor: `${color}40`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {text}
    </span>
  );
}
