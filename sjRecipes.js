// ====================== SECTION 9: CONSTANTS & DATA STRUCTURES (JS) ======================

/* ===== SECTION 9A: CANONICAL NUTRIENT KEYS ===== */
/* 🧩 [NL-DATA-01] Map UI nutrient labels → canonical keys used in RECIPES + DV tables */
const NUTRIENT_KEYS = { // [NL-DATA-01a]
  "Calories":"calories",       // [NL-DATA-01b]
  "Fat":"fat",                 // [NL-DATA-01c]
  "Saturated Fat":"satFat",    // [NL-DATA-01d]
  "Trans Fat":"transFat",      // [NL-DATA-01e]
  "Carbohydrates":"carbs",     // [NL-DATA-01f]
  "Fiber":"fiber",             // [NL-DATA-01g]
  "Sugars":"sugars",           // [NL-DATA-01h]
  "Protein":"protein",         // [NL-DATA-01i]
  "Cholesterol":"cholesterol", // [NL-DATA-01j]
  "Sodium":"sodium",           // [NL-DATA-01k]
  "Potassium":"potassium",     // [NL-DATA-01l]
  "Calcium":"calcium",         // [NL-DATA-01m]
  "Iron":"iron"                // [NL-DATA-01n]
};

/* ===== SECTION 9B: %DV TABLES BY REGION + FLAG ICONS ===== */
/* 🧩 [NL-DATA-02] DV reference tables (CA/US/EU/UK) and flag data URLs */
const DV_SETS = { // [NL-DATA-02a]
  CA: { // [NL-DATA-02b]
    fat:75, satFat:20, transFat:null,
    carbs:null, fiber:28, sugars:100,
    protein:50, cholesterol:300, sodium:2300,
    potassium:3400, calcium:1300, iron:18
  },
  US: { // [NL-DATA-02c]
    fat:78, satFat:20, transFat:null,
    carbs:275, fiber:28, sugars:null,
    protein:50, cholesterol:300, sodium:2300,
    potassium:4700, calcium:1300, iron:18
  },
  EU: { // [NL-DATA-02d]
    fat:70, satFat:20, transFat:null,
    carbs:260, fiber:25, sugars:90,
    protein:50, cholesterol:300, sodium:2400,
    potassium:3500, calcium:800, iron:14
  },
  UK: { // [NL-DATA-02e]
    fat:70, satFat:20, transFat:null,
    carbs:260, fiber:30, sugars:90,
    protein:50, cholesterol:300, sodium:2400,
    potassium:3500, calcium:700, iron:14
  }
};
function getDVRef(region){ return DV_SETS[region] || DV_SETS.CA; } // [NL-DATA-02f]

/* Small inline SVG “flags” encoded as data URLs */
const FLAG_SVGS = { // [NL-DATA-02g]
  CA: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 16'><rect width='24' height='16' fill='%23fff'/><rect width='6' height='16' fill='%23d00'/><rect x='18' width='6' height='16' fill='%23d00'/><path fill='%23d00' d='M12 4.5l1 2.5 2.5-.5-1.5 2 1.5 1.5-2.5-.3-1 2.3-1-2.3-2.5.3 1.5-1.5-1.5-2 2.5.5z'/></svg>", // [NL-DATA-02h]
  US: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 16'><rect width='24' height='16' fill='%23b22234'/><g fill='%23fff'><rect y='2' width='24' height='2'/><rect y='6' width='24' height='2'/><rect y='10' width='24' height='2'/><rect y='14' width='24' height='2'/></g><rect width='10' height='7' fill='%233c3b6e'/></svg>", // [NL-DATA-02i]
  EU: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 16'><rect width='24' height='16' fill='%2300399'/><circle cx='12' cy='8' r='3' fill='%23fc0'/></svg>", // [NL-DATA-02j]
  UK: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 16'><rect width='24' height='16' fill='%23012169'/><rect x='0' y='7' width='24' height='2' fill='%23fff'/><rect x='11' y='0' width='2' height='16' fill='%23fff'/><rect x='0' y='7.5' width='24' height='1' fill='%23c8102e'/><rect x='11.5' y='0' width='1' height='16' fill='%23c8102e'/></svg>" // [NL-DATA-02k]
};

/* ===== SECTION 9C: NUTRITION DATA PER RECIPE ===== */
/* 🧩 [NL-DATA-03] Per-50g base nutrition values for each recipe */
const RECIPES = { // [NL-DATA-03a]
  "My First Bake": { // [NL-DATA-03b]
    recipeName:"My First Bake",
    serveSize:50,
    perBase:50,
    calories:122,
    fat:0.7,
    satFat:0.2,
    transFat:0,
    carbs:24.1,
    fiber:1.6,
    sugars:0.1,
    protein:4.4,
    cholesterol:0,
    sodium:237,
    potassium:1.7,
    calcium:0.3,
    iron:0.8
  },
  "Country White": { // [NL-DATA-03c]
    recipeName:"Country White",
    serveSize:50,
    perBase:50,
    calories:121,
    fat:0.7,
    satFat:0.2,
    transFat:0,
    carbs:23.9,
    fiber:1.6,
    sugars:0,
    protein:4.4,
    cholesterol:0,
    sodium:193,
    potassium:1.63,
    calcium:0.2,
    iron:0
  },
  "High-Hydration White": { // [NL-DATA-03d]
    recipeName:"High-Hydration White",
    serveSize:50,
    perBase:50,
    calories:116,
    fat:0.7,
    satFat:0.2,
    transFat:0,
    carbs:23.0,
    fiber:1.5,
    sugars:0.0,
    protein:4.2,
    cholesterol:0,
    sodium:186,
    potassium:1.6,
    calcium:0.2,
    iron:0.8
  },
  "100% Whole Wheat": { // [NL-DATA-03e]
    recipeName:"100% Whole Wheat",
    serveSize:50,
    perBase:50,
    calories:101,
    fat:1.0,
    satFat:0.0,
    transFat:0,
    carbs:22.1,
    fiber:2.9,
    sugars:0.0,
    protein:4.0,
    cholesterol:0,
    sodium:212,
    potassium:1.1,
    calcium:0.2,
    iron:0
  },
  "50-50 Bread": { // [NL-DATA-03f]
    recipeName:"50-50 Bread",
    serveSize:50,
    perBase:50,
    calories:117,
    fat:0.8,
    satFat:0.1,
    transFat:0,
    carbs:22.8,
    fiber:2.0,
    sugars:0,
    protein:4.2,
    cholesterol:0,
    sodium:208,
    potassium:9,
    calcium:0.2,
    iron:0.3
  },
  "White Seed Sourdough": { // [NL-DATA-03f]
    recipeName:"White Seed Sourdough",
    serveSize:50,
    perBase:50,
    calories:140,
    fat:2.9,
    satFat:0.5,
    transFat:0,
    carbs:23.3,
    fiber:1.9,
    sugars:0.1,
    protein:5.1,
    cholesterol:0,
    sodium:273,
    potassium:43,
    calcium:0.2,
    iron:0.2
  }
};

/* ===== SECTION 9D: FORMULAS PER RECIPE ===== */
/* 🧩 [NL-DATA-04] Seed formula + per-recipe ingredient formulas (for Formula + Stats panels) */
const SEED_FORMULA = [ // [NL-DATA-04a]
  { ingredient:"Ripe Levain", type:"LEAVEN", amount:100, scale:"g" }, // [NL-DATA-04b]
  { ingredient:"Bread Flour", type:"FLOUR",  amount:800, scale:"g" }, // [NL-DATA-04c]
  { ingredient:"WW Flour",    type:"FLOUR",  amount:200, scale:"g" }, // [NL-DATA-04d]
  { ingredient:"Water",       type:"WATER",  amount:750, scale:"g" }, // [NL-DATA-04e]
  { ingredient:"Salt",        type:"SALT",   amount:15,  scale:"g" }  // [NL-DATA-04f]
];

const FORMULAS = { // [NL-DATA-04g]
  "My First Bake": [ // [NL-DATA-04h]
    { ingredient:"Ripe Levain", type:"100%",  amount:100, scale:"g" }, // [NL-DATA-04i]
    { ingredient:"Bread Flour", type:"FLOUR", amount:350, scale:"g" }, // [NL-DATA-04j]
    { ingredient:"WW Flour",    type:"FLOUR", amount:100, scale:"g" }, // [NL-DATA-04k]
    { ingredient:"Water",       type:"WATER", amount:325, scale:"g" }, // [NL-DATA-04l]
    { ingredient:"Salt",        type:"SALT",  amount:11,  scale:"g" }  // [NL-DATA-04m]
  ],

  "Country White": [ // [NL-DATA-04n]
    { ingredient:"Ripe Levain", type:"100%",  amount:110, scale:"g" }, // [NL-DATA-04o]
    { ingredient:"Bread Flour", type:"FLOUR", amount:400, scale:"g" }, // [NL-DATA-04p]
    { ingredient:"WW Flour",    type:"FLOUR", amount:100, scale:"g" }, // [NL-DATA-04q]
    { ingredient:"Water",       type:"WATER", amount:370, scale:"g" }, // [NL-DATA-04r]
    { ingredient:"Salt",        type:"SALT",  amount:10,  scale:"g" }  // [NL-DATA-04s]
  ],

  "High-Hydration White": [ // [NL-DATA-04t]
    { ingredient:"Ripe Levain", type:"100%",   amount:110, scale:"g" }, // [NL-DATA-04u]
    { ingredient:"Bread Flour", type:"FLOUR", amount:400, scale:"g" }, // [NL-DATA-04v]
    { ingredient:"WW Flour",    type:"FLOUR", amount:100, scale:"g" }, // [NL-DATA-04w]
    { ingredient:"Water",       type:"WATER", amount:410, scale:"g" }, // [NL-DATA-04x]
    { ingredient:"Salt",        type:"SALT",  amount:10,  scale:"g" }  // [NL-DATA-04y]
  ],

  "100% Whole Wheat": [ // [NL-DATA-04z]
    { ingredient:"Ripe Levain",     type:"100%",  amount:65, scale:"g" }, // [NL-DATA-04aa]
    { ingredient:"WW Flour",        type:"FLOUR", amount:430, scale:"g" }, // [NL-DATA-04ab]
    { ingredient:"Recipe Water",    type:"WATER", amount:355, scale:"g" }, // [NL-DATA-04ac]
    { ingredient:"Bassinage Water", type:"WATER", amount:40, scale:"g" },  // [NL-DATA-04ad]
    { ingredient:"Salt",            type:"SALT",  amount:10,  scale:"g" }  // [NL-DATA-04ae]
  ],

  "50-50 Bread": [ // [NL-DATA-04af]
    { ingredient:"Ripe Levain",     type:"100%",  amount:75,  scale:"g" }, // [NL-DATA-04ag]
    { ingredient:"WW Flour",        type:"FLOUR", amount:250, scale:"g" }, // [NL-DATA-04ah]
    { ingredient:"Bread Flour",     type:"FLOUR", amount:250, scale:"g" }, // [NL-DATA-04ai]
    { ingredient:"Recipe Water",    type:"WATER", amount:370, scale:"g" }, // [NL-DATA-04aj]
    { ingredient:"Bassinage Water", type:"WATER", amount:30,  scale:"g" }, // [NL-DATA-04ad]
    { ingredient:"Salt",            type:"SALT",  amount:10,  scale:"g" }  // [NL-DATA-04ak]
  ],

  "White Seed Sourdough": [ // [NL-DATA-04al]
    { ingredient:"Ripe Levain",     type:"100%",      amount:70,  scale:"g" }, // [NL-DATA-04am]
    { ingredient:"WW Flour",        type:"FLOUR",     amount:100, scale:"g" }, // [NL-DATA-04an]
    { ingredient:"White Flour",     type:"FLOUR",     amount:100, scale:"g" }, // [NL-DATA-04ao]
    { ingredient:"Bread Flour",     type:"FLOUR",     amount:200, scale:"g" }, // [NL-DATA-04ap]
    { ingredient:"Recipe Water",    type:"WATER",     amount:300, scale:"g" }, // [NL-DATA-04aq]
    { ingredient:"Pumpkin Seeds",   type:"INCLUSION", amount:30,  scale:"g" }, // [NL-DATA-04ar]
    { ingredient:"Sunflower Seeds", type:"INCLUSION", amount:30,  scale:"g" }, // [NL-DATA-04as]
    { ingredient:"Sesame Seeds",    type:"INCLUSION", amount:30,  scale:"g" }, // [NL-DATA-04art]
    { ingredient:"Salt",            type:"SALT",      amount:12,  scale:"g" }  // [NL-DATA-04au]
  ]
};

