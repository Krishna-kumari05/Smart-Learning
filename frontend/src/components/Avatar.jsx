// Renders a simple colored circular avatar with the user's initial.
// Avatars are style/color unlocks (no external image assets needed), matching
// what the catalog defines in shopCatalog.js.
export default function Avatar({ avatarId, name, size = "md" }) {
  const sizes = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-16 h-16 text-2xl",
  };

  const colors = {
    default: "#E8A33D",
    ember_fox: "#E8A33D",
    moss_owl: "#5C7A5C",
    clay_wolf: "#B5654A",
    ocean_otter: "#3E7C9C",
    galaxy_cat: "#8B5FBF",
  };

  const color = colors[avatarId] || colors.default;
  const initial = (name || "?").charAt(0).toUpperCase();

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-display font-semibold text-ink shrink-0`}
      style={{ backgroundColor: color }}
    >
      {initial}
    </div>
  );
}
