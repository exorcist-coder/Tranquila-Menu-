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
export type Item = { id: string; category: CategoryId; name: string; description: string; basePrice: number; groups: Group[]; available?: boolean; /** keys into PHOTOS; none = icon placeholder */ photos?: string[]; imageUrl?: string; /** Spec rows shown on drink detail pages (Brand, Country, Style…) */ details?: Detail[] };

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
type PricedOption = [label: string, price: number, id?: string];
const abs = (label: string, opts: PricedOption[], id = "choice"): Group => pick(id, label, opts.map(([l, n, optionId]) => o(optionId ?? slug(l), l, p(n))), { mode: "absolute" });
const add = (id: string, label: string, opts: PricedOption[], extra: Partial<Group> = {}): Group => pick(id, label, opts.map(([l, n, optionId]) => o(optionId ?? slug(l), l, p(n))), extra);
const one = (id: string, category: string, name: string, description: string, price: number, extra: Partial<Item> = {}): Item => ({ id, category, name, description, basePrice: p(price), groups: [], ...extra });
const many = (id: string, category: string, name: string, description: string, label: string, opts: PricedOption[], extra: Partial<Item> = {}): Item => ({ id, category, name, description, basePrice: 0, groups: [abs(label, opts)], ...extra });
const spec = (brand: string, style: string, country?: string): Detail[] => [{ label: "Brand", value: brand }, ...(country ? [{ label: "Country", value: country }] : []), { label: "Style", value: style }];
const wine = (name: string, price: number, style: string, brand: string, country?: string, id = `wine-${slug(name)}`): Item =>
  one(id, "wines", name, `${style}, served by the bottle.`, price, { details: spec(brand, style, country) });
const spirit = (name: string, price: number, style: string, brand: string, country?: string, id = `spirit-${slug(name)}`): Item =>
  one(id, "spirits", name, `${style}, served by the measure or bottle.`, price, { details: spec(brand, style, country) });
const spiritMany = (name: string, style: string, brand: string, label: string, opts: PricedOption[], country?: string, id = `spirit-${slug(name)}`): Item =>
  many(id, "spirits", name, `${style}. Choose your ${label.toLowerCase()}.`, label, opts, { details: spec(brand, style, country) });