/* ===== SECTION 9E: STEPS VIDEO URL LIST + SHARED STEP DEFINITIONS ===== */
/* ✅ 2026-07-02 🧩 [SJ-RECIPE-STEPS-AUTOPLAY-02]
   Recipe Step Preview videos use Cloudflare Stream iframes. Apply player options at
   the one shared source point so the signed-in Learn view and every public preview
   behave identically. Muting is required by modern browsers before autoplay is allowed. */
const STEP_VIDEO_PLAYER_OPTIONS = Object.freeze({
  autoplay: 'true',
  muted: 'true',
  loop: 'true'
});

function buildStepVideoEmbedUrl(rawUrl){
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;

  try {
    const url = new URL(rawUrl, window.location.href);
    Object.entries(STEP_VIDEO_PLAYER_OPTIONS).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  } catch (error) {
    // Preserve the original URL rather than interrupting a recipe step if its source is malformed.
    return rawUrl;
  }
}

/* 🧩 [NL-DATA-05] Cloudflare video URLs + shared step definitions + per-recipe sequences */
const STEP_VIDEO_URLS = { // [NL-DATA-05a]
  "prep-gatherBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/2cd28df49be30765e57f3884e66bc5ed/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F2cd28df49be30765e57f3884e66bc5ed%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600", // [NL-DATA-05b]

  "prep-testAndGatherBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/280fe143b223a22b0367f27ac5d82ca9/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F280fe143b223a22b0367f27ac5d82ca9%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "prep-toastSeedsBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/0285745b0783c0c6fffac41818b76cfd/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F0285745b0783c0c6fffac41818b76cfd%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "prep-leavenGrowingBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/92c4a47386d355c19aeeb3b9fe0e1885/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F92c4a47386d355c19aeeb3b9fe0e1885%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "prep-leavenFloatTestBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/1f17bad7ab74f4f2eb976353c8b84ec4/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F1f17bad7ab74f4f2eb976353c8b84ec4%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "prep-gatherStarter":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/0123ab692fb527f47c1a5d635e160332/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F0123ab692fb527f47c1a5d635e160332%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "prep-gatherLeaven":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/2cd28df49be30765e57f3884e66bc5ed/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F2cd28df49be30765e57f3884e66bc5ed%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "prep-growingLeaven":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/92c4a47386d355c19aeeb3b9fe0e1885/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F92c4a47386d355c19aeeb3b9fe0e1885%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "initialMix-1stStarter":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/1a8acdc47472f9aa3f22004db31874ef/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F1a8acdc47472f9aa3f22004db31874ef%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "initialMix-noLeavenBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/f369ff8480e747c30e7ecaf64034e15b/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2Ff369ff8480e747c30e7ecaf64034e15b%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "initialMix-withLeavenBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/8a9b0363d192f1a2f7eb79b2293a1018/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F8a9b0363d192f1a2f7eb79b2293a1018%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "initialMix-addSaltBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/d4faea48eab008edab82571032c60b8f/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2Fd4faea48eab008edab82571032c60b8f%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "initialMix-addStarterLeaven":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/e6085c3e03ee6a7c916683833d120084/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2Fe6085c3e03ee6a7c916683833d120084%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "initialMix-addLeavenBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/f369ff8480e747c30e7ecaf64034e15b/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2Ff369ff8480e747c30e7ecaf64034e15b%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "bulk-2nd3rdStarter":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/f2582185cb1a5e1fac8d5cf4425b3a4e/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2Ff2582185cb1a5e1fac8d5cf4425b3a4e%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "bulk-restStarter":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/13f0d8f272ed01d8cce455eaf9266632/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F13f0d8f272ed01d8cce455eaf9266632%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "bulk-stirStarter":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/7b3b4328fab152a8555ea7df2b29a958/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F7b3b4328fab152a8555ea7df2b29a958%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "bulk-finalMixStarter":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/2daa58f105746dabef837a23f28c372e/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F2daa58f105746dabef837a23f28c372e%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "bulk-checkDonenessBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/95ca10de127c0dcfc14e22eec101728f/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F95ca10de127c0dcfc14e22eec101728f%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "bulk-restBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/80babcd79f397025b5effc862306413e/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F80babcd79f397025b5effc862306413e%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "bulk-addSeedsBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/d5022a6700f8a2aa1c9145ad05061d7c/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2Fd5022a6700f8a2aa1c9145ad05061d7c%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "bulk-stretchFoldBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/97cf531b4e227506e10a219d688f78c8/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F97cf531b4e227506e10a219d688f78c8%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "bulk-coilFoldBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/f260f801518b3e6dd48065845ae15eab/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2Ff260f801518b3e6dd48065845ae15eab%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "shape-preShapeSplitScreenBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/9481700620f0f37f2d13aed9dc571a5b/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F9481700620f0f37f2d13aed9dc571a5b%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "shape-splitScreenBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/0c2e0d7644218b78836b63be95b4a0c9/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F0c2e0d7644218b78836b63be95b4a0c9%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "shape-divideShapeBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/0c2e0d7644218b78836b63be95b4a0c9/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F0c2e0d7644218b78836b63be95b4a0c9%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "shape-benchRestBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/f50265299c67daa1629369dd02d04a7f/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2Ff50265299c67daa1629369dd02d04a7f%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "proof-testSplitScreenBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/902ad490f624643a7df0f8298cadd1c6/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F902ad490f624643a7df0f8298cadd1c6%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "proof-loadBasketSplitScreenBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/7c8d3b38e98e6f79abf091200b7e8b19/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F7c8d3b38e98e6f79abf091200b7e8b19%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "proof-coldProofBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/e184f448f4b1ed1cf00f726f22f3ba32/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2Fe184f448f4b1ed1cf00f726f22f3ba32%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "bake-preheatOvenBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/3256d9c19aed95207858787e92ad3193/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F3256d9c19aed95207858787e92ad3193%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "bake-bakeCoveredBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/6e0238d574fc6fabfe87924d8cf56121/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F6e0238d574fc6fabfe87924d8cf56121%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "bake-bakeUncoveredBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/ef81c1f1dfc77f3f9e5edcb95d39e44b/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2Fef81c1f1dfc77f3f9e5edcb95d39e44b%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "bake-scoreSequentialBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/a645b46c6622e9b895e058cfeab22c67/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2Fa645b46c6622e9b895e058cfeab22c67%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "bake-scoreSplitScreenBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/bfd5e03ec992e564dc5701752163929e/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2Fbfd5e03ec992e564dc5701752163929e%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "postBake-rackCoolBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/f6742c5e49b0804ca4cad939ee75776c/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2Ff6742c5e49b0804ca4cad939ee75776c%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "postBake-checkDonenessBread":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/95ca10de127c0dcfc14e22eec101728f/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F95ca10de127c0dcfc14e22eec101728f%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "postBake-refreshStarter":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/0b20d3ed13e065107748126a5fd5f532/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F0b20d3ed13e065107748126a5fd5f532%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600",

  "postBake-DiscardLeaven":
    "https://customer-wulggzlzr0mt8qia.cloudflarestream.com/2f306c92faa6c0d33c760a34dcf2733c/iframe?poster=https%3A%2F%2Fcustomer-wulggzlzr0mt8qia.cloudflarestream.com%2F2f306c92faa6c0d33c760a34dcf2733c%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600"
};

