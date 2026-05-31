import { MaterialType, MATERIALS } from "@/data/mock";
import { cn } from "@/lib/utils";

interface MaterialChipProps {
  material: MaterialType;
  active?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

export const MaterialChip = ({ material, active, onClick, size = "md" }: MaterialChipProps) => {
  const m = MATERIALS[material] ?? { emoji: "♻️", label: String(material) };
  const interactive = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        "flex items-center gap-1.5 rounded-full font-medium transition-smooth border",
        size === "md" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-soft"
          : "bg-card text-foreground border-border hover:border-primary/40",
        !interactive && "cursor-default"
      )}
    >
      <span>{m.emoji}</span>
      <span>{m.label}</span>
    </button>
  );
};
