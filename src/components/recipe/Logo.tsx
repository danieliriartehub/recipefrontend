import { Recycle } from "lucide-react";

export const Logo = ({ size = 36, showText = true, light = false }: { size?: number; showText?: boolean; light?: boolean }) => (
  <div className="flex items-center gap-2">
    <div
      className="flex items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow"
      style={{ width: size, height: size }}
    >
      <Recycle style={{ width: size * 0.6, height: size * 0.6 }} strokeWidth={2.5} />
    </div>
    {showText && (
      <span
        className={`font-display text-2xl font-extrabold tracking-tight ${
          light ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        RECIPE
      </span>
    )}
  </div>
);
