export type MaterialType = "plastico" | "papel" | "vidrio" | "aluminio";

export const MATERIALS: Record<
  MaterialType,
  { label: string; emoji: string; pointsPerKg: number; co2PerKg: number; colorClass: string; bgClass: string }
> = {
  plastico: { label: "Plástico", emoji: "🧴", pointsPerKg: 50, co2PerKg: 1.5, colorClass: "text-material-plastic", bgClass: "bg-material-plastic" },
  papel:    { label: "Papel",    emoji: "📄", pointsPerKg: 30, co2PerKg: 1.1, colorClass: "text-material-paper",   bgClass: "bg-material-paper" },
  vidrio:   { label: "Vidrio",   emoji: "🍾", pointsPerKg: 40, co2PerKg: 0.3, colorClass: "text-material-glass",   bgClass: "bg-material-glass" },
  aluminio: { label: "Aluminio", emoji: "🥫", pointsPerKg: 80, co2PerKg: 9.0, colorClass: "text-material-aluminum",bgClass: "bg-material-aluminum" },
};

export type CenterStatus = "abierto" | "alta_demanda" | "lleno" | "mantenimiento" | "cerrado";

export const STATUS_META: Record<CenterStatus, { label: string; bg: string; text: string; dot: string }> = {
  abierto:        { label: "Abierto",          bg: "bg-success/15",     text: "text-success",     dot: "bg-success" },
  alta_demanda:   { label: "Alta demanda",     bg: "bg-accent/20",      text: "text-accent-foreground", dot: "bg-accent" },
  lleno:          { label: "Casi lleno",       bg: "bg-orange-500/15",  text: "text-orange-600",  dot: "bg-orange-500" },
  mantenimiento:  { label: "Mantenimiento",    bg: "bg-muted",          text: "text-muted-foreground", dot: "bg-muted-foreground" },
  cerrado:        { label: "Cerrado",          bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
};

export interface Center {
  id: string;
  name: string;
  district: string;
  address: string;
  distanceKm: number;
  etaMin: number;
  rating: number;
  hours: string;
  materials: MaterialType[];
  lat: number;
  lng: number;
  status: CenterStatus;
  capacity: number; // 0..100
  waitMin: number;
  isMobile?: boolean; // campaña móvil / pop-up
}

export const CENTERS: Center[] = [
  { id: "c1", name: "EcoPunto PUCP",            district: "San Miguel",        address: "Av. Universitaria 1801",   distanceKm: 0.6, etaMin: 8,  rating: 4.8, hours: "Lun–Sáb · 8:00–20:00",   materials: ["plastico","papel","vidrio","aluminio"], lat: -12.07, lng: -77.08, status: "abierto",       capacity: 35, waitMin: 2 },
  { id: "c2", name: "Recicla UNI",              district: "Rímac",             address: "Av. Túpac Amaru 210",      distanceKm: 1.4, etaMin: 14, rating: 4.6, hours: "Lun–Vie · 9:00–18:00",   materials: ["plastico","papel","aluminio"],          lat: -12.02, lng: -77.04, status: "alta_demanda",  capacity: 72, waitMin: 8 },
  { id: "c3", name: "Punto Verde Miraflores",   district: "Miraflores",        address: "Av. Larco 345",            distanceKm: 2.1, etaMin: 18, rating: 4.9, hours: "Todos los días · 7:00–22:00", materials: ["plastico","vidrio","aluminio"],    lat: -12.12, lng: -77.03, status: "lleno",         capacity: 92, waitMin: 15 },
  { id: "c4", name: "EcoStation San Isidro",    district: "San Isidro",        address: "Calle Las Begonias 415",   distanceKm: 3.4, etaMin: 22, rating: 4.7, hours: "Lun–Sáb · 8:00–19:00",   materials: ["papel","vidrio"],                       lat: -12.10, lng: -77.03, status: "mantenimiento", capacity: 0,  waitMin: 0 },
  { id: "c5", name: "Centro Acopio Surco",      district: "Santiago de Surco", address: "Av. Caminos del Inca 2200",distanceKm: 4.7, etaMin: 28, rating: 4.5, hours: "Lun–Dom · 8:00–20:00",   materials: ["plastico","papel","vidrio","aluminio"], lat: -12.13, lng: -76.99, status: "abierto",       capacity: 48, waitMin: 4 },
  { id: "c6", name: "Campaña Móvil ULima",      district: "Santiago de Surco", address: "Campus ULima · Hoy 10–16h",distanceKm: 1.9, etaMin: 16, rating: 4.9, hours: "Solo hoy · 10:00–16:00", materials: ["plastico","aluminio","papel"],          lat: -12.08, lng: -77.05, status: "abierto",       capacity: 25, waitMin: 0, isMobile: true },
];

export interface Reward {
  id: string;
  brand: string;
  title: string;
  cost: number;
  category: "Café" | "Comida" | "Transporte" | "Educación" | "Tecnología";
  emoji: string;
  expires: string;
}

export const REWARDS: Reward[] = [
  { id: "r1", brand: "Starbucks", title: "Café americano gratis", cost: 600, category: "Café", emoji: "☕", expires: "30 días" },
  { id: "r2", brand: "Tambo+", title: "20% off snack saludable", cost: 300, category: "Comida", emoji: "🥪", expires: "15 días" },
  { id: "r3", brand: "Beat", title: "S/ 8 en tu próximo viaje", cost: 800, category: "Transporte", emoji: "🚗", expires: "20 días" },
  { id: "r4", brand: "Crehana", title: "1 mes Premium", cost: 2500, category: "Educación", emoji: "🎓", expires: "60 días" },
  { id: "r5", brand: "La Lucha", title: "Sándwich con 30% off", cost: 750, category: "Comida", emoji: "🥖", expires: "25 días" },
  { id: "r6", brand: "Spotify", title: "1 mes Student", cost: 1800, category: "Tecnología", emoji: "🎧", expires: "45 días" },
];

export interface Activity {
  id: string;
  date: string;
  centerId: string;
  material: MaterialType;
  kg: number;
  points: number;
}

export const ACTIVITY: Activity[] = [
  { id: "a1", date: "Hoy · 10:24", centerId: "c1", material: "plastico", kg: 1.2, points: 60 },
  { id: "a2", date: "Ayer · 17:50", centerId: "c3", material: "aluminio", kg: 0.4, points: 32 },
  { id: "a3", date: "Lun 22",       centerId: "c1", material: "papel",    kg: 2.0, points: 60 },
  { id: "a4", date: "Sáb 20",       centerId: "c5", material: "vidrio",   kg: 1.5, points: 60 },
];

export interface UsedCoupon {
  id: string;
  rewardId: string;
  status: "usado" | "expirado" | "activo";
  date: string;
  code: string;
}

export const COUPONS: UsedCoupon[] = [
  { id: "u1", rewardId: "r1", status: "activo",   date: "Vence en 12 días",   code: "RCP-7H2K" },
  { id: "u2", rewardId: "r2", status: "usado",    date: "Usado el 18 abr",    code: "RCP-9P1A" },
  { id: "u3", rewardId: "r5", status: "expirado", date: "Expirado el 02 abr", code: "RCP-3M4Q" },
];

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "promo" | "reminder" | "achievement" | "alert";
  read: boolean;
}

