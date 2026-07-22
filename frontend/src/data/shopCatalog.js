// Display-only copy of the backend catalog (backend/services/shopCatalog.js
// is what actually enforces cost on purchase - keep these two in sync).

export const AVATARS = [
  { id: "default", name: "Default", cost: 0 },
  { id: "ember_fox", name: "Ember Fox", cost: 100 },
  { id: "moss_owl", name: "Moss Owl", cost: 150 },
  { id: "clay_wolf", name: "Clay Wolf", cost: 200 },
  { id: "ocean_otter", name: "Ocean Otter", cost: 250 },
  { id: "galaxy_cat", name: "Galaxy Cat", cost: 350 },
];

export const THEMES = [
  { id: "app", name: "Default", cost: 0 },
  { id: "ocean", name: "Ocean", cost: 200 },
  { id: "forest", name: "Forest", cost: 200 },
  { id: "galaxy", name: "Galaxy", cost: 300 },
  { id: "dark", name: "Midnight", cost: 150 },
];
