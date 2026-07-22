interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className = "", style }: CardProps) {
  return (
    <div
      className={`bg-card rounded-2xl border border-card-border p-5 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
