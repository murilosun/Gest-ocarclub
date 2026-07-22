import { LucideIcon } from "lucide-react";
import { PALETTE } from "@/lib/utils";

interface ButtonProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  style?: React.CSSProperties;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export function PrimaryButton({ children, icon: Icon, onClick, style, type = "button", className = "" }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={style}
      className={`inline-flex items-center justify-center gap-2 px-4 h-10 rounded-[11px] bg-primary text-primary-foreground font-medium text-sm transition-all hover:brightness-110 active:scale-[0.98] ${className}`}
    >
      {Icon && <Icon size={15} strokeWidth={2.4} />}
      {children}
    </button>
  );
}

interface GhostButtonProps extends ButtonProps {
  danger?: boolean;
}

export function GhostButton({ children, icon: Icon, onClick, danger, style, className = "" }: GhostButtonProps) {
  const dangerStyle = danger
    ? { color: PALETTE.danger, borderColor: `${PALETTE.danger}55` }
    : {};

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...dangerStyle, ...style }}
      className={`inline-flex items-center justify-center gap-2 px-3 h-9 rounded-[10px] border border-border bg-transparent text-foreground font-medium text-sm transition-all hover:bg-muted/40 active:scale-[0.98] ${className}`}
    >
      {Icon && <Icon size={15} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

interface IconBtnProps {
  icon: LucideIcon;
  onClick?: () => void;
  title?: string;
  className?: string;
}

export function IconBtn({ icon: Icon, onClick, title, className = "" }: IconBtnProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground transition-all hover:bg-muted/40 hover:text-foreground active:scale-95 ${className}`}
    >
      <Icon size={16} />
    </button>
  );
}
