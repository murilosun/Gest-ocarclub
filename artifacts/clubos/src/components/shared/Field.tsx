interface FieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, children, className = "" }: FieldProps) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