export const NOTIFICATIONS: AppNotification[] = [
  { id: "n1", title: "¡Nueva recompensa disponible! 🎁",  body: "Crehana Premium ahora por solo 2,500 pts",          time: "Hace 10 min", type: "promo",       read: false },
  { id: "n2", title: "Reciclaste 1.2 kg de plástico ♻️",  body: "Sumaste 60 puntos a tu cuenta",                     time: "Hoy · 10:24", type: "achievement", read: false },
  { id: "n3", title: "Punto Verde Miraflores está lleno",  body: "Te recomendamos EcoPunto PUCP (0.6 km)",            time: "Hace 1 h",     type: "alert",       read: false },
  { id: "n4", title: "Recordatorio semanal",               body: "Tienes 3 botellas guardadas. ¡Llévalas hoy!",       time: "Ayer",         type: "reminder",    read: true },
  { id: "n5", title: "Nivel desbloqueado: Eco Warrior 🌿", body: "Sigue así, faltan 360 pts para Guardián Verde",     time: "Lun 22",       type: "achievement", read: true },
];

export const USER = {
  name: "Camila Rojas",
  username: "@cami.recicla",
  email: "camila.rojas@pucp.edu.pe",
  university: "PUCP",
  career: "Comunicaciones",
  avatar: "CR",
  points: 1840,
  level: "Eco Warrior",
  levelIndex: 3,
  nextLevel: "Guardián Verde",
  nextLevelAt: 2200,
  totalKg: 18.6,
  co2Saved: 24.3,
  streak: 7,
  qrCode: "RECIPE-CR-1840-2026",
  weeklyGoalKg: 5,
  weeklyDoneKg: 3.2,
};

export const LEVELS = ["Semilla", "Brote", "Sembrador", "Eco Warrior", "Guardián Verde", "Leyenda Eco"];