const STEP_DEFINITIONS = { // [NL-DATA-05c]
  // ---------- Master Steps List ----------

  // -- Prep --
  "step-leavenTest": { 
    id:"step-leavenTest",
    title:"Ensure Leaven is Ripe",
    description:"Make sure your leaven is ripe and ready. Use the float test.",
    videoKey:"prep-leavenFloatTestBread",
    chapterID:"prep"
  },
  "step-gather": { 
    id:"step-gather",
    title:"Gather Tools & Ingredients",
    description:"Best practice is to pre-weigh your ingredients and have them ready in separate bowls/containers. Gather all the tools, towels and other baking aids you will need.",
    videoKey:"prep-testAndGatherBread",
    chapterID:"prep"
  },
  "step-gatherBread": {
    id:"step-gatherBread",
    title:"Gather Bread Ingredients",
    description:"",
    videoKey:"prep-gatherBread",
    chapterID:"prep"
  },
  "step-toastSeeds": {
    id:"step-toastSeeds",
    title:"Toast Seeds",
    description:"",
    videoKey:"prep-toastSeedsBread",
    chapterID:"prep"
  },
  "step-leavenGrowing": {
    id:"step-leavenGrowing",
    title:"Leaven Growing",
    description:"",
    videoKey:"prep-leavenGrowingBread",
    chapterID:"prep"
  },
  "step-gatherStarter": {
    id:"step-gatherStarter",
    title:"Gather Starter",
    description:"",
    videoKey:"prep-gatherStarter",
    chapterID:"prep"
  },
  "step-gatherLeaven": {
    id:"step-gatherLeaven",
    title:"Gather Leaven",
    description:"",
    videoKey:"prep-gatherLeaven",
    chapterID:"prep"
  },
  "step-growingLeaven": {
    id:"step-growingLeaven",
    title:"Growing Leaven",
    description:"",
    videoKey:"prep-growingLeaven",
    chapterID:"prep"
  },

  // -- Initial Mix --
  "step-initialMix": { 
    id:"step-initialMix",
    title:"Initial Mix",
    description:"Mix flours, water and leaven. Don't add salt yet.",
    videoKey:"initialMix-withLeavenBread",
    chapterID:"initialMix"
  },
  "step-initialRest": { 
    id:"step-initialRest",
    title:"Cover & Rest",
    description:"Let the dough rest and meld ingredients.",
    videoKey:"bulk-restBread",
    chapterID:"initialMix"
  },
  "step-addSalt": { 
    id:"step-addSalt",
    title:"Add Salt",
    description:"It is good practice to dissolve the salt in water before incorporating it into the dough.",
    videoKey:"initialMix-addSaltBread",
    chapterID:"initialMix"
  },
  "step-firstRest": { 
    id:"step-firstRest",
    title:"Cover & Rest",
    description:"Let the dough rest and come together.",
    videoKey:"bulk-restBread",
    chapterID:"initialMix"
  },
  "step-mixStarter1st": {
    id:"step-mixStarter1st",
    title:"Initial Mix (Starter)",
    description:"",
    videoKey:"initialMix-1stStarter",
    chapterID:"initialMix"
  },
  "step-mixNoLeaven": {
    id:"step-mixNoLeaven",
    title:"Initial Mix (No Leaven)",
    description:"",
    videoKey:"initialMix-noLeavenBread",
    chapterID:"initialMix"
  },
  "step-mixAddStarterLeaven": {
    id:"step-mixAddStarterLeaven",
    title:"Add Starter/Leaven",
    description:"",
    videoKey:"initialMix-addStarterLeaven",
    chapterID:"initialMix"
  },
  "step-mixAddLeaven": {
    id:"step-mixAddLeaven",
    title:"Add Leaven",
    description:"",
    videoKey:"initialMix-addLeavenBread",
    chapterID:"initialMix"
  },

  // -- Bulk Ferment --
  "step-firstFold": { 
    id:"step-firstFold",
    title:"Stretch & Fold Dough",
    description:"Give the dough a good stretch and fold. You are strengthening the dough.",
    videoKey:"bulk-stretchFoldBread",
    chapterID:"bulk"
  },
  "step-secondRest": { 
    id:"step-secondRest",
    title:"Cover & Rest",
    description:"Let the dough rest and develop strength.",
    videoKey:"bulk-restBread",
    chapterID:"bulk"
  },
  "step-secondFold": { 
    id:"step-secondFold",
    title:"Stretch & Fold Dough",
    description:"The dough should feel more elastic and smooth at this point.",
    videoKey:"bulk-stretchFoldBread",
    chapterID:"bulk"
  },
  "step-thirdRest": { 
    id:"step-thirdRest",
    title:"Cover & Rest",
    description:"The dough is starting to get stronger and aerated.",
    videoKey:"bulk-restBread",
    chapterID:"bulk"
  },
  "step-thirdFold": { 
    id:"step-thirdFold",
    title:"Stretch & Fold Dough",
    description:"At this point, the dough should be less sticky, aerated and a little jiggly.",
    videoKey:"bulk-stretchFoldBread",
    chapterID:"bulk"
  },
  "step-fourthRest": { 
    id:"step-fourthRest",
    title:"Cover & Rest",
    description:"This is the next-to-final rest.",
    videoKey:"bulk-restBread",
    chapterID:"bulk"
  },
  "step-finalFold": { 
    id:"step-finalFold",
    title:"Stretch & Fold Dough",
    description:"Be more gentle with your folds at this point.",
    videoKey:"bulk-stretchFoldBread",
    chapterID:"bulk"
  },
  "step-finalRest": { 
    id:"step-finalRest",
    title:"Cover & Rest",
    description:"This is a prolonged rest before we pre-shape the dough.",
    videoKey:"bulk-restBread",
    chapterID:"bulk"
  },
  "step-bulkDoneTest": { 
    id:"step-bulkDoneTest",
    title:"Check if Dough is Ready for Shaping",
    description:"If at this point the dough does not seem ready, let it rest an additional 15 minutes and check again.",
    videoKey:"bulk-checkDonenessBread",
    chapterID:"bulk"
  },
  "step-starter2nd3rd": {
    id:"step-starter2nd3rd",
    title:"Mix Starter (2nd/3rd)",
    description:"",
    videoKey:"bulk-2nd3rdStarter",
    chapterID:"bulk"
  },
  "step-starterRest": {
    id:"step-starterRest",
    title:"Rest Starter",
    description:"",
    videoKey:"bulk-restStarter",
    chapterID:"bulk"
  },
  "step-starterStir": {
    id:"step-starterStir",
    title:"Stir Starter",
    description:"",
    videoKey:"bulk-stirStarter",
    chapterID:"bulk"
  },
  "step-starterFinalMix": {
    id:"step-starterFinalMix",
    title:"Final Mix Starter",
    description:"",
    videoKey:"bulk-finalMixStarter",
    chapterID:"bulk"
  },
  "step-addSeeds": {
    id:"step-addSeeds",
    title:"Add Seeds",
    description:"",
    videoKey:"bulk-addSeedsBread",
    chapterID:"bulk"
  },
  "step-coilFold": {
    id:"step-coilFold",
    title:"Coil Fold",
    description:"",
    videoKey:"bulk-coilFoldBread",
    chapterID:"bulk"
  },

  // -- Shape --
  "step-preShape": { 
    id:"step-preShape",
    title:"Pre-shape the Dough into a Round",
    description:"This is only a pre-shape step to keep the dough together. You will shape the dough into a boule or batard in the next steps.",
    videoKey:"shape-preShapeSplitScreenBread",
    chapterID:"shape"
  },
  "step-benchRest": { 
    id:"step-benchRest",
    title:"Cover & Rest",
    description:"After pre-shape, we'll let the dough rest.",
    videoKey:"shape-benchRestBread",
    chapterID:"shape"
  },
  "step-finalShape": { 
    id:"step-finalShape",
    title:"Shape the Dough into a Boule or Batard.",
    description:"Develop tension in the dough before loading into proofing baskets.",
    videoKey:"shape-splitScreenBread",
    chapterID:"shape"
  },
  "step-divideShape": {
    id:"step-divideShape",
    title:"Divide & Shape",
    description:"",
    videoKey:"shape-divideShapeBread",
    chapterID:"shape"
  },

  // -- Proof --
  "step-loadBaskets": { 
    id:"step-loadBaskets",
    title:"Load the Shaped Dough into Proofing Baskets.",
    description:"",
    videoKey:"proof-loadBasketSplitScreenBread",
    chapterID:"proof"
  },
  "step-coldProof": { 
    id:"step-coldProof",
    title:"Cover Dough and Place in Fridge",
    description:"You can cold proof overnight (and longer).",
    videoKey:"proof-coldProofBread",
    chapterID:"proof"
  },
  "step-checkProof": { 
    id:"step-checkProof",
    title:"Make Sure the Proofed Dough is Ready for Baking.",
    description:"",
    videoKey:"proof-testSplitScreenBread",
    chapterID:"proof"
  },

  // -- Bake --
  "step-preheatOven": { 
    id:"step-preheatOven",
    title:"Get the Oven and Baking Vessel Piping Hot.",
    description:"",
    videoKey:"bake-preheatOvenBread",
    chapterID:"bake"
  },
  "step-scoreDough": { 
    id:"step-scoreDough",
    title:"Score the Dough.",
    description:"",
    videoKey:"bake-scoreSplitScreenBread",
    chapterID:"bake"
  },
  "step-bakeCovered": { 
    id:"step-bakeCovered",
    title:"Bake Bread Covered for 20 Minutes.",
    description:"",
    videoKey:"bake-bakeCoveredBread",
    chapterID:"bake"
  },
  "step-bakeUncovered": { 
    id:"step-bakeUncovered",
    title:"Bake Bread Uncovered for 20 Minutes.",
    description:"",
    videoKey:"bake-bakeUncoveredBread",
    chapterID:"bake"
  },
  "step-scoreSequential": {
    id:"step-scoreSequential",
    title:"Score Dough (Sequential)",
    description:"",
    videoKey:"bake-scoreSequentialBread",
    chapterID:"bake"
  },

  // -- Post-Bake --
  "step-checkDoneness": { 
    id:"step-checkDoneness",
    title:"Make Sure the Bread is Fully Baked.",
    description:"",
    videoKey:"postBake-checkDonenessBread",
    chapterID:"postBake"
  },
  "step-rackCool": { 
    id:"step-rackCool",
    title:"Place Bread on a Rack to Cool.",
    description:"Do not cut the bread until it reaches room temperature.",
    videoKey:"postBake-rackCoolBread",
    chapterID:"postBake"
  },
  "step-refreshStarter": {
    id:"step-refreshStarter",
    title:"Refresh Starter",
    description:"",
    videoKey:"postBake-refreshStarter",
    chapterID:"postBake"
  },
  "step-discardLeaven": {
    id:"step-discardLeaven",
    title:"Discard Leaven",
    description:"",
    videoKey:"postBake-DiscardLeaven",
    chapterID:"postBake"
  }
};

const RECIPE_STEP_SEQUENCE = { // [NL-DATA-05d]
  "My First Bake": [ // [NL-DATA-05d-MFB]
    "step-leavenTest",
    "step-gather",
    "step-initialMix",
    "step-initialRest",
    "step-addSalt",
    "step-firstRest",
    "step-firstFold",
    "step-secondRest",
    "step-secondFold",
    "step-thirdRest",
    "step-thirdFold",
    "step-fourthRest",
    "step-finalFold",
    "step-finalRest",
    "step-bulkDoneTest",
    "step-preShape",
    "step-benchRest",
    "step-finalShape",
    "step-loadBaskets",
    "step-coldProof",
    "step-checkProof",
    "step-preheatOven",
    "step-scoreDough",
    "step-bakeCovered",
    "step-bakeUncovered",
    "step-checkDoneness",
    "step-rackCool"
  ],

  "Country White": [ // [NL-DATA-05d-CW]
    "step-leavenTest",
    "step-gather",
    "step-initialMix",
    "step-initialRest",
    "step-addSalt",
    "step-firstRest",
    "step-firstFold",
    "step-secondRest",
    "step-secondFold",
    "step-thirdRest",
    "step-thirdFold",
    "step-fourthRest",
    "step-finalFold",
    "step-finalRest",
    "step-bulkDoneTest",
    "step-preShape",
    "step-benchRest",
    "step-finalShape",
    "step-loadBaskets",
    "step-coldProof",
    "step-checkProof",
    "step-preheatOven",
    "step-scoreDough",
    "step-bakeCovered",
    "step-bakeUncovered",
    "step-checkDoneness",
    "step-rackCool"
  ],

  "High-Hydration White": [ // [NL-DATA-05d-HHW]
    "step-leavenTest",
    "step-gather",
    "step-initialMix",
    "step-initialRest",
    "step-addSalt",
    "step-firstRest",
    "step-firstFold",
    "step-secondRest",
    "step-secondFold",
    "step-thirdRest",
    "step-thirdFold",
    "step-fourthRest",
    "step-finalFold",
    "step-finalRest",
    "step-bulkDoneTest",
    "step-preShape",
    "step-benchRest",
    "step-finalShape",
    "step-loadBaskets",
    "step-coldProof",
    "step-checkProof",
    "step-preheatOven",
    "step-scoreDough",
    "step-bakeCovered",
    "step-bakeUncovered",
    "step-checkDoneness",
    "step-rackCool"
  ],

  "100% Whole Wheat": [ // [NL-DATA-05d-WW]
    "step-leavenTest",
    "step-gather",
    "step-initialMix",
    "step-initialRest",
    "step-addSalt",
    "step-firstRest",
    "step-firstFold",
    "step-secondRest",
    "step-secondFold",
    "step-thirdRest",
    "step-thirdFold",
    "step-fourthRest",
    "step-finalFold",
    "step-finalRest",
    "step-bulkDoneTest",
    "step-preShape",
    "step-benchRest",
    "step-finalShape",
    "step-loadBaskets",
    "step-coldProof",
    "step-checkProof",
    "step-preheatOven",
    "step-scoreDough",
    "step-bakeCovered",
    "step-bakeUncovered",
    "step-checkDoneness",
    "step-rackCool"
  ],

  "50-50 Bread": [ // [NL-DATA-05d-FF]
    "step-leavenTest",
    "step-gather",
    "step-initialMix",
    "step-initialRest",
    "step-addSalt",
    "step-firstRest",
    "step-firstFold",
    "step-secondRest",
    "step-secondFold",
    "step-thirdRest",
    "step-thirdFold",
    "step-fourthRest",
    "step-finalFold",
    "step-finalRest",
    "step-bulkDoneTest",
    "step-preShape",
    "step-benchRest",
    "step-finalShape",
    "step-loadBaskets",
    "step-coldProof",
    "step-checkProof",
    "step-preheatOven",
    "step-scoreDough",
    "step-bakeCovered",
    "step-bakeUncovered",
    "step-checkDoneness",
    "step-rackCool"
  ],

  "White Seed Sourdough": [ // [NL-DATA-05e-WSB]
      "step-leavenTest",
      "step-gather",
      "step-initialMix",
      "step-initialRest",
      "step-addSalt",
      "step-firstRest",
      "step-addSeeds",
      "step-secondRest",
      "step-addSeeds",
      "step-thirdRest",
      "step-addSeeds",
      "step-fourthRest",
      "step-finalFold",
      "step-finalRest",
      "step-bulkDoneTest",
      "step-preShape",
      "step-benchRest",
      "step-finalShape",
      "step-loadBaskets",
      "step-coldProof",
      "step-checkProof",
      "step-preheatOven",
      "step-scoreDough",
      "step-bakeCovered",
      "step-bakeUncovered",
      "step-checkDoneness",
      "step-rackCool"
  ]  
};

/* ===== SECTION 9F: HUMAN-FRIENDLY CHAPTER LABELS ===== */
/* 🧩 [NL-DATA-06] Map chapter IDs → display labels for nav + summaries */
const CHAPTER_LABELS = { // [NL-DATA-06a]
  prep:       "Preparation",    // [NL-DATA-06b]
  initialMix: "Initial Mix",    // [NL-DATA-06c]
  bulk:       "Bulk Ferment",   // [NL-DATA-06d]
  shape:      "Divide & Shape", // [NL-DATA-06e]
  proof:      "Proof",          // [NL-DATA-06f]
  bake:       "Bake",           // [NL-DATA-06g]
  postBake:   "Post-Bake",      // [NL-DATA-06h]
  core:       "Core Steps"      // [NL-DATA-06i] (for future non-bread/core recipes)
};