export const ITEMS: Item[] = [
  // Breakfast
  one("english-breakfast", "breakfast", "English Breakfast", "The full plate, cooked to order.", 10000),
  one("nigerian-breakfast", "breakfast", "Nigerian Breakfast", "A hearty local morning plate.", 8000, { photos: ["yam-egg-sauce", "yam-fish"] }),
  one("kids-breakfast", "breakfast", "Kids English Breakfast", "A smaller plate for little ones.", 3000),
  one("tea-bread-omelette", "breakfast", "Tea, bread and omelette", "Simple and satisfying.", 4500),
  many("eggs", "breakfast", "Eggs Your Way", "Cooked how you like them.", "Style", [["Boiled Egg", 1500], ["Fried Egg", 2000], ["Scrambled Egg", 2000], ["Sunny Side Up Egg", 2000, "sunny-side-up"], ["Omelette", 2000], ["Spanish Omelette", 2000], ["Vegetable Omelette", 2000]]),
  many("porridge-cereal", "breakfast", "Cereal & Porridge", "Warm or cold, to start the day.", "Choose", [["Oat meal", 2000], ["Cornflakes", 2000], ["Cereal", 1500], ["Wheat", 2000], ["Custard", 2000]], { photos: ["akara-custard"] }),
  many("porridge-local", "breakfast", "Local Porridge", "Slow-cooked and seasoned.", "Porridge", [["Porridge beans", 4000], ["Porridge plantain", 3500], ["Porridge potatoes", 4500], ["Porridge yam", 4500]]),
  many("pastries", "breakfast", "Pastries & Pies", "Fresh from the kitchen.", "Choose", [["Croissant", 700], ["Meat pie", 2000], ["Fish pie", 700], ["Fish roll", 700]]),

  // Soups & swallow
  {
    id: "swallow-soup", category: "soups", name: "Swallow & Soup", description: "Pick your swallow and your soup. Add a protein if you like.", basePrice: 0, photos: ["amala-ewedu", "okra-fufu", "egusi", "poundo-efo", "efo-riro", "efo-beef", "fufu-ogbono", "okra-seafood"],
    groups: [
      add("swallow", "Swallow", [["Poundo Yam", 2000, "pounded-yam"], ["Semo Extra", 1500, "semo"], ["Garri", 1500], ["White Garri", 1000], ["Plantain Flour", 2000], ["Wheat", 2000]]),
      add("soup", "Soup", [["Egusi Soup", 3000, "egusi"], ["Okro Soup", 3000, "okro"], ["Oha Soup", 3000, "oha"], ["Bitter Leaf Soup", 3000, "bitterleaf"], ["Ogbono Soup", 4000, "ogbono"], ["Afang Soup", 4000, "afang"], ["Vegetable Soup", 4000, "vegetable"], ["White Soup", 5000], ["Sea Food Okro Soup Only", 10500, "seafood-okro"], ["Fisherman Soup", 10500, "fisherman-soup"]]),
      add("protein", "Protein (optional)", [["No protein", 0], ["Goat Meat", 6000], ["European Hake Fish (Panla)", 6000, "hake-fish-panla"], ["Turkey Gizzard", 6000], ["Titus Fish", 9000]], { required: false }),
    ],
  },
  many("pepper-soup", "soups", "Pepper Soup", "Hot, aromatic broth.", "Type", [["Beef Pepper Soup", 6500, "beef"], ["Chicken Pepper Soup", 7500, "chicken"], ["Goat Meat Pepper Soup", 7000, "goat-meat"], ["Catfish Pepper Soup", 8000, "catfish"], ["Catfish Head Pepper Soup", 7000, "catfish-head"], ["Croaker Fish Pepper Soup", 8000, "croaker-fish"], ["Tilapia Pepper Soup", 4000, "tilapia"], ["Turkey Pepper Soup", 13000, "turkey"], ["Full Catfish Pepper Soup", 20000, "full-catfish"], ["Full Croaker Fish Pepper Soup", 25000, "full-croaker-fish"]]),

  // Rice & pasta
  many("rice", "rice", "Rice", "Choose your rice.", "Rice", [["Jollof Rice Only", 4000, "jollof"], ["Fried Rice", 4000, "fried"], ["White Rice Only", 4000, "white"], ["Basmati Rice", 4000, "basmati"], ["Curry Fried Rice", 4000, "curry-fried"], ["Tranquila Special Coconut Rice", 5000, "coconut"], ["Special Fried Rice", 4500, "special-fried"], ["Mexican Fried Rice", 3500, "mexican-fried"], ["Spanish Fried Rice", 3500, "spanish-fried"], ["Chinese Rice Only", 5500, "chinese"], ["Steamed Chicken Fried Rice", 9500, "steamed-chicken-fried"], ["Jambalaya Rice, Chicken Breast, Shrimps, Calamari, Fresh Tomatoes", 12500, "jambalaya"]], { photos: ["rice-stew", "rice-beans-plantain", "rice-beans-egg"] }),
  many("spaghetti", "rice", "Spaghetti", "Choose your style.", "Style", [["Jollof Spaghetti", 5000, "jollof"], ["Spaghetti & White Sauce", 5000, "white-sauce"], ["Vegetable Spaghetti", 5000, "vegetable"], ["White Spaghetti", 3500, "white"], ["Stir Fried Spaghetti", 10000, "stir-fried"], ["Spaghetti Bolognese", 12000, "bolognese"], ["Alfredo Spaghetti", 18000, "alfredo"]]),
  many("pasta", "rice", "Pasta", "Rich, creamy and generous.", "Pasta", [["Cream Chicken Pasta", 16000, "creamy-chicken"], ["Alfredo Pasta", 18000, "alfredo"], ["Sea Food Pasta", 22000, "seafood"]]),
  many("indomie", "rice", "Indomie", "The late-night favourite.", "Style", [["Indomie", 3000], ["Indomie and Eggs", 5000, "indomie-eggs"]]),

  // Mains & grills
  one("special-steak", "mains", "Tranquila Special Steak", "Our house steak.", 9500),
  one("special-burger", "mains", "Tranquila Special Burger", "Our house burger.", 5000),
  many("pizza", "mains", "Pizza", "Baked to order.", "Pizza", [["Pizza Margarita", 6000, "margarita"], ["Tranquila Special Pizza", 8500, "tranquila-special"], ["Vegetable Pizza", 9000, "vegetable"]]),
  one("pepper-steak", "mains", "Pepper Creamed Steak", "Steak in a peppered cream sauce.", 10000),
  many("grilled-fish", "mains", "Grilled Fish", "Grilled over charcoal.", "Fish", [["Tilapia Fish Grilled", 15000, "tilapia"], ["Grilled Catfish Big", 20000, "catfish-big"], ["Medium Grilled Croaker Fish", 16000, "croaker-medium"], ["Grilled Croaker Fish Big", 25000, "croaker-big"]]),
  many("peppered", "mains", "Peppered", "Tossed in hot pepper sauce.", "Choose", [["Pepper Beef", 6000, "beef"], ["Pepper Chicken", 6500, "chicken"], ["Pepper Goat Meat", 6000, "goat-meat"], ["Peppered Chicken Wing", 5500, "chicken-wing"], ["Peppered Catfish", 7000, "catfish"], ["Pepper Croaker Fish", 7000, "croaker-fish"], ["Pepper Turkey", 12000, "turkey"], ["Pepper Snail", 17000, "snail"]]),
  many("chef-sauces", "mains", "Chef's Sauces", "Rich plates to share or enjoy alone.", "Sauce", [["Chicken Curry Sauce", 8000, "chicken-curry"], ["Prawn in Curry Sauce", 7000], ["Shrimps Provencal", 10000, "shrimps-provenc-al"], ["Prawn Escalope", 10000], ["Sweet and Sour Prawns", 12000, "sweet-sour-prawns"], ["Shredded Beef", 8000], ["Shredded Chicken", 9000]]),
  many("sides", "mains", "Sides", "Add a little something.", "Side", [["French Fries", 3500], ["Fried Plantain", 3000], ["Boiled Plantain", 4000], ["Fried Yam", 3000, "fried-yam"], ["Boiled Yam", 4000], ["Mashed Potatoes", 4000], ["Boiled Potatoes", 3000], ["Coleslaw", 1000]], { photos: ["plantain-fried", "plantain-boiled"] }),
  many("buffet", "mains", "Buffet", "A full spread.", "Meal", [["Buffet Lunch", 22500, "lunch-buffet"], ["Dinner Buffet", 18800]]),

  // Light bites
  one("special-salad", "light", "Tranquila Special Salad", "Our house salad.", 7000),
  one("caesar", "light", "Chicken Caesar Salad", "Classic, crisp and creamy.", 7000),
  one("veg-salad", "light", "Vegetable Salad", "Fresh and crisp.", 5000),
  one("fruit-salad", "light", "Fruit Salad", "Seasonal fruit.", 3000),
  many("club", "light", "Club Sandwich", "Stacked and served with care.", "Filling", [["Chicken Club Sandwiched", 6000, "chicken"], ["Beef Club Sandwiched", 6000, "beef"]]),
  one("veg-sandwich", "light", "Vegetable Sandwich", "Light and fresh.", 3000),
  many("shawarma", "light", "Shawarma", "Wrapped warm.", "Filling", [["Chicken Shawarma", 5500, "chicken"], ["Vegetable Shawarma", 4000, "vegetable"]]),

  // Wines
  wine("4th Street Red", 10000, "Red wine", "4th Street", "South Africa"),
  wine("4th Street (White)", 10000, "White wine", "4th Street", "South Africa"),
  wine("Four Cousins Red", 13000, "Red wine", "Four Cousins", "South Africa"),
  wine("Four Cousins White", 13000, "White wine", "Four Cousins", "South Africa"),
  wine("Explore Red Wine", 13000, "Red wine", "Explore", undefined, "wine-explore-red"),
  wine("Explore White Wine", 13000, "White wine", "Explore", undefined, "wine-explore-white"),
  wine("Sweet Kiss Red", 13000, "Red wine", "Sweet Kiss"),
  wine("Nederburg Red", 32000, "Red wine", "Nederburg", "South Africa"),
  wine("Nederburg", 32000, "Wine", "Nederburg", "South Africa"),
  wine("Escudo Rojo", 30000, "Red wine", "Escudo Rojo", "Chile"),
  many("wine-drostdy-hof", "wines", "Drostdy-Hof", "Choose your bottle size.", "Size", [["Drostdy Hof Big", 15000, "big"], ["Drostdy Hof Small", 7000, "small"]], { details: spec("Drostdy-Hof", "Wine", "South Africa") }),
  wine("Eisberg", 14000, "Wine", "Eisberg"),
  wine("Andre Wine", 20000, "Sparkling wine", "André", "USA", "wine-andre"),
  wine("Riunite Lambrusco", 15000, "Sparkling wine", "Riunite", "Italy"),
  wine("Riunite Zero", 15000, "Wine", "Riunite", "Italy"),
  wine("Giacondi", 15000, "Wine", "Giacondi"),
  wine("Chamdor", 10000, "Sparkling", "Chamdor"),
  wine("Martinelli's Apple Cider", 15000, "Sparkling apple cider", "Martinelli's", "USA"),
  wine("Laurent Perrier Brut", 100000, "Champagne", "Laurent-Perrier", "France"),
  wine("Laurent Perrier Rosé", 120000, "Rosé champagne", "Laurent-Perrier", "France"),
  wine("Moet Brut", 110000, "Champagne", "Moët & Chandon", "France", "wine-mo-t-brut"),
  wine("Moet Rose", 150000, "Rosé champagne", "Moët & Chandon", "France", "wine-mo-t-ros"),
  wine("Veuve Clicquot Brut", 140000, "Champagne", "Veuve Clicquot", "France"),

  // Spirits
  spiritMany("Glenfiddich", "Single malt whisky", "Glenfiddich", "Age", [["Glenfiddich(12yrs)", 80000, "12-years"], ["Glenfiddich(15yrs)", 100000, "15-years"], ["Glenfiddich(18yrs)", 150000, "18-years"], ["Glenfiddich 21 Years", 500000, "21-years"]], "Scotland"),
  spiritMany("Macallan", "Single malt whisky", "The Macallan", "Age", [["Macallan 12yrs", 125000, "12-years"], ["Macallan 15 Years", 210000, "15-years"]], "Scotland"),
  spiritMany("The Singleton", "Single malt whisky", "The Singleton", "Age", [["Singleton(12yrs)", 80000, "12-years"], ["The Singleton 15years", 110000, "15-years"]], "Scotland"),
  spirit("Glenmorangie(18yrs)", 190000, "Single malt whisky", "Glenmorangie", "Scotland", "spirit-glenmorangie-18-years"),
  spirit("Monkey Shoulder", 60000, "Blended malt whisky", "Monkey Shoulder", "Scotland"),
  spirit("Black Label", 55000, "Blended whisky", "Johnnie Walker", "Scotland", "spirit-johnnie-walker-black-label"),
  spiritMany("Jameson", "Irish whiskey", "Jameson", "Edition", [["Jameson Green", 30000, "green"], ["Jameson Black Barrel", 50000, "black-barrel"]], "Ireland"),
  spirit("Jack Daniel's", 40000, "Tennessee whiskey", "Jack Daniel's", "USA"),
  spirit("William Lawson's", 20000, "Blended whisky", "William Lawson's", undefined, "spirit-williams-lawson-s"),
  spirit("The Observatory", 60000, "Spirit", "The Observatory"),
  spirit("Hennessy VS", 90000, "Cognac", "Hennessy", "France"),
  spirit("Martell VS", 75000, "Cognac", "Martell", "France"),
  spirit("Rémy Martin VSOP", 110000, "Cognac", "Rémy Martin", "France", "spirit-r-my-martin-vsop"),
  spirit("Grey Goose Vodka", 65000, "Vodka", "Grey Goose", "France", "spirit-grey-goose"),
  spirit("Absolut Vodka", 30000, "Vodka", "Absolut", "Sweden", "spirit-absolut"),
  spirit("Skyy Vodka", 25000, "Vodka", "Skyy", undefined, "spirit-skyy"),
  spirit("Baileys", 32000, "Cream liqueur", "Baileys", "Ireland"),
  spiritMany("Campari", "Bitter aperitif", "Campari", "Size", [["Campari (small)", 10000, "small"], ["Campari (big)", 30000, "big"]], "Italy"),
  spirit("Olmeca Tequila", 45000, "Tequila", "Olmeca", "Mexico"),
  spirit("Silk & Spice", 25000, "Rum", "Silk & Spice"),
  spirit("B & G", 10000, "Spirit", "B & G"),
  many("cocktails", "spirits", "Cocktails", "Mixed to order.", "Cocktail", [["Cosmopolitan", 4500], ["Blue Margarita", 5500], ["Long Island", 6000]], { details: [{ label: "Style", value: "Cocktail" }] }),

  // Beers
  many("lager", "beers", "Lager Beers", "Served cold.", "Beer", [["Star", 2500], ["Gulder", 2500], ["Tiger", 2500], ["Trophy", 2500], ["Hero", 2500], ["Life", 2500], ["Goldberg", 2500], ["Legend", 3000], ["Heineken", 3000], ["Heineken Medium", 2500, "heineken-medium"], ["Budweiser", 3000], ["Budweiser Royal", 3000]], { details: [{ label: "Style", value: "Lager" }] }),
  many("stout", "beers", "Stout", "Rich and dark.", "Stout", [["Guinness Stout Big", 3000, "guinness-big"], ["Medium Stout", 1700, "guinness-medium"], ["Small Stout", 2500], ["Smooth Stout", 2500], ["Trophy Stout", 2500]], { details: [{ label: "Style", value: "Stout" }] }),
  many("more-beers", "beers", "More Beers", "Also on the cold shelf.", "Beer", [["Desperado", 3000], ["Star Radler", 2500], ["Castle Light", 2500], ["Origin Beer", 3000], ["Black Bullet", 3000], ["Double Black", 3000]]),
  many("smirnoff-ice", "beers", "Smirnoff Ice", "Chilled and refreshing.", "Size", [["Smirnoff Ice Big", 3000, "big"], ["Smirnoff Ice Small", 2000, "small"]]),
  many("origin-bitters", "beers", "Origin Bitters", "Herbal and bold.", "Size", [["Origin Bitters Big", 6000, "big"], ["Origin Bitters (Plastic)", 3000, "plastic"]]),

  // Soft & hot
  many("soft-drinks", "soft", "Soft Drinks", "Served ice cold.", "Drink", [["Coke", 1000], ["Fanta", 1000], ["Sprite Big", 1000, "sprite"], ["Schweppes", 1500], ["Fayrouz Can", 1500, "fayrouz"], ["Redbull", 3000, "red-bull"], ["Chi Exotic", 3500], ["Holandia", 3500]]),
  many("malt", "soft", "Malt", "Smooth and sweet.", "Malt", [["Can Malt (Maltina)", 1000, "maltina-can"], ["Malta Guinness", 1500, "malta-guinness"], ["Amstel Malt", 1500]]),
  many("hot-drinks", "soft", "Tea & Coffee", "Hot and freshly made.", "Drink", [["Tea", 1500], ["Coffee", 1500], ["Decaffeinated Coffee", 1500], ["Green Tea", 1500], ["Hot Chocolate", 1500], ["Arabian Tea Small", 4000, "arabian-tea-small"], ["Arabian Tea Big", 6000, "arabian-tea-big"]]),

  // Water & juice
  many("water", "water", "Bottled Water", "Still and chilled.", "Size", [["Nestle Water", 700, "nestle"], ["Big Nestle Water", 1200, "nestle-big"], ["SWAN Water", 1200, "swan"]]),
  many("juice", "water", "Fresh Juice", "Pressed to order.", "Flavour", [["Cucumber Juice", 3000, "cucumber"], ["Water Melon Juice", 4000, "watermelon"], ["Pineapple Juice", 5000, "pineapple"], ["Cranberry", 15000]]),
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
