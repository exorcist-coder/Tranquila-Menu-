import { PHOTOS } from "./photos";
export type CategoryId = string;
export type When = { group: string; in: string[] };
export type Option = { id: string; label: string; price: number; when?: When };
/**
 * mode "absolute": the option price IS the dish price (e.g. which soup).
 * mode "addon": the option price is added on top (e.g. extra).
 */
export type Group = { id: string; label: string; required: boolean; mode: "absolute" | "addon"; options: Option[]; when?: When };
export type Detail = { label: string; value: string };
export type Item = { id: string; category: CategoryId; name: string; description: string; basePrice: number; groups: Group[]; /** keys into PHOTOS; none = icon placeholder */ photos?: string[]; imageUrl?: string; /** Spec rows shown on drink detail pages (Brand, Country, Style…) */ details?: Detail[] };

/** Shelf price = the PDF's 10% VAT-inclusive column (base × 1.10). This is what guests see and pay. */
export const VAT_RATE = 0.1;
/** The receipt and order message split that price into net + 7.5% VAT (see vatBreakdown in pricing.ts). */
export const RECEIPT_VAT_RATE = 0.075;
const p = (base: number) => Math.round(base * (1 + VAT_RATE));

/** Categories that use the wine-style list cards and product-detail page. */
export const DRINK_CATEGORIES = ["wines", "spirits", "beers", "soft", "water"];
export const isDrink = (category: string) => DRINK_CATEGORIES.includes(category);

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "soups", label: "Soups" },
  { id: "rice", label: "Rice & Pasta" },
  { id: "mains", label: "Mains & Grills" },
  { id: "light", label: "Light Bites" },
  { id: "wines", label: "Wines" },
  { id: "spirits", label: "Spirits" },
  { id: "beers", label: "Beers" },
  { id: "soft", label: "Soft & Hot" },
  { id: "water", label: "Water & Juice" },
];

const o = (id: string, label: string, price = 0, when?: When): Option => ({ id, label, price, ...(when ? { when } : {}) });
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const pick = (id: string, label: string, options: Option[], extra: Partial<Group> = {}): Group => ({ id, label, required: true, mode: "addon", options, ...extra });
/** Absolute-price choice list from [label, base price] pairs. */
const abs = (label: string, opts: [string, number][], id = "choice"): Group => pick(id, label, opts.map(([l, n]) => o(slug(l), l, p(n))), { mode: "absolute" });
const add = (id: string, label: string, opts: [string, number][], extra: Partial<Group> = {}): Group => pick(id, label, opts.map(([l, n]) => o(slug(l), l, p(n))), extra);
const one = (id: string, category: string, name: string, description: string, price: number, extra: Partial<Item> = {}): Item => ({ id, category, name, description, basePrice: p(price), groups: [], ...extra });
const many = (id: string, category: string, name: string, description: string, label: string, opts: [string, number][], extra: Partial<Item> = {}): Item => ({ id, category, name, description, basePrice: 0, groups: [abs(label, opts)], ...extra });
const spec = (brand: string, style: string, country?: string): Detail[] => [{ label: "Brand", value: brand }, ...(country ? [{ label: "Country", value: country }] : []), { label: "Style", value: style }];
const wine = (name: string, price: number, style: string, brand: string, country?: string): Item =>
  one(`wine-${slug(name)}`, "wines", name, `${style}, served by the bottle.`, price, { details: spec(brand, style, country) });
const spirit = (name: string, price: number, style: string, brand: string, country?: string): Item =>
  one(`spirit-${slug(name)}`, "spirits", name, `${style}, served by the measure or bottle.`, price, { details: spec(brand, style, country) });
const spiritMany = (name: string, style: string, brand: string, label: string, opts: [string, number][], country?: string): Item =>
  many(`spirit-${slug(name)}`, "spirits", name, `${style}. Choose your ${label.toLowerCase()}.`, label, opts, { details: spec(brand, style, country) });

