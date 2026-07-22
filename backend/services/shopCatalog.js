// Single source of truth for what's purchasable and at what cost.
// The frontend has a matching copy (src/data/shopCatalog.js) for rendering;
// this backend copy is what actually gets enforced on purchase.

const AVATARS = [
  { id: "default", name: "Default", cost: 0, color: "#E8A33D" },
  { id: "ember_fox", name: "Ember Fox", cost: 100, color: "#E8A33D" },
  { id: "moss_owl", name: "Moss Owl", cost: 150, color: "#5C7A5C" },
  { id: "clay_wolf", name: "Clay Wolf", cost: 200, color: "#B5654A" },
  { id: "ocean_otter", name: "Ocean Otter", cost: 250, color: "#3E7C9C" },
  { id: "galaxy_cat", name: "Galaxy Cat", cost: 350, color: "#8B5FBF" },
];

const THEMES = [
  { id: "app", name: "Default", cost: 0 },
  { id: "ocean", name: "Ocean", cost: 200 },
  { id: "forest", name: "Forest", cost: 200 },
  { id: "galaxy", name: "Galaxy", cost: 300 },
  { id: "dark", name: "Midnight", cost: 150 },
];

module.exports = { AVATARS, THEMES };