// ====================== SECTION 10: MAIN APP LOGIC (JS) ====================== 

// BUILD: v2.0-tabs-scroll
// 🧩 [NL-JS-01] Main IIFE: wires DOM, data, and behaviors (nutrition math, formula stats, scroll-sync)
(() => {
  // 🧩 [NL-JS-01] Removed static variable capture. We now fetch elements dynamically to prevent null reference on initial load.

  let totalRecipeWeight = 0; // [NL-JS-01n]
  let totalRecipeFlour  = 0; // [NL-JS-01o]
  let totalRecipeWater  = 0; // [NL-JS-01p]
  let totalLevainWeight = 0; // [NL-JS-01q] total levain weight (all levain rows)
  let totalLevainFlour  = 0; // [NL-JS-01r] flour *inside* levain

  let currentStepIndex  = 0; // [NL-JS-01s] active step index for Steps Review

  let cooledBreadWeight = 0;      // [NL-JS-01t] room-temp bread weight (g) for stats
  let cooledBreadLocked = false;  // [NL-JS-01u] true once user edits cooled weight

  // 🔹 Track when we're scrolling because of a tab click
  let isProgrammaticScroll = false; // [NL-JS-01q]
  let scrollEndTimer = null;        // [NL-JS-01r]

  /* ===== Utility: numeric formatting ===== */
  // 🧩 [NL-JS-02] Utility: format numbers with sensible decimals for label display
  function formatNumber(val, decimals){ // [NL-JS-02a]
    if (!isFinite(val)) return "";                                       // [NL-JS-02b]

    // Respect the explicit decimals set on each nutrient row (e.g., grams: 1 decimal as xxx.y). // [NL-JS-02c]
    const d = Math.max(0, parseInt(decimals ?? 0, 10) || 0);             // [NL-JS-02d]

    // d=0 => integer; d>0 => fixed decimal places (keeps trailing zero).  // [NL-JS-02e]
    return (d === 0) ? String(Math.round(val)) : Number(val).toFixed(d); // [NL-JS-02f]
  }

  // 🧩 [NL-JS-03] Update footer recipe name
  function updateFoot(rec){ // [NL-JS-03a]
    const footInfo = document.getElementById('footInfo');
    if (footInfo && rec) footInfo.textContent = `Recipe: ${rec.recipeName}`; // [NL-JS-03b]
  }

  // 🧩 [NL-JS-04] Apply DV region flag to the select background
  function applyDVFlag(){ // [NL-JS-04a]
    const dvSelect = document.getElementById('dvSelect');
    if (!dvSelect) return;                        // [NL-JS-04b]
    const url = FLAG_SVGS[dvSelect.value];        // [NL-JS-04c]
    if (url){
      dvSelect.style.setProperty('--flag', `url("${url}")`); // [NL-JS-04d]
    } else {
      dvSelect.style.removeProperty('--flag');               // [NL-JS-04e]
    }
  }

  /* ===== Nutrition values + %DV ===== */
  // 🧩 [NL-JS-05] Recalculate nutrient amounts + DV% from recipe, serving size & DV region
  function updateValues(){ // [NL-JS-05a]
    const recipeSelect = document.getElementById('recipeSelect');
    const serveInput = document.getElementById('serveG');
    const dvSelect = document.getElementById('dvSelect');
    const rowsWrap = document.getElementById('rows');

    if (!recipeSelect || !serveInput || !dvSelect || !rowsWrap) return;

    const rec     = RECIPES[recipeSelect.value || "My First Bake"]; // [NL-JS-05b]
    const perBase = rec.perBase || 50;                              // [NL-JS-05c]
    const grams   = Math.max(1, Math.min(3000,
                     parseInt(serveInput.value || rec.serveSize, 10))); // [NL-JS-05d]
    const factor  = grams / perBase;                                // [NL-JS-05e]
    const dvRef   = getDVRef(dvSelect.value);                       // [NL-JS-05f]

    rowsWrap.querySelectorAll('.row.nutrient').forEach(row => {     // [NL-JS-05g]
      const label    = row.querySelector('.name')?.textContent.trim();   // [NL-JS-05h]
      const canonKey = NUTRIENT_KEYS[label];                             // [NL-JS-05i]
      const unitTxt  = (row.getAttribute('data-unit') || "").trim();                 // [NL-JS-05j]
      const decAttr  = parseInt(row.getAttribute('data-decimals') || "1", 10);        // [NL-JS-05k]
      const decimals = (unitTxt === "g") ? 1 : decAttr;                                // [NL-JS-05l]
      const valSpan  = row.querySelector('.val');                        // [NL-JS-05k2]
      const pctSpan  = row.querySelector('.pct');                        // [NL-JS-05l2]

      const base   = Number(rec[canonKey] ?? 0);                         // [NL-JS-05m]
      const amount = base * factor;                                      // [NL-JS-05n]

      if (valSpan) valSpan.textContent = formatNumber(amount, decimals); // [NL-JS-05o]

      const ref = dvRef[canonKey];                                       // [NL-JS-05p]
      if (pctSpan){
        if (ref && ref > 0){
          pctSpan.textContent = `${Math.round((amount / ref) * 100)}%`;  // [NL-JS-05q]
        } else {
          pctSpan.textContent = "";                                      // [NL-JS-05r]
        }
      }
    });

    updateFoot(rec); // [NL-JS-05s]
  }

  /* ===== FORMULA HELPERS ===== */

// 🧩 [SJ-PRINT-01] Print Nutrition label
function openRecipePrintWindow(){
  const card = document.querySelector('#panel-nutrition .nutrition');
  if (!card) return;

  // 🧩 [SJ-PRINT-01a] NEW STRATEGY (DESKTOP PRINT + MOBILE SCREENSHOT)
  // ✅ Desktop (PC/Mac): printing works reliably (Chrome + Safari)
  // ❌ Mobile/Tablet: browser print engines frequently revert to "print the whole page"
  //    (20+ pages) or simply ignore JS print calls.
  //
  // So we do this:
  // 1) Desktop -> clone the Nutrition label into an isolated print iframe
  // 2) Mobile/Tablet -> show a full-screen, perfect label and tell user to screenshot

  if (sjIsMobileOrTabletForPrint()){
    sjOpenNutritionScreenshotOverlay(card);
    return;
  }

  sjDesktopPrintNutritionLabel();
}

// ✅ 2026-03-13 🧩 [SJ-PRINT-02] Expose the print helper for the existing inline HTML button.
window.openRecipePrintWindow = openRecipePrintWindow;

// 🧩 [SJ-PRINT-01b] Simple device detection for "print-safe desktop" vs "mobile/tablet"
function sjIsMobileOrTabletForPrint(){
  const ua = (navigator.userAgent || '').toLowerCase();
  const isAndroid = ua.includes('android');

  // iPad on iOS 13+ can pretend to be "Mac", so we also check maxTouchPoints.
  const isAppleMobile = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);

  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
  const isCoarsePointer = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const isSmallish = !!(window.matchMedia && window.matchMedia('(max-width: 1024px)').matches);

  // Keep this conservative: if it looks like a mobile/tablet, treat it as such.
  return (isAndroid || isAppleMobile) && (isTouch || isCoarsePointer || isSmallish);
}

// ✅ 2026-04-28 🧩 [SJ-PRINT-01c] DESKTOP PRINT (PC/Mac): isolated iframe print surface
function sjDesktopPrintNutritionLabel(){
  const sourceCard = document.querySelector('#panel-nutrition .nutrition');
  if (!sourceCard) return;

  // The older desktop print route temporarily printed the live sjLearn page by adding
  // body.sj-print-label-only. That was too vulnerable to the Book page's fixed headers,
  // sticky section CSS, overflow containers, and end-of-book scroll buffer. The result was
  // a correctly calculated label inside a very tall, broken print box.
  //
  // Safer route: clone only the Nutrition label into a tiny off-screen iframe, inject the
  // label-only print CSS, print that iframe, then remove it. The live Recipes screen and
  // the mobile/tablet screenshot workflow remain untouched.

  // ✅ 26Jun26b 🧩 [SJP-PRINT-LOGO-CANVAS-01] (replaces 26Jun26a fetch approach)
  // Logo is resolved to a data URI via canvas before the print iframe is built.
  // See resolveLogoThenPrint() below.

  function buildAndPrintFrame(resolvedLogoSrc) {
    const printFrame = document.createElement('iframe');
    printFrame.setAttribute('title', 'SourJoe nutrition label print frame');
    printFrame.setAttribute('aria-hidden', 'true');
    printFrame.style.position = 'fixed';
    printFrame.style.left = '-10000px';
    printFrame.style.top = '0';
    printFrame.style.width = '1px';
    printFrame.style.height = '1px';
    printFrame.style.border = '0';
    printFrame.style.opacity = '0';

    document.body.appendChild(printFrame);

    const clonedCard = sjBuildNutritionPrintClone(sourceCard, resolvedLogoSrc);
    const printDoc = printFrame.contentDocument || printFrame.contentWindow.document;

    printDoc.open();
    printDoc.write(sjBuildNutritionPrintDocument(clonedCard.outerHTML));
    printDoc.close();

    const cleanup = () => {
      try{ printFrame.remove(); } catch(_e){}
    };

    const runPrint = () => {
      const printWin = printFrame.contentWindow;
      if (!printWin){ cleanup(); return; }

      try{
        printWin.focus();
        printWin.print();
      } catch(_e){
        cleanup();
        return;
      }

      try{ printWin.addEventListener('afterprint', cleanup, { once:true }); } catch(_e){}
      setTimeout(cleanup, 8000);
    };

    sjWaitForNutritionPrintAssets(printDoc, runPrint);
  }

  // ✅ 26Jun26b 🧩 [SJP-PRINT-LOGO-CANVAS-01]
  // Convert the already-loaded Sourjoe logo to a data URI via canvas so it renders
  // reliably inside the isolated print iframe (cross-origin <img> in document.write()
  // iframes are blocked by modern browsers regardless of CORS fetch).
  // Strategy: find any already-decoded copy of the logo anywhere on the page (the
  // header logo uses the same URL and is already loaded), draw it to an off-screen
  // canvas, then export as PNG data URI. Falls back to the original src if canvas
  // is unavailable or the image is tainted.
  const logoEl = sourceCard.querySelector('.sj-print-logo');
  const logoSrc = logoEl ? logoEl.src : '';

  function canvasDataUri(imgEl, fallbackSrc) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imgEl.naturalWidth || imgEl.width || 200;
      canvas.height = imgEl.naturalHeight || imgEl.height || 80;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgEl, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (e) {
      // SecurityError if image is cross-origin tainted — return original src
      return fallbackSrc;
    }
  }

  function resolveLogoThenPrint() {
    // Look for any already-decoded copy of the logo on the page
    const anyLogoImg = Array.from(document.images).find(
      img => img.src === logoSrc && img.complete && img.naturalWidth > 0
    );

    if (anyLogoImg) {
      const dataUri = canvasDataUri(anyLogoImg, logoSrc);
      buildAndPrintFrame(dataUri);
      return;
    }

    // No decoded copy found — load a fresh image with crossOrigin hint
    if (!logoSrc) { buildAndPrintFrame(''); return; }

    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
    tempImg.onload = function() {
      const dataUri = canvasDataUri(tempImg, logoSrc);
      buildAndPrintFrame(dataUri);
    };
    tempImg.onerror = function() {
      // crossOrigin load failed (no CORS headers) — fall back to original src
      buildAndPrintFrame(logoSrc);
    };
    // Force a fresh uncached load with crossOrigin set (cached non-CORS copy won't work)
    tempImg.src = logoSrc + (logoSrc.includes('?') ? '&' : '?') + '_sjcors=' + Date.now();
    // Safety timeout in case neither event fires
    setTimeout(function() { if (!tempImg.complete) buildAndPrintFrame(logoSrc); }, 1500);
  }

  resolveLogoThenPrint();
} // end sjDesktopPrintNutritionLabel

// ✅ 2026-04-28 🧩 [SJ-PRINT-01cA] Clone live Nutrition label for isolated desktop printing
// ✅ 26Jun26a 🧩 [SJP-PRINT-LOGO-DATAURI-01] Added resolvedLogoSrc param to embed data URI
// ✅ 26Jun26c 🧩 [SJP-PRINT-LOGO-BRACE-01] Restored as module-level function (was accidentally nested)
function sjBuildNutritionPrintClone(sourceCard, resolvedLogoSrc){
  const clone = sourceCard.cloneNode(true);

  // Preserve the current serving-size value, even if the user changed it after page load.
  const sourceServe = sourceCard.querySelector('#serveG');
  const cloneServe = clone.querySelector('#serveG');
  if (sourceServe && cloneServe){
    cloneServe.value = sourceServe.value;
    cloneServe.setAttribute('value', sourceServe.value);
  }

  // Remove duplicate IDs inside the isolated print document. This is defensive only, but it
  // avoids future confusion if a browser extension or print engine inspects the frame DOM.
  clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

  // Desktop print should show the SourJoe logo instead of the interactive DV/Print tools.
  clone.querySelectorAll('.dv-tools').forEach(el => el.remove());
  const logo = clone.querySelector('.sj-print-logo');
  if (logo){
    logo.style.display = 'block';
    // If a pre-fetched data URI was provided, swap the src so the logo loads
    // reliably inside the isolated print iframe (avoids cross-origin image block).
    if (resolvedLogoSrc) {
      logo.src = resolvedLogoSrc;
    }
  }

  return clone;
}

// ✅ 2026-04-28 🧩 [SJ-PRINT-01cB] Tiny one-label print document, independent of sjLearn page CSS
function sjBuildNutritionPrintDocument(labelHtml){
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>SourJoe Nutrition Label</title>
  <style>
    @page{ margin:8mm; }
    html,
    body{
      margin:0;
      padding:0;
      background:#fff;
      color:#000;
      font-family:Arial, sans-serif;
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }

    /* ✅ 2026-04-29 🧩 [SJ-PRINT-ASPECT-01]
       Desktop print uses an isolated iframe, but the label itself must keep the
       same tall Nutrition-label proportions as the mobile screenshot version.
       The earlier iframe CSS was intentionally compact and made the PC print
       too squat. These values restore the screen/mobile proportions while
       preserving the useful top-left print position for future side-by-side
       Formula-card printing. */
    .sj-print-page{
      width:90mm;
      margin:0;
      padding:0;
    }
    .nutrition{
      --left-width:40%;
      --body-left-nudge:20px;
      --pad-x:14px;
      box-sizing:border-box;
      width:90mm;
      max-width:90mm;
      margin:0;
      color:#000;
      background:#fff;
      border:4px solid #000;
      border-radius:6px;
      box-shadow:none !important;
      line-height:1.32;
      font-size:14pt;
      overflow:hidden;
      break-inside:avoid;
      page-break-inside:avoid;
    }
    .nutrition header{
      display:block;
      padding:12px var(--pad-x) 10px;
      border-bottom:4px solid #000;
      background:#fff;
    }
    .nutrition .headbar{
      display:grid;
      grid-template-columns:1fr var(--nl-value-col-width, 120px);
      grid-template-areas:
        "title logo"
        "serve logo";
      row-gap:4px;
      align-items:center;
    }
    .nutrition .title{
      grid-area:title;
      margin:0;
      font-size:22px;
      font-weight:900;
      letter-spacing:.2px;
      line-height:1;
      white-space:nowrap;
    }
    .nutrition .sj-print-logo{
      display:block !important;
      grid-area:logo;
      justify-self:center;
      align-self:center;
      height:14mm;
      width:auto;
      max-width:28mm;
      object-fit:contain;
      margin:0;
      transform:none;
    }
    .nutrition .dv-tools{
      display:none !important;
    }
    .nutrition .serve{
      grid-area:serve;
      display:flex;
      align-items:center;
      gap:8px;
      flex-wrap:wrap;
      font-weight:600;
      line-height:1.32;
    }
    .nutrition .serve-prefix,
    .nutrition .serve-unit,
    .nutrition .serve-unit-full{
      display:inline;
    }
    .nutrition .serve-unit-short{
      display:none;
    }
    .nutrition .serve input[type="number"]{
      box-sizing:border-box;
      width:90px;
      height:32px;
      padding:2px 6px;
      border:2px solid #000;
      border-radius:6px;
      background:#fff;
      color:#000;
      font:inherit;
      font-size:.90em;
      line-height:1;
      text-align:center;
      appearance:textfield;
    }
    .nutrition .table{
      padding:8px var(--pad-x) 0;
      padding-left:calc(var(--pad-x) + var(--body-left-nudge));
    }
    .nutrition .rows{
      display:flex;
      flex-direction:column;
    }
    .nutrition .row{
      display:grid;
      grid-template-columns:var(--left-width) 1fr;
      align-items:baseline;
      padding:4px 0;
      line-height:1.32;
      white-space:nowrap;
      break-inside:avoid;
      page-break-inside:avoid;
    }
    .nutrition .name{
      grid-column:1;
      text-align:left;
      padding-right:8px;
      font-weight:700;
      margin-left:calc(-1 * var(--body-left-nudge));
    }
    .nutrition .row.sub .name{
      text-align:right;
      color:#5d5d5d;
      font-weight:600;
      font-size:.94em;
    }
    .nutrition .value{
      grid-column:2;
      display:grid;
      grid-template-columns:1fr 1fr;
      align-items:baseline;
      gap:6px;
    }
    .nutrition .value .amt{
      text-align:right;
      margin-left:0;
      margin-right:5px;
    }
    .nutrition .value .pct{
      text-align:center;
      color:#5d5d5d;
      font-size:.88em;
      margin-right:10px;
    }
    .nutrition .row.sub .value .pct{
      opacity:.9;
    }
    .nutrition .row.legend{
      padding-top:0;
      padding-bottom:2px;
      color:#2563eb;
      font-weight:600;
      font-size:.9em;
    }
    .nutrition .row.legend .value{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:6px;
      text-align:center;
    }
    .nutrition .hr{
      border-top:2px solid #000;
      margin:6px 0;
    }
    .nutrition .foot{
      color:#5d5d5d;
      padding:8px var(--pad-x) 12px;
      border-top:4px solid #000;
      font-size:.82rem;
      line-height:1.32;
    }
    .nutrition .foot span{
      display:block;
      text-align:center;
      font-weight:700;
      font-size:1.05rem;
      line-height:1.32;
    }
  </style>
</head>
<body>
  <div class="sj-print-page">${labelHtml}</div>
</body>
</html>`;
}

// ✅ 2026-04-28 🧩 [SJ-PRINT-01cC] Wait briefly for logo/image assets before printing iframe
function sjWaitForNutritionPrintAssets(printDoc, callback){
  const images = Array.from(printDoc.images || []);
  const waiting = images.filter(img => !img.complete);

  if (!waiting.length){
    setTimeout(callback, 60);
    return;
  }

  let remaining = waiting.length;
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    setTimeout(callback, 60);
  };

  const markOne = () => {
    remaining -= 1;
    if (remaining <= 0) finish();
  };

  waiting.forEach(img => {
    img.addEventListener('load', markOne, { once:true });
    img.addEventListener('error', markOne, { once:true });
  });

  // Do not let a slow logo/network request block the print dialog.
  setTimeout(finish, 900);
}

// 🧩 [SJ-PRINT-01d] MOBILE/TABLET FALLBACK: Full-screen label for screenshot
function sjOpenNutritionScreenshotOverlay(card){
  // If already open, close it
  const existing = document.getElementById('sjScreenshotOverlay');
  if (existing){
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'sjScreenshotOverlay';
  overlay.className = 'sj-screenshot-overlay';

  const topBar = document.createElement('div');
  topBar.className = 'sj-screenshot-topbar';
  topBar.innerHTML = `
    <div class="sj-screenshot-instructions">
      <div class="sj-screenshot-title">Mobile Print Shortcut</div>
      <div class="sj-screenshot-sub">Tap × to hide this message. Screenshot the label, then print from Photos/Files. When done, tap once to show Close.</div>
    </div>
    <div class="sj-screenshot-actions">
      <button type="button" class="sj-screenshot-hide" aria-label="Hide instructions" title="Hide instructions">×</button>
    </div>
  `;

  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'sj-screenshot-body';

  // Clone the Nutrition label so we don't disturb the live UI
  const clone = card.cloneNode(true);

  // Remove the DV/tools column + print icon inside the clone (avoid confusion)
  clone.querySelectorAll('.dv-tools').forEach(el => el.remove());

  // Make sure the logo element exists and is visible in overlay mode
  const logo = clone.querySelector('.sj-print-logo');
  if (logo){
    logo.style.display = 'block';
  }

  // Freeze inputs/selects so no keyboard pops up while taking screenshot
  clone.querySelectorAll('input, select, button').forEach(el => {
    el.setAttribute('disabled', 'disabled');
  });

  bodyWrap.appendChild(clone);
  overlay.appendChild(topBar);
  overlay.appendChild(bodyWrap);

  // 🧩 [SJ-PRINT-01e] Post-helper Close X (appears ONLY AFTER the helper is dismissed)
  // This keeps the screenshot perfectly clean (no UI overlays) at first.
  // We use the same circular X look and the same top-right placement so it's intuitive.
  const closeX = document.createElement('button');
  closeX.type = 'button';
  closeX.className = 'sj-screenshot-close-x';
  closeX.setAttribute('aria-label', 'Close label');
  closeX.setAttribute('title', 'Close');
  closeX.textContent = '×';
  overlay.appendChild(closeX);

  document.body.appendChild(overlay);

  const close = () => {
    try{ overlay.remove(); } catch(_e){}
  };

  // Hide ONLY the helper message (keep the label for screenshot)
  overlay.querySelector('.sj-screenshot-hide')?.addEventListener('click', (e) => {
    // Prevent any accidental bubbling; we only want to hide the helper bar
    e.stopPropagation();
    topBar.classList.add('is-hidden');
  });

  // Close X (only visible after helper is dismissed)
  closeX.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });

  // 🧩 [SJ-PRINT-01g] Tap behavior (mobile/tablet screenshot mode):
  // - BEFORE helper is dismissed: tap outside the label closes overlay
  // - AFTER helper is dismissed: FIRST tap anywhere reveals the Close X
  // - Optional convenience: once Close X is visible, tapping the background closes overlay
  overlay.addEventListener('click', (e) => {
    const helperHidden = topBar.classList.contains('is-hidden');
    const closeVisible = closeX.classList.contains('is-visible');

    // Before helper is dismissed: only background taps should close
    if (!helperHidden){
      if (e.target === overlay){
        close();
      }
      return;
    }

    // After helper is dismissed: first tap anywhere shows Close X
    if (!closeVisible){
      closeX.classList.add('is-visible');
      return;
    }

    // Convenience close: background tap closes once Close X is visible
    if (e.target === overlay){
      close();
    }
  });
}

  // 🧩 [NL-JS-06] Convert amount + scale → grams for easier math
  function toGrams(amount, scale){ // [NL-JS-06a]
    if (amount == null || isNaN(amount)) return 0; // [NL-JS-06b]
    switch ((scale || "").toLowerCase()){          // [NL-JS-06c]
      case "mg": return amount / 1000;             // [NL-JS-06d]
      case "g":  return amount;                    // [NL-JS-06e]
      case "kg": return amount * 1000;             // [NL-JS-06f]
      default:   return 0;                         // [NL-JS-06g]
    }
  }

    // 🧩 [NL-JS-06h] Compute flour + water from a levain given hydration %
  // totalG      = total levain weight (g)
  // hydrationType = string like "100%", "50%", "125%" (anything else → 0/0)
  function computeLevainParts(totalG, hydrationType){
    // Guard rails: invalid weight → no contribution
    if (!isFinite(totalG) || totalG <= 0){
      return { flour:0, water:0 };
    }

    const typeStr = (hydrationType || "").trim();
    const match   = typeStr.match(/^(\d+(?:\.\d+)?)\s*%$/);
    if (!match){
      // Not a X% pattern → treat as non-levain; caller will ignore
      return { flour:0, water:0 };
    }

    const hydrationPct = parseFloat(match[1]);  // e.g. 100, 50, 125
    if (!isFinite(hydrationPct) || hydrationPct < 0){
      return { flour:0, water:0 };
    }

    // hydration% = (water / flour) * 100
    // Let h = hydrationPct/100, then:
    //   water = h * flour
    //   total = flour + water = flour * (1 + h)  ⇒ flour = total / (1 + h)
    const h      = hydrationPct / 100;
    const flour  = totalG / (1 + h);
    const water  = totalG - flour;  // whatever is left is water

    return { flour, water };
  }

  // 🧩 [NL-JS-07] Format total grams into g/kg with trimmed decimals
  function formatTotalParts(totalG){ // [NL-JS-07a]
    if (!isFinite(totalG) || totalG <= 0){
      return { value:"", unit:"" };               // [NL-JS-07b]
    }
    let raw, unit;                                // [NL-JS-07c]
    if (totalG < 1000){
      raw  = totalG;
      unit = "g";                                 // [NL-JS-07d]
    } else {
      raw  = totalG / 1000;
      unit = "kg";                                // [NL-JS-07e]
    }
    let value = raw.toFixed(3).replace(/0+$/, "").replace(/\.$/, ""); // [NL-JS-07f]
    return { value, unit };                       // [NL-JS-07g]
  }

  // 🧩 [NL-JS-07h] Format a number as a compact percentage string
  function formatPercent(value){
    if (!isFinite(value)) return "";
    const rounded = value.toFixed(1);                 // e.g. "75.0"
    return rounded.replace(/\.0$/, "") + "%";        // → "75%"
  }

function updateStats(){ // [NL-JS-08a]
    const statTotalWeightValue = document.getElementById('statTotalWeightValue');
    const statTotalFlourValue  = document.getElementById('statTotalFlourValue');
    const statTotalWaterValue  = document.getElementById('statTotalWaterValue');
    const statHydrationValue      = document.getElementById('statHydrationValue');
    const statLevainFlourPctValue = document.getElementById('statLevainFlourPctValue');
    const statLevainPctValue      = document.getElementById('statLevainPctValue');
    const statCooledWeightInput      = document.getElementById('statCooledWeight');
    const statWeightLossValue        = document.getElementById('statWeightLossValue');
    const statTotalLoafCaloriesValue = document.getElementById('statTotalLoafCaloriesValue');
    const statCaloriesPerGramValue   = document.getElementById('statCaloriesPerGramValue');
    const recipeSelect = document.getElementById('recipeSelect');

    const weight = formatTotalParts(totalRecipeWeight); // [NL-JS-08b]
    const flour  = formatTotalParts(totalRecipeFlour);  // [NL-JS-08c]
    const water  = formatTotalParts(totalRecipeWater);  // [NL-JS-08d]

    // --- Existing 3 stats: weight / flour / water ---
    if (statTotalWeightValue){
      statTotalWeightValue.textContent = weight.value
        ? `${weight.value} ${weight.unit}` : "";        // [NL-JS-08e]
    }
    if (statTotalFlourValue){
      statTotalFlourValue.textContent = flour.value
        ? `${flour.value} ${flour.unit}` : "";          // [NL-JS-08f]
    }
    if (statTotalWaterValue){
      statTotalWaterValue.textContent = water.value
        ? `${water.value} ${water.unit}` : "";          // [NL-JS-08g]
    }

    // --- New stats derived from flour/water/levain ---
    let hydrationPct      = null;
    let levainFlourPct    = null;
    let levainPct         = null;

    if (totalRecipeFlour > 0){
      if (totalRecipeWater > 0){
        hydrationPct = (totalRecipeWater / totalRecipeFlour) * 100;
      }
      if (totalLevainFlour > 0){
        levainFlourPct = (totalLevainFlour / totalRecipeFlour) * 100;
      }
      if (totalLevainWeight > 0){
        levainPct = (totalLevainWeight / totalRecipeFlour) * 100;
      }
    }

    if (statHydrationValue){
      statHydrationValue.textContent =
        hydrationPct != null ? formatPercent(hydrationPct) : "";
    }
    if (statLevainFlourPctValue){
      statLevainFlourPctValue.textContent =
        levainFlourPct != null ? formatPercent(levainFlourPct) : "";
    }
    if (statLevainPctValue){
      statLevainPctValue.textContent =
        levainPct != null ? formatPercent(levainPct) : "";
    }

    // --- New: cooled loaf weight + derived calorie stats ---

    // Default cooled weight ≈ 85% of total recipe weight,
    // unless the user has overridden it.
    let effectiveCooled = cooledBreadWeight;

    if (!isFinite(effectiveCooled) || effectiveCooled <= 0 || effectiveCooled > totalRecipeWeight){
      if (totalRecipeWeight > 0){
        const defaultCooled = totalRecipeWeight * 0.85;
        if (!cooledBreadLocked){
          // Auto mode: use ~85% of total recipe weight
          cooledBreadWeight = defaultCooled;
          effectiveCooled   = defaultCooled;
        } else {
          // User is editing but value is empty/invalid → treat as 0,
          // leave input as-is (blank) and suppress dependent stats.
          effectiveCooled = 0;
        }
      } else {
        effectiveCooled = 0;
      }
    }

    if (statCooledWeightInput){
      if (effectiveCooled > 0){
        statCooledWeightInput.value = Math.round(effectiveCooled);
      } else if (!cooledBreadLocked){
        // Only clear the box in auto mode; if locked+empty, keep it blank
        statCooledWeightInput.value = "";
      }
    }

    // Weight Loss = Total Recipe Weight − Room Temp. Bread Weight
    if (statWeightLossValue){
      if (totalRecipeWeight > 0 && effectiveCooled > 0){
        const loss = Math.max(0, totalRecipeWeight - effectiveCooled);
        statWeightLossValue.textContent = Math.round(loss).toString();
      } else {
        statWeightLossValue.textContent = "";
      }
    }

    // Total Loaf Calories + Calories/gram from Nutrition recipe data
    let loafCalories    = null;
    let caloriesPerGram = null;

    if (effectiveCooled > 0 && recipeSelect){
      const recipeName = recipeSelect.value || "My First Bake";
      const rec        = RECIPES[recipeName];
      if (rec && rec.calories != null){
        const baseG = rec.perBase || rec.serveSize || 0;
        if (baseG > 0){
          caloriesPerGram = rec.calories / baseG;
          loafCalories    = caloriesPerGram * effectiveCooled;
        }
      }
    }

    if (statTotalLoafCaloriesValue){
      statTotalLoafCaloriesValue.textContent =
        loafCalories != null && isFinite(loafCalories)
          ? Math.round(loafCalories).toString()
          : "";
    }

    if (statCaloriesPerGramValue){
      statCaloriesPerGramValue.textContent =
        caloriesPerGram != null && isFinite(caloriesPerGram)
          ? caloriesPerGram.toFixed(2)
          : "";
    }
  }

  // 🧩 [NL-JS-08i] Handle manual edits to cooled loaf weight input
  function handleCooledWeightInput(){ // [NL-JS-08i]
    const statCooledWeightInput = document.getElementById('statCooledWeight');
    if (!statCooledWeightInput) return;

    const text = statCooledWeightInput.value;

    // If user has cleared the field, keep it empty but mark as "user-controlled"
    if (text.trim() === ""){
      cooledBreadWeight = 0;
      cooledBreadLocked = true;   // user is actively editing
      updateStats();
      return;
    }

    const raw = parseFloat(text);
    if (!isFinite(raw) || raw <= 0){
      // Invalid value but still user-controlled → keep it locked,
      // stats dependent on cooled weight will blank out.
      cooledBreadWeight = 0;
      cooledBreadLocked = true;
      updateStats();
      return;
    }

    let val = raw;
    if (totalRecipeWeight > 0 && val > totalRecipeWeight){
      val = totalRecipeWeight;
    }

    cooledBreadWeight = val;
    cooledBreadLocked = true;     // stay in user mode
    // Do NOT overwrite input here; let the user see exactly what they typed
    updateStats();
  }

  // 🧩 [NL-JS-09] Render Formula table from FORMULAS[recipe]; compute totals + baker’s % */
  function renderFormula(){ // [NL-JS-09a]
    const formulaTable = document.getElementById('formulaTable');
    const formulaTotalAmount = document.getElementById('formulaTotalAmount');
    const recipeSelect = document.getElementById('recipeSelect');

    if (!formulaTable) return;                           // [NL-JS-09b]
    const tbody = formulaTable.querySelector('tbody');   // [NL-JS-09c]
    if (!tbody) return;                                  // [NL-JS-09d]

    tbody.innerHTML = "";                                // [NL-JS-09e]

    const recipeName = recipeSelect ? (recipeSelect.value || "My First Bake") : "My First Bake"; // [NL-JS-09f]
    const rows       = FORMULAS[recipeName] || [];            // [NL-JS-09g]

    let totalG = 0;       // [NL-JS-09h]
    let flourG = 0;       // [NL-JS-09i]
    let waterG = 0;       // [NL-JS-09j]
    let levainTotalG = 0; // [NL-JS-09h1] sum of all levain rows (g)
    let levainFlourG = 0; // [NL-JS-09h2] flour contained in levain (g)

    rows.forEach(row => {                                 // [NL-JS-09k]
      if (!row || !row.ingredient) return;               // [NL-JS-09l]

      const tr    = document.createElement('tr');        // [NL-JS-09m]
      const tdIng = document.createElement('td');        // [NL-JS-09n]
      const tdType= document.createElement('td');        // [NL-JS-09o]
      const tdAmt = document.createElement('td');        // [NL-JS-09p]
      const tdBak = document.createElement('td');        // [NL-JS-09q]

      tdIng.textContent  = row.ingredient;               // [NL-JS-09r]
      tdType.textContent = row.type || "";               // [NL-JS-09s]

      if (row.amount != null){
        const unit = (row.scale || "").trim();           // [NL-JS-09t]
        tdAmt.textContent = unit ? `${row.amount} ${unit}` : String(row.amount); // [NL-JS-09u]
      } else {
        tdAmt.textContent = "";                          // [NL-JS-09v]
      }

      tdAmt.className = "amount";                        // [NL-JS-09w]
      tdBak.className = "bakers";                        // [NL-JS-09x]
      tdBak.textContent = "";                            // [NL-JS-09y]

      tr.appendChild(tdIng);                             // [NL-JS-09z]
      tr.appendChild(tdType);                            // [NL-JS-09aa]
      tr.appendChild(tdAmt);                             // [NL-JS-09ab]
      tr.appendChild(tdBak);                             // [NL-JS-09ac]
      tbody.appendChild(tr);                             // [NL-JS-09ad]

      const grams = toGrams(Number(row.amount), row.scale); // [NL-JS-09ae]
      totalG += grams;                                      // [NL-JS-09af]

      const typeStr   = (row.type || "").trim();
      const typeUpper = typeStr.toUpperCase();

      if (typeUpper === "FLOUR"){
        // Straight flour: all grams are flour            // [NL-JS-09ag]
        flourG += grams;
      } else if (typeUpper === "WATER"){
        // Straight water: all grams are water            // [NL-JS-09ah]
        waterG += grams;
      } else {
        // Treat "100%", "50%", "125%" etc as levain hydration
        const levain = computeLevainParts(grams, typeStr);
        if (levain.flour > 0 || levain.water > 0){
          flourG       += levain.flour;
          waterG       += levain.water;
          levainTotalG += grams;          // track total levain mass
          levainFlourG += levain.flour;   // track levain flour mass
        }
      }
    });

    totalRecipeWeight = totalG;      // [NL-JS-09ai]
    totalRecipeFlour  = flourG;      // [NL-JS-09aj]
    totalRecipeWater  = waterG;      // [NL-JS-09ak]
    totalLevainWeight = levainTotalG; // [NL-JS-09al1]
    totalLevainFlour  = levainFlourG; // [NL-JS-09al2]

    const trs = tbody.querySelectorAll('tr');            // [NL-JS-09al]
    trs.forEach((tr, index) => {                        // [NL-JS-09am]
      const row = rows[index];                           // [NL-JS-09an]
      if (!row) return;                                  // [NL-JS-09ao]
      const tdBak = tr.querySelector('.bakers');         // [NL-JS-09ap]
      if (!tdBak) return;                                // [NL-JS-09aq]
      const grams = toGrams(Number(row.amount), row.scale); // [NL-JS-09ar]
      const pct   = (totalRecipeFlour > 0) ? (grams / totalRecipeFlour) * 100 : 0; // [NL-JS-09as]
      tdBak.textContent = pct ? pct.toFixed(1) : "";     // [NL-JS-09at]
    });

    if (formulaTotalAmount){
      const parts = formatTotalParts(totalRecipeWeight); // [NL-JS-09au]
      formulaTotalAmount.textContent = parts.value
        ? `${parts.value} ${parts.unit}` : "";          // [NL-JS-09av]
    }

    updateStats(); // [NL-JS-09aw]
  }

  // 🧩 [NL-JS-20] Steps Review helpers: use shared STEP_DEFINITIONS + RECIPE_STEP_SEQUENCE
  function getRecipeSteps(recipeName){ // [NL-JS-20a]
    const seq = RECIPE_STEP_SEQUENCE[recipeName] || [];         // ordered list of stepIds
    return seq
      .map(stepId => STEP_DEFINITIONS[stepId])                  // map → full step objects
      .filter(Boolean);                                         // drop any missing ids safely
  }

      function updateStepsPanel(){                                     // [NL-JS-20c]
    const stepsTitleEl = document.getElementById('stepsTitle');
    const stepsDescEl  = document.getElementById('stepsDesc');
    const stepsVideoEl = document.getElementById('stepsVideo');
    const stepsPrevBtn = document.getElementById('stepsPrev');
    const stepsNextBtn = document.getElementById('stepsNext');
    const stepsPosEl   = document.getElementById('stepsPosition');
    const stepsChapterPosEl = document.getElementById('stepsChapterPosition');
    const recipeSelect = document.getElementById('recipeSelect');

    if (!stepsTitleEl && !stepsDescEl && !stepsVideoEl) return;    // [NL-JS-20d]

    const recipeName = recipeSelect ? (recipeSelect.value || "My First Bake") : "My First Bake"; // [NL-JS-20e]
    const steps      = getRecipeSteps(recipeName);                 // [NL-JS-20f]

    // Build per-chapter stats: first index + count of steps in each chapter
    const chapterStats = {};                                       // [NL-JS-20f8]
    steps.forEach((step, index) => {                               // [NL-JS-20f9]
      if (!step || !step.chapterID) return;                        // [NL-JS-20f10]
      const chap = step.chapterID;                                 // [NL-JS-20f11]
      if (!chapterStats[chap]){
        chapterStats[chap] = { firstIndex:index, count:1 };        // [NL-JS-20f12]
      } else {
        chapterStats[chap].count++;                                // [NL-JS-20f13]
      }
    });

    if (!steps.length){
      currentStepIndex = 0;                                        // [NL-JS-20f1]

      if (stepsTitleEl) stepsTitleEl.textContent = "Steps Review"; // [NL-JS-20h]
      if (stepsDescEl){
        stepsDescEl.textContent =
          "Steps video will appear here once defined.";            // [NL-JS-20i]
      }
      if (stepsVideoEl) stepsVideoEl.removeAttribute('src');       // [NL-JS-20j]

      if (stepsPosEl)        stepsPosEl.textContent = "No steps";  // [NL-JS-20f2]
      if (stepsChapterPosEl) stepsChapterPosEl.textContent = "";   // [NL-JS-20f15]
      if (stepsPrevBtn)      stepsPrevBtn.disabled = true;         // [NL-JS-20f3]
      if (stepsNextBtn)      stepsNextBtn.disabled = true;         // [NL-JS-20f4]

      updateBakerProcessUI(steps, chapterStats, currentStepIndex); // [NL-JS-20f14]
      return;
    }

    const lastIndex = steps.length - 1;                            // [NL-JS-20f5]
    if (currentStepIndex < 0) currentStepIndex = 0;                // [NL-JS-20f6]
    if (currentStepIndex > lastIndex) currentStepIndex = lastIndex;// [NL-JS-20f7]

    const step    = steps[currentStepIndex];                       // [NL-JS-20g]
    const videoUrl = buildStepVideoEmbedUrl(STEP_VIDEO_URLS[step.videoKey]); // [NL-JS-20k]

    if (stepsTitleEl){
      step.title
        ? stepsTitleEl.textContent = step.title
        : stepsTitleEl.textContent = "Steps Review";               // [NL-JS-20l]
    }
    if (stepsDescEl){
      stepsDescEl.textContent = step.description || "";            // [NL-JS-20m]
    }
    if (stepsVideoEl){
      if (videoUrl){
        stepsVideoEl.src = videoUrl;                               // [NL-JS-20n]
      } else {
        stepsVideoEl.removeAttribute('src');                       // [NL-JS-20o]
      }
    }

    // Global "Step x of y" line
    if (stepsPosEl){
      stepsPosEl.textContent =
        `Step ${currentStepIndex + 1} of ${steps.length}`;         // [NL-JS-20p]
    }

    // 🆕 Per-chapter "Step a of b in CHAPTER" line
    let activeChapter        = null;                               // [NL-JS-20t]
    let activeStepInChapter  = 0;                                  // [NL-JS-20u]
    let activeChapterTotal   = 0;                                  // [NL-JS-20v]

    if (step && step.chapterID){                                   // [NL-JS-20w]
      activeChapter = step.chapterID;                              // [NL-JS-20x]
      const stats = chapterStats[activeChapter];                   // [NL-JS-20y]
      if (stats){
        activeChapterTotal = stats.count || 0;                     // [NL-JS-20z]
        for (let i = 0; i <= currentStepIndex && i < steps.length; i++){ // [NL-JS-20aa]
          if (steps[i].chapterID === activeChapter){
            activeStepInChapter++;                                 // [NL-JS-20ab]
          }
        }
      }
    }

    if (stepsChapterPosEl){
      if (activeChapter && activeStepInChapter > 0 && activeChapterTotal > 0){
        const label = (CHAPTER_LABELS[activeChapter] || activeChapter).toUpperCase(); // [NL-JS-20ac]
        stepsChapterPosEl.textContent =
          `Step ${activeStepInChapter} of ${activeChapterTotal} in ${label}`;         // [NL-JS-20ad]
      } else {
        stepsChapterPosEl.textContent = "";                                             // [NL-JS-20ae]
      }
    }

    if (stepsPrevBtn){
      stepsPrevBtn.disabled = (currentStepIndex === 0);            // [NL-JS-20q]
    }
    if (stepsNextBtn){
      stepsNextBtn.disabled = (currentStepIndex === lastIndex);    // [NL-JS-20r]
    }

    // Finally, reflect this in the Baker's Process block
    updateBakerProcessUI(steps, chapterStats, currentStepIndex);   // [NL-JS-20s]
  }

    // 🧩 [NL-JS-22] Baker's Process UI: highlight active chapter row + "Step x of y in this Chapter"
  function updateBakerProcessUI(steps, chapterStats, activeIndex){ // [NL-JS-22b]
    const bakerProcessEl = document.getElementById('bakerProcess');
    if (!bakerProcessEl) return;                                   // [NL-JS-22c]

    const rows = bakerProcessEl.querySelectorAll('.baker-row');    // [NL-JS-22d]
    if (!rows.length) return;                                      // [NL-JS-22e]

    const hasSteps = Array.isArray(steps) && steps.length > 0;     // [NL-JS-22f]
    const activeStep =
      hasSteps && activeIndex >= 0 && activeIndex < steps.length
        ? steps[activeIndex]
        : null;                                                    // [NL-JS-22g]

    const activeChapter = activeStep ? activeStep.chapterID : null;// [NL-JS-22h]

    let activeStepNumberInChapter = 0;                             // [NL-JS-22i]
    let activeChapterTotal = 0;                                    // [NL-JS-22j]

    if (activeChapter && chapterStats && chapterStats[activeChapter]){
      activeChapterTotal = chapterStats[activeChapter].count || 0; // [NL-JS-22k]

      // Count how many steps of this chapter are up to & including the active one
      for (let i = 0; i <= activeIndex && i < steps.length; i++){  // [NL-JS-22l]
        if (steps[i].chapterID === activeChapter){
          activeStepNumberInChapter++;                             // [NL-JS-22m]
        }
      }
    }

    rows.forEach(row => {                                          // [NL-JS-22n]
      const chap = row.dataset.chapter;                            // [NL-JS-22o]
      const btn  = row.querySelector('.baker-btn');                // [NL-JS-22p]
      const info = row.querySelector('.baker-step');               // [NL-JS-22q]

      const stats = chap && chapterStats ? chapterStats[chap] : null; // [NL-JS-22r]

      if (btn){
        const isActive = !!(activeChapter && chap === activeChapter && stats); // [NL-JS-22s]
        btn.classList.toggle('active', isActive);                  // [NL-JS-22t]
      }

      if (info){
        if (
          activeChapter &&
          chap === activeChapter &&
          activeStepNumberInChapter > 0 &&
          activeChapterTotal > 0
        ){
          info.textContent =
            `Step ${activeStepNumberInChapter} of ${activeChapterTotal}`; // [NL-JS-22u]
        } else {
          info.textContent = "";                                   // [NL-JS-22v]
        }
      }
    });
  }

  // 🧩 [NL-JS-10] Recipe change handler: reset serving size, update Nutrition + Formula + Steps
  function applyRecipeDefaults(){ // [NL-JS-10a]
    const serveInput = document.getElementById('serveG');
    const recipeSelect = document.getElementById('recipeSelect');
    if (!recipeSelect) return;

    const rec = RECIPES[recipeSelect.value || "My First Bake"]; // [NL-JS-10b]
    if (serveInput && rec) serveInput.value = rec.serveSize;    // [NL-JS-10c]

    // Reset cooled loaf weight so stats recompute at ~85% of new recipe’s total
    cooledBreadWeight = 0;      // [NL-JS-10i]
    cooledBreadLocked = false;  // [NL-JS-10j]
  
    updateFoot(rec);                                            // [NL-JS-10d]
    updateValues();                                             // [NL-JS-10e]
    renderFormula();                                            // [NL-JS-10f]

    currentStepIndex = 0;                                       // [NL-JS-10h] reset to first step
    updateStepsPanel();                                         // [NL-JS-10g]
  }

  // 10A — helper: visually mark the active tab only
  // 🧩 [NL-JS-11] Tab UI helper: set which tab button is “active”
  function setActiveTab(view){ // [NL-JS-11a]
    const viewTabsWrap = document.getElementById('viewTabs');
    if (!viewTabsWrap) return;                                  // [NL-JS-11b]
    const tabs = viewTabsWrap.querySelectorAll('.view-tab');    // [NL-JS-11c]
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === view); // [NL-JS-11d]
    });
  }

  // ✅ 02Jul26 🧩 [SJP-RECIPE-PREVIEW-SCROLLER-01]
  // In a contained public preview, #recipeFactoids itself is the scrollport.  The normal
  // Book uses window.scrollY, so tab navigation and tab-sync must explicitly use this host.
  function getRecipePreviewScrollHost(){
    if (!window.SJ_DRAWER_MODE_ACTIVE || window.SJ_DRAWER_SECTION_ID !== 'recipeFactoids') {
      return null;
    }
    return document.getElementById('recipeFactoids');
  }

  // 10C(2) — Scroll the chosen panel so its top sits just under the header
  // 🧩 [NL-JS-12] Smooth-scroll selected panel so it sits under sticky header
function scrollToView(view){ // [NL-JS-12a]
  const panelId = `panel-${view}`;                            // [NL-JS-12b]
  const target  = document.getElementById(panelId);           // [NL-JS-12c]
  const headerWrap = document.querySelector('.header-wrap');
  if (!target) return;                                       // [NL-JS-12d]

  // Public Timed preview: scroll the contained section, never the hidden document.
  const previewHost = getRecipePreviewScrollHost();
  if (previewHost){
    const hostRect = previewHost.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const sectionTitle = previewHost.querySelector('.content-section-title');
    const titleRect = sectionTitle ? sectionTitle.getBoundingClientRect() : null;
    const headerBand = titleRect ? Math.max(0, titleRect.bottom - hostRect.top) : 0;
    const targetTop = Math.max(
      0,
      previewHost.scrollTop + targetRect.top - hostRect.top - headerBand - 4
    );
    previewHost.scrollTo({ top: targetTop, behavior: 'smooth' });
    return;
  }

  // 🧩 [NL-JS-12e] Figure out the bottom of the sticky header band
  let headerBottom = 0;
  if (headerWrap){
    // Prefer the outer sticky section title if it exists
    const stickyContainer = headerWrap.closest('.content-section-title');
    const refEl = stickyContainer || headerWrap;
    const refRect = refEl.getBoundingClientRect();
    headerBottom = refRect.bottom; // distance from viewport top to bottom of header
  }

  const rect   = target.getBoundingClientRect();             // [NL-JS-12f]
  const offset = window.scrollY + rect.top - headerBottom - 4; // tiny gap // [NL-JS-12g]

  window.scrollTo({
    top: offset,
    behavior: 'smooth'
  });                                                         // [NL-JS-12h]
}


  // 🧩 [NL-JS-13] Ordered list of panels used for scroll-sync logic
  const viewOrder = [ // [NL-JS-13a]
    { id:'panel-nutrition',  view:'nutrition'  }, // [NL-JS-13b]
    { id:'panel-formula',    view:'formula'    }, // [NL-JS-13c]
    { id:'panel-statistics', view:'statistics' }, // [NL-JS-13d]
    { id:'panel-steps',      view:'steps'      }  // [NL-JS-13e]
  ];

  // 🧩 [NL-JS-14] Scroll listener: activates tab when a panel's TOP is in the header-height band
  function syncTabToScroll(){ // [NL-JS-14a]
    // 🚫 Don’t change tabs while a programmatic scroll is in progress
    if (isProgrammaticScroll) return;                // [NL-JS-14b]

    /* Public Recipe Stats preview: the fixed #recipeFactoids section owns scrolling, while
       window.scrollY remains at zero. Mirror the normal tab-sync calculation against that
       real scrollport so manual scrolling updates Nutrition / Formula / Statistics / Steps. */
    const previewHost = getRecipePreviewScrollHost();
    if (previewHost){
      const hostRect = previewHost.getBoundingClientRect();
      const sectionTitle = previewHost.querySelector('.content-section-title');
      const titleRect = sectionTitle ? sectionTitle.getBoundingClientRect() : null;
      const bandTop = titleRect ? titleRect.bottom : hostRect.top;
      const bandBottom = bandTop + (sectionTitle ? sectionTitle.offsetHeight : 0);

      if (previewHost.scrollTop + previewHost.clientHeight >= previewHost.scrollHeight - 2){
        setActiveTab(viewOrder[viewOrder.length - 1].view);
        return;
      }

      for (let i = 0; i < viewOrder.length; i++){
        const entry = viewOrder[i];
        const el = document.getElementById(entry.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top >= bandTop && rect.top <= bandBottom){
          setActiveTab(entry.view);
          return;
        }
      }

      let currentView = viewOrder[0].view;
      const threshold = bandTop + 8;
      for (let i = viewOrder.length - 1; i >= 0; i--){
        const entry = viewOrder[i];
        const el = document.getElementById(entry.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= threshold){
          currentView = entry.view;
          break;
        }
      }
      setActiveTab(currentView);
      return;
    }

    const headerWrap = document.querySelector('.header-wrap');

    // 🧩 [NL-JS-14c] Measure sticky header band (bottom edge of green bar)
    let headerHeight = 0;
    let bandTop = 0;
    let bandBottom = 0;

    if (headerWrap){
      const stickyContainer = headerWrap.closest('.content-section-title');
      const refEl = stickyContainer || headerWrap;
      const rect  = refEl.getBoundingClientRect();

      // Height of the header band (green bar + embedded blue header)
      headerHeight = refEl.offsetHeight || headerWrap.offsetHeight || 0;

      // bandTop = bottom of the sticky header band
      bandTop    = rect.bottom;
      bandBottom = bandTop + headerHeight;
    }

    const scrollY   = window.scrollY || window.pageYOffset;        // [NL-JS-14f]
    const docHeight = document.documentElement.scrollHeight;       // [NL-JS-14g]
    const winHeight = window.innerHeight || document.documentElement.clientHeight; // [NL-JS-14h]

    // If we're basically at the bottom, force the last panel as active.
    if (scrollY + winHeight >= docHeight - 2){       // [NL-JS-14i]
      const last = viewOrder[viewOrder.length - 1];  // [NL-JS-14j]
      setActiveTab(last.view);                       // [NL-JS-14k]
      return;
    }

    let currentView = viewOrder[0].view;             // default: nutrition // [NL-JS-14l]

    // 1️⃣ First, try to find a panel whose TOP sits inside the band
    for (let i = 0; i < viewOrder.length; i++){      // [NL-JS-14m]
      const entry = viewOrder[i];                    // [NL-JS-14n]
      const el    = document.getElementById(entry.id); // [NL-JS-14o]
      if (!el) continue;                             // [NL-JS-14p]

      const rect = el.getBoundingClientRect();       // [NL-JS-14q]

      if (rect.top >= bandTop && rect.top <= bandBottom){
        currentView = entry.view;                    // [NL-JS-14r]
        setActiveTab(currentView);
        return;
      }
    }

    // 2️⃣ Fallback: if no panel top is in the band (e.g., fast scroll),
    //    choose the last panel whose top is above the band.
    const threshold = bandTop + 8;                   // [NL-JS-14s]

    for (let i = viewOrder.length - 1; i >= 0; i--){ // [NL-JS-14t]
      const entry = viewOrder[i];                    // [NL-JS-14u]
      const el    = document.getElementById(entry.id); // [NL-JS-14v]
      if (!el) continue;                             // [NL-JS-14w]

      const rect = el.getBoundingClientRect();       // [NL-JS-14x]

      if (rect.top <= threshold){
        currentView = entry.view;                    // [NL-JS-14y]
        break;
      }
    }

    setActiveTab(currentView);                       // [NL-JS-14z]
  }

  /* 🧩 [NL-JS-18] Scroll spacer auto-height based on header, viewport & Steps card */
  function updateScrollSpacerHeight(){ // [NL-JS-18a]
    const spacer    = document.querySelector('.scroll-spacer'); // [NL-JS-18b]
    const stepsCard = document.getElementById('panel-steps');   // [NL-JS-18c]
    const headerWrap = document.querySelector('.header-wrap');
    if (!headerWrap || !stepsCard || !spacer) return;           // [NL-JS-18d]

    const h = headerWrap.offsetHeight;                          // [NL-JS-18e]
    const s = window.innerHeight || document.documentElement.clientHeight; // [NL-JS-18f]
    const c = stepsCard.offsetHeight;                           // [NL-JS-18g]

    // Your formula: x = s - (h + c), clamped at 0
    const raw    = s - (h + c);                                 // [NL-JS-18h]
    const height = raw > 0 ? raw : 0;                           // [NL-JS-18i]

    spacer.style.height = `${height}px`;                        // [NL-JS-18j]
  }

  /* ===== Event listeners ===== */
  
  // 🧩 [NL-JS-15] Event Delegation
  // Instead of binding listeners to elements directly (which fail if script runs before DOM),
  // we bind to the document and check the target. This ensures handlers work regardless of load timing.
  
  document.addEventListener('input', (e) => {
    if (e.target.id === 'serveG') {
       updateValues();
    }
    if (e.target.id === 'statCooledWeight') {
       handleCooledWeightInput();
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'recipeSelect') {
        applyRecipeDefaults();
    }
    if (e.target.id === 'dvSelect') {
        applyDVFlag();
        updateValues();
    }
  });
  
  // 🧩 Wire print + PNG buttons (Delegated)
  document.addEventListener('click', (e) => {
    // 🧩 [NL-JS-21] Steps navigator: Prev / Next click handlers
    if (e.target.id === 'stepsPrev') {
      const recipeSelect = document.getElementById('recipeSelect');
      const recipeName = recipeSelect ? (recipeSelect.value || "My First Bake") : "My First Bake"; 
      const steps      = getRecipeSteps(recipeName);           
      if (!steps.length) return;                                

      currentStepIndex = Math.max(0, currentStepIndex - 1);     
      updateStepsPanel();                                       
    }
    
    if (e.target.id === 'stepsNext') {
      const recipeSelect = document.getElementById('recipeSelect');
      const recipeName = recipeSelect ? (recipeSelect.value || "My First Bake") : "My First Bake"; 
      const steps      = getRecipeSteps(recipeName);            
      if (!steps.length) return;                                

      currentStepIndex = currentStepIndex + 1;                  
      updateStepsPanel();  
    }
    
    // 🧩 [NL-JS-23] Baker's Process click: jump to first step in that chapter
    const bakerBtn = e.target.closest('.baker-btn');
    if (bakerBtn) {
        const chapter = bakerBtn.dataset.chapter;                        
        if (!chapter) return;                                       

        const recipeSelect = document.getElementById('recipeSelect');
        const recipeName = recipeSelect ? (recipeSelect.value || "My First Bake") : "My First Bake";   
        const steps      = getRecipeSteps(recipeName);              
        if (!steps.length) return;                                  

        // Find the first step whose chapterID matches this button's chapter
        const idx = steps.findIndex(step => step && step.chapterID === chapter); 
        if (idx === -1) return;                                     

        currentStepIndex = idx;                                     
        updateStepsPanel();   
    }

    // 🧩 [NL-JS-16] Tab click handler
    const viewTab = e.target.closest('.view-tab');
    if (viewTab) {
      const view = viewTab.dataset.view;                             

      // ✅ We are now doing a programmatic scroll
      isProgrammaticScroll = true;                               
      setActiveTab(view);   // immediate visual feedback          
      scrollToView(view);   // smooth scroll to the card          

      // When the scroll "should" be done, re-enable scroll-sync
      if (scrollEndTimer) clearTimeout(scrollEndTimer);          
      scrollEndTimer = setTimeout(() => {                        
        isProgrammaticScroll = false;                            
        syncTabToScroll();  // one final sync in case we stopped mid-pixel 
      }, 450); // ~0.45s matches the smooth scroll duration nicely
    }
  });

  // 🧩 [NL-JS-17] Global scroll listener (passive) for normal Book scroll-sync behavior
  window.addEventListener('scroll', syncTabToScroll, { passive:true }); // [NL-JS-17a]

  // Public contained Recipe Stats preview scrolls inside #recipeFactoids rather than window.
  const recipePreviewScrollHost = getRecipePreviewScrollHost();
  if (recipePreviewScrollHost){
    recipePreviewScrollHost.addEventListener('scroll', syncTabToScroll, { passive:true });
  }

  window.addEventListener('resize', () => {                    // [NL-JS-17b]
    updateScrollSpacerHeight();                                // [NL-JS-17c]
    syncTabToScroll();                                         // [NL-JS-17d]
  });

  /* ===== Init ===== */
  // 🧩 [NL-JS-18] Initial boot: apply recipe defaults, DV flag, and initial tab state
  // We use setTimeout here to push execution to the end of the event loop
  // This helps ensuring the DOM is ready if script runs immediately.
  setTimeout(() => {
      applyRecipeDefaults();   // [NL-JS-18k] → includes updateStepsPanel()
      applyDVFlag();           // [NL-JS-18l]
      setActiveTab('nutrition'); // [NL-JS-18m]
      updateScrollSpacerHeight(); // [NL-JS-18n]
      syncTabToScroll();         // [NL-JS-18o]
  }, 50);

})();