/* ---------- IMPACT ---------- */

// Equivalencias aproximadas a partir del CO2 ahorrado y kilos reciclados
export const IMPACT = {
  co2Kg: USER.co2Saved,            // kg CO2 evitados
  treesSaved: +(USER.co2Saved / 21).toFixed(2),   // 1 árbol ≈ 21 kg CO2/año
  waterLiters: Math.round(USER.totalKg * 18),     // ≈ 18 L por kg reciclado
  energyKwh: +(USER.totalKg * 1.4).toFixed(1),    // ≈ 1.4 kWh por kg
  showerMin: Math.round(USER.totalKg * 18 / 9),   // 9 L/min ducha
  kmCarAvoided: +(USER.co2Saved * 5.7).toFixed(1),// 1 kg CO2 ≈ 5.7 km auto
};

// Serie semanal kg reciclados (lun..dom)
export const WEEKLY_KG = [0.4, 0.8, 0.0, 0.6, 0.5, 0.9, 0.0];
export const WEEK_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

/* ---------- COMMUNITY ---------- */

export interface UniversityRank {
  id: string;
  name: string;
  short: string;
  members: number;
  kg: number;
  color: string;
}

export const UNIVERSITIES: UniversityRank[] = [
  { id: "pucp",  name: "Pontificia Universidad Católica del Perú", short: "PUCP",  members: 2140, kg: 5820, color: "bg-primary" },
  { id: "uni",   name: "Universidad Nacional de Ingeniería",       short: "UNI",   members: 1680, kg: 4710, color: "bg-secondary" },
  { id: "ulima", name: "Universidad de Lima",                      short: "ULima", members: 1320, kg: 3940, color: "bg-accent" },
  { id: "upc",   name: "Universidad Peruana de Ciencias Aplicadas",short: "UPC",   members: 1190, kg: 3210, color: "bg-material-glass" },
  { id: "unmsm", name: "Universidad Nacional Mayor de San Marcos", short: "UNMSM", members: 980,  kg: 2980, color: "bg-material-plastic" },
];

export interface LeaderUser {
  id: string;
  name: string;
  uni: string;
  avatar: string;
  points: number;
  isMe?: boolean;
}

export const WEEKLY_LEADERS: LeaderUser[] = [
  { id: "l1", name: "Mateo Quispe",  uni: "UNI",   avatar: "MQ", points: 820 },
  { id: "l2", name: "Lucía Vargas",  uni: "PUCP",  avatar: "LV", points: 760 },
  { id: "l3", name: "Diego Salas",   uni: "ULima", avatar: "DS", points: 690 },
  { id: "l4", name: "Camila Rojas",  uni: "PUCP",  avatar: "CR", points: 540, isMe: true },
  { id: "l5", name: "Ana Paredes",   uni: "UPC",   avatar: "AP", points: 510 },
  { id: "l6", name: "Joaquín Mora",  uni: "UNMSM", avatar: "JM", points: 460 },
];

export interface Challenge {
  id: string;
  title: string;
  description: string;
  progress: number; // 0..100
  reward: number;
  emoji: string;
  deadline: string;
}

export const CHALLENGES: Challenge[] = [
  { id: "ch1", title: "Semana sin plástico",  description: "Recicla 2 kg de plástico esta semana", progress: 64, reward: 200, emoji: "🧴", deadline: "3 días" },
  { id: "ch2", title: "Madrugador eco",       description: "Recicla 3 veces antes de las 10 am",   progress: 33, reward: 150, emoji: "🌅", deadline: "5 días" },
  { id: "ch3", title: "Reto PUCP vs UNI",     description: "Suma kilos para tu universidad",       progress: 78, reward: 500, emoji: "🏆", deadline: "Domingo" },
];

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  unlocked: boolean;
  description: string;
}

export const BADGES: Badge[] = [
  { id: "b1", name: "Primera entrega",  emoji: "🌱", unlocked: true,  description: "Tu primer reciclaje validado" },
  { id: "b2", name: "Racha 7 días",     emoji: "🔥", unlocked: true,  description: "Una semana reciclando" },
  { id: "b3", name: "Caza-botellas",    emoji: "🧴", unlocked: true,  description: "10 kg de plástico" },
  { id: "b4", name: "Eco-Influencer",   emoji: "📣", unlocked: false, description: "Invita a 5 amigos" },
  { id: "b5", name: "Madrugador",       emoji: "🌅", unlocked: false, description: "5 entregas antes de 10am" },
  { id: "b6", name: "Leyenda PUCP",     emoji: "🏆", unlocked: false, description: "Top 10 de tu universidad" },
];

