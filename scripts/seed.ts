import "dotenv/config";
import { connectDB } from "../lib/mongodb";
import { Product } from "../models/Product";
import { slugify } from "../lib/utils";

type Seed = {
  name: string; description: string; shortDescription: string;
  price: number; discount?: number; category: string; subcategory?: string;
  stock: number; sku: string; keywords: string[]; featured?: boolean;
  specifications?: Record<string, string>;
};

const products: Seed[] = [
  { name: "Alder Standing Desk", description: "Electric sit-stand desk with a solid oak top and a whisper-quiet dual motor.", shortDescription: "Electric sit-stand desk, solid oak top", price: 720, discount: 10, category: "Desk", subcategory: "Standing", stock: 24, sku: "DSK-ALDER-01", featured: true, keywords: ["desk", "standing", "oak", "electric"], specifications: { Material: "Solid oak + steel", Height: "60–125 cm", Width: "140 cm" } },
  { name: "Nordic Task Chair", description: "Ergonomic mesh task chair with adaptive lumbar support.", shortDescription: "Ergonomic mesh chair", price: 380, category: "Seating", stock: 40, sku: "CHR-NORD-01", featured: true, keywords: ["chair", "ergonomic", "mesh"], specifications: { Material: "Mesh + aluminium", Recline: "4 positions" } },
  { name: "Halo Desk Lamp", description: "Adjustable LED lamp with warm-to-cool temperature control.", shortDescription: "Adjustable LED desk lamp", price: 145, discount: 15, category: "Lighting", stock: 62, sku: "LMP-HALO-01", featured: true, keywords: ["lamp", "led", "desk"], specifications: { Power: "9 W", Temperature: "2700–6500 K" } },
  { name: "Ridge Wireless Keyboard", description: "Low-profile mechanical keyboard with hot-swappable switches.", shortDescription: "Low-profile mechanical keyboard", price: 189, category: "Accessories", subcategory: "Input", stock: 55, sku: "KBD-RIDGE-01", featured: true, keywords: ["keyboard", "mechanical", "wireless"] },
  { name: "Cove Monitor Stand", description: "Solid walnut monitor riser with a built-in cable channel.", shortDescription: "Walnut monitor riser", price: 95, category: "Accessories", subcategory: "Desk", stock: 80, sku: "ACC-COVE-01", keywords: ["monitor", "stand", "walnut"] },
  { name: "Mariner Leather Mat", description: "Full-grain leather desk mat that ages beautifully.", shortDescription: "Full-grain leather desk mat", price: 110, category: "Accessories", subcategory: "Desk", stock: 45, sku: "ACC-MARN-01", keywords: ["leather", "desk mat"] },
  { name: "Atlas Storage Cabinet", description: "Steel cabinet with adjustable shelves and soft-close doors.", shortDescription: "Steel storage cabinet", price: 460, category: "Storage", stock: 12, sku: "STO-ATLS-01", keywords: ["storage", "cabinet", "steel"] },
  { name: "Solstice Wall Clock", description: "Minimalist wall clock with a brushed brass face.", shortDescription: "Brass wall clock", price: 85, category: "Accessories", subcategory: "Wall", stock: 70, sku: "ACC-SOLS-01", keywords: ["clock", "wall", "brass"] },
  { name: "Meridian Notebook", description: "Lay-flat hardcover notebook, 200 pages, 100 gsm paper.", shortDescription: "Lay-flat hardcover notebook", price: 32, category: "Accessories", subcategory: "Stationery", stock: 200, sku: "ACC-MERI-01", keywords: ["notebook", "stationery"] },
  { name: "Pier Adjustable Shelving", description: "Modular wall shelving with powder-coated steel frame.", shortDescription: "Modular wall shelving", price: 340, discount: 20, category: "Storage", stock: 18, sku: "STO-PIER-01", keywords: ["shelving", "wall", "modular"] },
  { name: "Compass Floor Lamp", description: "Arched floor lamp with a dimmable warm glow.", shortDescription: "Arched floor lamp", price: 265, category: "Lighting", stock: 22, sku: "LMP-CMPS-01", keywords: ["lamp", "floor", "dimming"] },
  { name: "Trail Cable Organizer", description: "Magnetic cable clips that keep your desk tidy.", shortDescription: "Magnetic cable organizer", price: 24, category: "Accessories", subcategory: "Desk", stock: 150, sku: "ACC-TRAIL-01", keywords: ["cable", "organizer", "magnetic"] },
  { name: "Beacon Drafting Chair", description: "Tall stool with adjustable footrest for standing desks.", shortDescription: "Tall drafting stool", price: 290, category: "Seating", subcategory: "Stools", stock: 30, sku: "CHR-BEAC-01", keywords: ["stool", "drafting", "chair"] },
  { name: "Harbor Desk Organizer", description: "Solid ash wood organizer for pens, cards and small tools.", shortDescription: "Solid ash organizer", price: 78, category: "Accessories", subcategory: "Desk", stock: 65, sku: "ACC-HARB-01", keywords: ["organizer", "ash", "wood"] },
  { name: "Lantern Reading Light", description: "Portable rechargeable reading light with three brightness levels.", shortDescription: "Portable rechargeable light", price: 58, category: "Lighting", stock: 90, sku: "LMP-LANT-01", keywords: ["reading", "portable", "light"] },
  { name: "Kestrel Ergonomic Footrest", description: "Adjustable footrest with textured surface and memory foam.", shortDescription: "Adjustable footrest", price: 68, category: "Accessories", subcategory: "Seating", stock: 55, sku: "ACC-KEST-01", keywords: ["footrest", "ergonomic"] },
  { name: "Ember Ceramic Mug", description: "Hand-thrown stoneware mug, matte glaze, 12 oz.", shortDescription: "Stoneware mug, 12 oz", price: 34, category: "Accessories", subcategory: "Home", stock: 120, sku: "ACC-EMBR-01", keywords: ["mug", "ceramic", "stoneware"] },
  { name: "Cascade Bookshelf", description: "Staggered open bookshelf in solid walnut.", shortDescription: "Walnut open bookshelf", price: 590, category: "Storage", stock: 8, sku: "STO-CASC-01", keywords: ["bookshelf", "walnut"] },
  { name: "Vertex Wireless Mouse", description: "Silent-click ergonomic mouse with precision tracking.", shortDescription: "Silent ergonomic mouse", price: 79, category: "Accessories", subcategory: "Input", stock: 110, sku: "ACC-VRTX-01", keywords: ["mouse", "wireless", "ergonomic"] },
  { name: "Rowan Laptop Stand", description: "Aluminium laptop stand with adjustable tilt.", shortDescription: "Aluminium laptop stand", price: 92, discount: 10, category: "Accessories", subcategory: "Desk", stock: 75, sku: "ACC-ROWN-01", keywords: ["laptop", "stand", "aluminium"] },
];

async function main() {
  await connectDB();
  console.log("Connected to MongoDB");

  await Product.deleteMany({});
  console.log("Cleared existing products");

  const docs = products.map((p, i) => ({
    ...p,
    slug: slugify(p.name),
    images: [`https://picsum.photos/seed/flowline-${i}/900/900`],
    discount: p.discount ?? 0,
    shortDescription: p.shortDescription,
    subcategory: p.subcategory ?? "",
    specifications: p.specifications ?? {},
    keywords: p.keywords,
    featured: p.featured ?? false,
    active: true,
    rating: Math.round((4 + Math.random()) * 10) / 10,
    reviewCount: Math.floor(Math.random() * 200) + 20,
    sold: Math.floor(Math.random() * 500),
  }));

  await Product.insertMany(docs);
  console.log(`Inserted ${docs.length} products`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });