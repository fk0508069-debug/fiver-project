export const CATEGORIES = {
  Desk: ["Standing", "Sitting", "Corner"],
  Seating: ["Chairs", "Stools", "Benches"],
  Lighting: ["Desk Lamps", "Floor Lamps", "Wall Lights"],
  Storage: ["Cabinets", "Shelving", "Bookshelves"],
  Accessories: ["Desk", "Input", "Stationery", "Wall", "Home", "Seating"],
} as const;

export const CATEGORY_NAMES = Object.keys(CATEGORIES);

export function getSubcategories(category: string): readonly string[] {
  return (CATEGORIES as Record<string, readonly string[]>)[category] ?? [];
}