/* Recommendation: closest open center the user can use */
export const RECOMMENDED_CENTER_ID = "c1";

/* ---------- ECO TITLES (gamified identity) ---------- */
export const ECO_TITLES = [
  { min: 0,    title: "Eco Rookie",          emoji: "🌱", color: "from-emerald-400 to-teal-500" },
  { min: 500,  title: "Green Builder",       emoji: "🌿", color: "from-green-500 to-emerald-600" },
  { min: 1500, title: "Planet Guardian",     emoji: "🛡️", color: "from-teal-500 to-cyan-600" },
  { min: 3000, title: "Sustainability Master", emoji: "🏆", color: "from-amber-400 to-orange-500" },
];

export const getEcoTitle = (points: number) => {
  return [...ECO_TITLES].reverse().find((t) => points >= t.min) ?? ECO_TITLES[0];
};

/* ---------- MARKETPLACE (eco-products & experiences) ---------- */
export interface MarketItem {
  id: string;
  title: string;
  brand: string;
  cost: number;
  emoji: string;
  category: "Producto" | "Cafetería" | "Transporte" | "Experiencia" | "Donación";
  tag?: string;
  description: string;
}

export const MARKETPLACE: MarketItem[] = [
  { id: "m1", title: "Botella reutilizable acero",  brand: "EcoLima",      cost: 1200, emoji: "🥤", category: "Producto",   tag: "Top venta",  description: "Botella 750ml libre de BPA, edición RECIPE" },
  { id: "m2", title: "Kit cubiertos bambú",          brand: "GreenKit",     cost: 800,  emoji: "🥢", category: "Producto",   description: "Cubiertos de bambú con estuche compostable" },
  { id: "m3", title: "Café sostenible 250g",         brand: "Origen Café",  cost: 1500, emoji: "☕", category: "Cafetería",  description: "Café peruano de comercio justo" },
  { id: "m4", title: "Pase mensual scooter eléctrico", brand: "Grin",       cost: 3500, emoji: "🛴", category: "Transporte", tag: "Premium",    description: "Movilidad cero emisiones por 30 días" },
  { id: "m5", title: "Workshop urbano sostenible",   brand: "EcoLima",      cost: 2200, emoji: "🌳", category: "Experiencia",description: "Tour por huertos urbanos de Lima" },
  { id: "m6", title: "Plantar 5 árboles a tu nombre",brand: "AReforestar",  cost: 1800, emoji: "🌲", category: "Donación",   tag: "Impacto",    description: "Reforestación en la Amazonía peruana" },
  { id: "m7", title: "Tote bag algodón orgánico",    brand: "EcoLima",      cost: 600,  emoji: "👜", category: "Producto",   description: "Diseño exclusivo RECIPE x universidades" },
  { id: "m8", title: "Suscripción Ecosia Premium",   brand: "Ecosia",       cost: 2400, emoji: "🌍", category: "Donación",   description: "Buscador que planta árboles · 3 meses" },
];

/* ---------- WALLET (eco-historial) ---------- */
export interface WalletEntry {
  id: string;
  type: "earned" | "spent" | "bonus";
  title: string;
  detail: string;
  points: number;
  date: string;
  emoji: string;
}

export const WALLET: WalletEntry[] = [
  { id: "w1", type: "earned", title: "Reciclaje validado",     detail: "EcoPunto PUCP · 1.2 kg plástico", points: 60,   date: "Hoy · 10:24", emoji: "♻️" },
  { id: "w2", type: "bonus",  title: "Bono racha 7 días",      detail: "Mantén tu streak para más bonos", points: 100,  date: "Hoy · 08:00", emoji: "🔥" },
  { id: "w3", type: "earned", title: "Reto completado",        detail: "Madrugador eco", points: 150,                   date: "Ayer · 09:12",emoji: "🏅" },
  { id: "w4", type: "earned", title: "Reciclaje validado",     detail: "Punto Verde · 0.4 kg aluminio",  points: 32,   date: "Ayer · 17:50",emoji: "♻️" },
  { id: "w5", type: "spent",  title: "Cupón Starbucks",        detail: "Café americano gratis",          points: -600, date: "Lun 22",      emoji: "☕" },
  { id: "w6", type: "earned", title: "Reciclaje validado",     detail: "EcoPunto PUCP · 2 kg papel",     points: 60,   date: "Lun 22",      emoji: "♻️" },
  { id: "w7", type: "bonus",  title: "Invitación amigo",       detail: "Diego se unió a RECIPE",         points: 200,  date: "Dom 21",      emoji: "🤝" },
];