export const ITEMS: Item[] = [
  // Breakfast
  one("english-breakfast", "breakfast", "English Breakfast", "The full plate, cooked to order.", 10000),
  one("nigerian-breakfast", "breakfast", "Nigerian Breakfast", "A hearty local morning plate.", 8000, { photos: ["yam-egg-sauce", "yam-fish"] }),
  one("kids-breakfast", "breakfast", "Kids English Breakfast", "A smaller plate for little ones.", 3000),
  one("tea-bread-omelette", "breakfast", "Tea, Bread & Omelette", "Simple and satisfying.", 4500),
  many("eggs", "breakfast", "Eggs Your Way", "Cooked how you like them.", "Style", [["Boiled egg", 1500], ["Fried egg", 2000], ["Scrambled egg", 2000], ["Sunny side up", 2000], ["Omelette", 2000], ["Spanish omelette", 2000], ["Vegetable omelette", 2000]]),
  many("porridge-cereal", "breakfast", "Cereal & Porridge", "Warm or cold, to start the day.", "Choose", [["Oat meal", 2000], ["Cornflakes", 2000], ["Cereal", 1500], ["Wheat", 2000], ["Custard", 2000]], { photos: ["akara-custard"] }),
  many("porridge-local", "breakfast", "Local Porridge", "Slow-cooked and seasoned.", "Porridge", [["Porridge beans", 4000], ["Porridge plantain", 3500], ["Porridge potatoes", 4500], ["Porridge yam", 4500]]),
  many("pastries", "breakfast", "Pastries & Pies", "Fresh from the kitchen.", "Choose", [["Croissant", 700], ["Meat pie", 2000], ["Fish pie", 700], ["Fish roll", 700]]),

  // Soups & swallow
  {
    id: "swallow-soup", category: "soups", name: "Swallow & Soup", description: "Pick your swallow and your soup. Add a protein if you like.", basePrice: 0, photos: ["amala-ewedu", "okra-fufu", "egusi", "poundo-efo", "efo-riro", "efo-beef", "fufu-ogbono", "okra-seafood"],
    groups: [
      add("swallow", "Swallow", [["Pounded yam", 2000], ["Semo", 1500], ["Garri", 1500], ["White garri", 1000], ["Plantain flour", 2000], ["Wheat", 2000]]),
      add("soup", "Soup", [["Egusi", 3000], ["Okro", 3000], ["Oha", 3000], ["Bitterleaf", 3000], ["Ogbono", 4000], ["Afang", 4000], ["Vegetable", 4000], ["White soup", 5000], ["Seafood okro", 10500], ["Fisherman soup", 10500]]),
      add("protein", "Protein (optional)", [["No protein", 0], ["Goat meat", 6000], ["Hake fish (panla)", 6000], ["Turkey gizzard", 6000], ["Titus fish", 9000]], { required: false }),
    ],
  },
  many("pepper-soup", "soups", "Pepper Soup", "Hot, aromatic broth.", "Type", [["Beef", 6500], ["Chicken", 7500], ["Goat meat", 7000], ["Catfish", 8000], ["Catfish head", 7000], ["Croaker fish", 8000], ["Tilapia", 4000], ["Turkey", 13000], ["Full catfish", 20000], ["Full croaker fish", 25000]]),

  // Rice & pasta
  many("rice", "rice", "Rice", "Choose your rice.", "Rice", [["Jollof", 4000], ["Fried", 4000], ["White", 4000], ["Basmati", 4000], ["Curry fried", 4000], ["Coconut", 5000], ["Special fried", 4500], ["Mexican fried", 3500], ["Spanish fried", 3500], ["Chinese", 5500], ["Steamed chicken fried", 9500], ["Jambalaya", 12500]], { photos: ["rice-stew", "rice-beans-plantain", "rice-beans-egg"] }),
  many("spaghetti", "rice", "Spaghetti", "Choose your style.", "Style", [["Jollof", 5000], ["White sauce", 5000], ["Vegetable", 5000], ["White", 3500], ["Stir fried", 10000], ["Bolognese", 12000], ["Alfredo", 18000]]),
  many("pasta", "rice", "Pasta", "Rich, creamy and generous.", "Pasta", [["Creamy chicken", 16000], ["Alfredo", 18000], ["Seafood", 22000]]),
  many("indomie", "rice", "Indomie", "The late-night favourite.", "Style", [["Indomie", 3000], ["Indomie & eggs", 5000]]),

  // Mains & grills
  one("special-steak", "mains", "Tranquila Special Steak", "Our house steak.", 9500),
  one("special-burger", "mains", "Tranquila Special Burger", "Our house burger.", 5000),
  many("pizza", "mains", "Pizza", "Baked to order.", "Pizza", [["Margarita", 6000], ["Tranquila special", 8500], ["Vegetable", 9000]]),
  one("pepper-steak", "mains", "Pepper Creamed Steak", "Steak in a peppered cream sauce.", 10000),
  many("grilled-fish", "mains", "Grilled Fish", "Grilled over charcoal.", "Fish", [["Tilapia", 15000], ["Catfish (big)", 20000], ["Croaker (medium)", 16000], ["Croaker (big)", 25000]]),
  many("peppered", "mains", "Peppered", "Tossed in hot pepper sauce.", "Choose", [["Beef", 6000], ["Chicken", 6500], ["Goat meat", 6000], ["Chicken wing", 5500], ["Catfish", 7000], ["Croaker fish", 7000], ["Turkey", 12000], ["Snail", 17000]]),
  many("chef-sauces", "mains", "Chef's Sauces", "Rich plates to share or enjoy alone.", "Sauce", [["Chicken curry", 8000], ["Prawn in curry sauce", 7000], ["Shrimps Provençal", 10000], ["Prawn escalope", 10000], ["Sweet & sour prawns", 12000], ["Shredded beef", 8000], ["Shredded chicken", 9000]]),
  many("sides", "mains", "Sides", "Add a little something.", "Side", [["French fries", 3500], ["Fried plantain", 3000], ["Boiled plantain", 4000], ["Fried yam", 3000], ["Boiled yam", 4000], ["Mashed potatoes", 4000], ["Boiled potatoes", 3000], ["Coleslaw", 1000]], { photos: ["plantain-fried", "plantain-boiled"] }),
  many("buffet", "mains", "Buffet", "A full spread.", "Meal", [["Lunch buffet", 22500], ["Dinner buffet", 18800]]),

  // Light bites
  one("special-salad", "light", "Tranquila Special Salad", "Our house salad.", 7000),
  one("caesar", "light", "Chicken Caesar Salad", "Classic, crisp and creamy.", 7000),
  one("veg-salad", "light", "Vegetable Salad", "Fresh and crisp.", 5000),
  one("fruit-salad", "light", "Fruit Salad", "Seasonal fruit.", 3000),
  many("club", "light", "Club Sandwich", "Stacked and served with care.", "Filling", [["Chicken", 6000], ["Beef", 6000]]),
  one("veg-sandwich", "light", "Vegetable Sandwich", "Light and fresh.", 3000),
  many("shawarma", "light", "Shawarma", "Wrapped warm.", "Filling", [["Chicken", 5500], ["Vegetable", 4000]]),

  // Wines
  wine("4th Street Red", 10000, "Red wine", "4th Street", "South Africa"),
  wine("4th Street White", 10000, "White wine", "4th Street", "South Africa"),
  wine("Four Cousins Red", 13000, "Red wine", "Four Cousins", "South Africa"),
  wine("Four Cousins White", 13000, "White wine", "Four Cousins", "South Africa"),
  wine("Explore Red", 13000, "Red wine", "Explore"),
  wine("Explore White", 13000, "White wine", "Explore"),
  wine("Sweet Kiss Red", 13000, "Red wine", "Sweet Kiss"),
  wine("Nederburg Red", 32000, "Red wine", "Nederburg", "South Africa"),
  wine("Nederburg", 32000, "Wine", "Nederburg", "South Africa"),
  wine("Escudo Rojo", 30000, "Red wine", "Escudo Rojo", "Chile"),
  many("wine-drostdy-hof", "wines", "Drostdy-Hof", "Choose your bottle size.", "Size", [["Big", 15000], ["Small", 7000]], { details: spec("Drostdy-Hof", "Wine", "South Africa") }),
  wine("Eisberg", 14000, "Wine", "Eisberg"),
  wine("Andre", 20000, "Sparkling wine", "André", "USA"),
  wine("Riunite Lambrusco", 15000, "Sparkling wine", "Riunite", "Italy"),
  wine("Riunite Zero", 15000, "Wine", "Riunite", "Italy"),
  wine("Giacondi", 15000, "Wine", "Giacondi"),
  wine("Chamdor", 10000, "Sparkling", "Chamdor"),
  wine("Martinelli's Apple Cider", 15000, "Sparkling apple cider", "Martinelli's", "USA"),
  wine("Laurent-Perrier Brut", 100000, "Champagne", "Laurent-Perrier", "France"),
  wine("Laurent-Perrier Rosé", 120000, "Rosé champagne", "Laurent-Perrier", "France"),
  wine("Moët Brut", 110000, "Champagne", "Moët & Chandon", "France"),
  wine("Moët Rosé", 150000, "Rosé champagne", "Moët & Chandon", "France"),
  wine("Veuve Clicquot Brut", 140000, "Champagne", "Veuve Clicquot", "France"),

  // Spirits
  spiritMany("Glenfiddich", "Single malt whisky", "Glenfiddich", "Age", [["12 years", 80000], ["15 years", 100000], ["18 years", 150000], ["21 years", 500000]], "Scotland"),
  spiritMany("Macallan", "Single malt whisky", "The Macallan", "Age", [["12 years", 125000], ["15 years", 210000]], "Scotland"),
  spiritMany("The Singleton", "Single malt whisky", "The Singleton", "Age", [["12 years", 80000], ["15 years", 110000]], "Scotland"),
  spirit("Glenmorangie 18 Years", 190000, "Single malt whisky", "Glenmorangie", "Scotland"),
  spirit("Monkey Shoulder", 60000, "Blended malt whisky", "Monkey Shoulder", "Scotland"),
  spirit("Johnnie Walker Black Label", 55000, "Blended whisky", "Johnnie Walker", "Scotland"),
  spiritMany("Jameson", "Irish whiskey", "Jameson", "Edition", [["Green", 30000], ["Black Barrel", 50000]], "Ireland"),
  spirit("Jack Daniel's", 40000, "Tennessee whiskey", "Jack Daniel's", "USA"),
  spirit("Williams Lawson's", 20000, "Blended whisky", "Williams Lawson's"),
  spirit("The Observatory", 60000, "Spirit", "The Observatory"),
  spirit("Hennessy VS", 90000, "Cognac", "Hennessy", "France"),
  spirit("Martell VS", 75000, "Cognac", "Martell", "France"),
  spirit("Rémy Martin VSOP", 110000, "Cognac", "Rémy Martin", "France"),
  spirit("Grey Goose", 65000, "Vodka", "Grey Goose", "France"),
  spirit("Absolut", 30000, "Vodka", "Absolut", "Sweden"),
  spirit("Skyy", 25000, "Vodka", "Skyy"),
  spirit("Baileys", 32000, "Cream liqueur", "Baileys", "Ireland"),
  spiritMany("Campari", "Bitter aperitif", "Campari", "Size", [["Small", 10000], ["Big", 30000]], "Italy"),
  spirit("Olmeca Tequila", 45000, "Tequila", "Olmeca", "Mexico"),
  spirit("Silk & Spice", 25000, "Rum", "Silk & Spice"),
  spirit("B & G", 10000, "Spirit", "B & G"),
  many("cocktails", "spirits", "Cocktails", "Mixed to order.", "Cocktail", [["Cosmopolitan", 4500], ["Blue Margarita", 5500], ["Long Island", 6000]], { details: [{ label: "Style", value: "Cocktail" }] }),

  // Beers
  many("lager", "beers", "Lager Beers", "Served cold.", "Beer", [["Star", 2500], ["Gulder", 2500], ["Tiger", 2500], ["Trophy", 2500], ["Hero", 2500], ["Life", 2500], ["Goldberg", 2500], ["Legend", 3000], ["Heineken", 3000], ["Heineken (medium)", 2500], ["Budweiser", 3000], ["Budweiser Royal", 3000]], { details: [{ label: "Style", value: "Lager" }] }),
  many("stout", "beers", "Stout", "Rich and dark.", "Stout", [["Guinness (big)", 3000], ["Guinness (medium)", 1700], ["Small stout", 2500], ["Smooth stout", 2500], ["Trophy stout", 2500]], { details: [{ label: "Style", value: "Stout" }] }),
  many("more-beers", "beers", "More Beers", "Also on the cold shelf.", "Beer", [["Desperado", 3000], ["Star Radler", 2500], ["Castle Light", 2500], ["Origin beer", 3000], ["Black Bullet", 3000], ["Double Black", 3000]]),
  many("smirnoff-ice", "beers", "Smirnoff Ice", "Chilled and refreshing.", "Size", [["Big", 3000], ["Small", 2000]]),
  many("origin-bitters", "beers", "Origin Bitters", "Herbal and bold.", "Size", [["Big", 6000], ["Plastic", 3000]]),

  // Soft & hot
  many("soft-drinks", "soft", "Soft Drinks", "Served ice cold.", "Drink", [["Coke", 1000], ["Fanta", 1000], ["Sprite", 1000], ["Schweppes", 1500], ["Fayrouz", 1500], ["Red Bull", 3000], ["Chi Exotic", 3500], ["Holandia", 3500]]),
  many("malt", "soft", "Malt", "Smooth and sweet.", "Malt", [["Maltina (can)", 1000], ["Malta Guinness", 1500], ["Amstel Malt", 1500]]),
  many("hot-drinks", "soft", "Tea & Coffee", "Hot and freshly made.", "Drink", [["Tea", 1500], ["Coffee", 1500], ["Decaffeinated coffee", 1500], ["Green tea", 1500], ["Hot chocolate", 1500], ["Arabian tea (small)", 4000], ["Arabian tea (big)", 6000]]),

  // Water & juice
  many("water", "water", "Bottled Water", "Still and chilled.", "Size", [["Nestlé", 700], ["Nestlé (big)", 1200], ["Swan", 1200]]),
  many("juice", "water", "Fresh Juice", "Pressed to order.", "Flavour", [["Cucumber", 3000], ["Watermelon", 4000], ["Pineapple", 5000], ["Cranberry", 15000]]),
  one("smoothie", "water", "Smoothie", "Blended fresh.", 4500),
  one("chapman", "water", "Chapman", "The Nigerian classic.", 4000),
];

/** Every food dish gets a photo: dishes without their own are given the supplied photos in rotation. */
export function rotatePhotos(list: Item[]): Item[] {
  const keys = Object.keys(PHOTOS); let k = 0;
  return list.map((i) => (isDrink(i.category) || i.imageUrl || i.photos?.length ? i : { ...i, photos: [keys[k++ % keys.length]!] }));
}
ITEMS.splice(0, ITEMS.length, ...rotatePhotos(ITEMS));

export const findItem = (id: string): Item | undefined => ITEMS.find((i) => i.id === id);

/** Replace the in-memory catalog after loading the published CMS menu. */
export function setCatalog(nextItems: Item[], nextCategories: { id: CategoryId; label: string }[]) {
  ITEMS.splice(0, ITEMS.length, ...rotatePhotos(nextItems));
  CATEGORIES.splice(0, CATEGORIES.length, ...nextCategories);
}
