type OptimaLogoProps = {
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
};

export function OptimaLogo({ className = "h-8 w-8" }: OptimaLogoProps) {
  return (
    <img
      src="/optima-logo.png"
      alt="Optima"
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