/* ---------- SCAN AI mock results ---------- */
export interface ScanResult {
  id: string;
  itemName: string;
  material: MaterialType;
  recyclable: boolean;
  confidence: number;
  tip: string;
  nearestCenterId: string;
  estimatedPoints: number;
}

export const SCAN_SAMPLES: ScanResult[] = [
  { id: "s1", itemName: "Botella PET 500ml",    material: "plastico", recyclable: true,  confidence: 98, tip: "Aplasta y retira la tapa antes de reciclar",            nearestCenterId: "c1", estimatedPoints: 25 },
  { id: "s2", itemName: "Lata de gaseosa",      material: "aluminio", recyclable: true,  confidence: 96, tip: "Enjuaga ligeramente, el aluminio se recicla infinitas veces", nearestCenterId: "c1", estimatedPoints: 40 },
  { id: "s3", itemName: "Vaso de café (papel)", material: "papel",    recyclable: false, confidence: 87, tip: "Tiene recubrimiento plástico — usa tu taza reutilizable", nearestCenterId: "c1", estimatedPoints: 0 },
  { id: "s4", itemName: "Botella de vino",      material: "vidrio",   recyclable: true,  confidence: 99, tip: "Retira el corcho y la etiqueta si es posible",          nearestCenterId: "c3", estimatedPoints: 30 },
];

/* ---------- MISSIONS (daily/weekly XP system) ---------- */
export interface Mission {
  id: string;
  title: string;
  xp: number;
  done: boolean;
  type: "diaria" | "semanal";
  emoji: string;
}

export const MISSIONS: Mission[] = [
  { id: "ms1", title: "Escanea un residuo con IA",      xp: 20,  done: true,  type: "diaria",  emoji: "📷" },
  { id: "ms2", title: "Visita el mapa",                  xp: 10,  done: true,  type: "diaria",  emoji: "🗺️" },
  { id: "ms3", title: "Recicla al menos 0.5 kg hoy",     xp: 50,  done: false, type: "diaria",  emoji: "♻️" },
  { id: "ms4", title: "Completa 3 entregas esta semana", xp: 150, done: false, type: "semanal", emoji: "🎯" },
  { id: "ms5", title: "Invita a 1 amigo a RECIPE",       xp: 100, done: false, type: "semanal", emoji: "🤝" },
];

/* ---------- IMPACT MILESTONES ---------- */
export const MILESTONES = [
  { id: "ml1", target: 10, label: "10 kg reciclados",     unlocked: true,  emoji: "🌱" },
  { id: "ml2", target: 25, label: "25 kg · 1 árbol/año",  unlocked: false, emoji: "🌳" },
  { id: "ml3", target: 50, label: "50 kg · Eco Master",   unlocked: false, emoji: "🏔️" },
  { id: "ml4", target: 100,label: "100 kg · Leyenda",     unlocked: false, emoji: "🌍" },
];

/* ---------- MONTHLY IMPACT (last 6 months in kg) ---------- */
export const MONTHLY_KG = [1.2, 2.4, 1.8, 3.6, 4.2, 5.4];
export const MONTH_LABELS = ["Nov", "Dic", "Ene", "Feb", "Mar", "Abr"];

/* ---------- SMART NOTIFICATIONS (IA driven) ---------- */
export const SMART_NOTIFICATIONS = [
  { id: "sn1", aiTag: "Reto personalizado", title: "Estás a 2kg de tu próximo badge 🔥", body: "Recicla plástico hoy y desbloquea 'Caza-botellas Pro'", time: "Ahora", emoji: "🎯", priority: "high" as const },
  { id: "sn2", aiTag: "Recomendación",      title: "Mejor momento para reciclar",          body: "EcoPunto PUCP está libre · sin espera estimada", time: "Hace 15 min", emoji: "⚡", priority: "medium" as const },
  { id: "sn3", aiTag: "Celebración",        title: "¡Top 10% de PUCP esta semana! 🎉",   body: "Has reciclado más que el 78% de tu universidad", time: "Hoy · 09:00", emoji: "🏆", priority: "high" as const },
  { id: "sn4", aiTag: "Impacto",            title: "12 kg de CO₂ evitados este mes",      body: "Equivale a 68 km sin manejar un auto", time: "Ayer", emoji: "🌍", priority: "low" as const },
  { id: "sn5", aiTag: "Tu racha",           title: "Mantén tu streak 🔥 7 días",          body: "Recicla algo antes de las 22:00 para no perderla", time: "Hace 2 h", emoji: "🔥", priority: "high" as const },
];
