export interface LocalFood {
  keys: string[];
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Diccionario local (claves sin tildes y en minúsculas). Orden = prioridad de coincidencia. */
export const LOCAL_FOOD_DB: LocalFood[] = [
  { keys: ['pechuga', 'pollo a la plancha', 'pollo'], name: 'Pechuga de pollo a la plancha', portion: '1 filete (150g)', calories: 248, protein: 46, carbs: 0, fat: 5.4 },
  { keys: ['arroz blanco', 'arroz'], name: 'Arroz cocido', portion: '1 taza (150g)', calories: 195, protein: 4, carbs: 42, fat: 0.4 },
  { keys: ['ensalada cesar'], name: 'Ensalada César', portion: '1 plato (220g)', calories: 260, protein: 10, carbs: 14, fat: 18 },
  { keys: ['ensalada'], name: 'Ensalada fresca mixta', portion: '1 tazón (150g)', calories: 65, protein: 2, carbs: 9, fat: 2.5 },
  { keys: ['avena'], name: 'Avena cocida en hojuelas', portion: '1 taza (230g)', calories: 165, protein: 6, carbs: 28, fat: 3.5 },
  { keys: ['platano', 'banana', 'banano', 'guineo'], name: 'Plátano maduro', portion: '1 pieza mediana (118g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { keys: ['nueces', 'nuez'], name: 'Nueces troceadas', portion: '1 puñado (25g)', calories: 163, protein: 3.8, carbs: 3.4, fat: 16.2 },
  { keys: ['almendras', 'almendra'], name: 'Almendras naturales', portion: '1 puñado (25g)', calories: 145, protein: 5.3, carbs: 5.4, fat: 12.5 },
  { keys: ['tacos al pastor', 'taco al pastor', 'pastor'], name: 'Taco al pastor con tortilla de maíz', portion: '1 taco (95g)', calories: 175, protein: 11, carbs: 18, fat: 6.5 },
  { keys: ['tacos', 'taco'], name: 'Taco tradicional', portion: '1 unidad (95g)', calories: 170, protein: 10, carbs: 18, fat: 6 },
  { keys: ['agua de jamaica', 'jamaica'], name: 'Agua fresca de jamaica', portion: '1 vaso (300ml)', calories: 75, protein: 0, carbs: 19, fat: 0 },
  { keys: ['limonada'], name: 'Limonada natural', portion: '1 vaso (300ml)', calories: 45, protein: 0.2, carbs: 11, fat: 0 },
  { keys: ['huevos revueltos', 'huevo revuelto', 'huevos', 'huevo'], name: 'Huevo entero', portion: '1 unidad (60g)', calories: 85, protein: 6.5, carbs: 0.7, fat: 6.2 },
  { keys: ['tostada', 'pan integral', 'pan'], name: 'Pan tostado integral', portion: '1 rebanada (35g)', calories: 85, protein: 3.5, carbs: 15, fat: 1.2 },
  { keys: ['aguacate', 'palta'], name: 'Aguacate fresco', portion: '1/2 unidad (70g)', calories: 112, protein: 1.4, carbs: 6, fat: 10.2 },
  { keys: ['cafe con leche'], name: 'Café con leche', portion: '1 taza (220ml)', calories: 68, protein: 3.5, carbs: 5.2, fat: 2.5 },
  { keys: ['cafe americano', 'cafe'], name: 'Café americano sin azúcar', portion: '1 taza (240ml)', calories: 5, protein: 0.3, carbs: 0, fat: 0 },
  { keys: ['salmon'], name: 'Salmón a la plancha', portion: '1 filete (150g)', calories: 310, protein: 31, carbs: 0, fat: 20 },
  { keys: ['pure de papa', 'papa', 'patata'], name: 'Puré de papa', portion: '1 porción (150g)', calories: 145, protein: 3, carbs: 24, fat: 4.2 },
  { keys: ['esparragos'], name: 'Espárragos salteados', portion: '1 taza (130g)', calories: 45, protein: 3, carbs: 5, fat: 1.8 },
  { keys: ['panqueques', 'hot cakes', 'tortitas'], name: 'Panqueques de avena', portion: '1 unidad mediana (65g)', calories: 135, protein: 4.5, carbs: 21, fat: 3.5 },
  { keys: ['fresas', 'frutillas'], name: 'Fresas frescas', portion: '1 taza (140g)', calories: 46, protein: 1, carbs: 11, fat: 0.4 },
  { keys: ['yogurt griego', 'yogur griego', 'yogurt', 'yogur'], name: 'Yogurt griego natural', portion: '1 envase (150g)', calories: 110, protein: 15, carbs: 6, fat: 2.5 },
  { keys: ['miel'], name: 'Miel de abeja', portion: '1 cucharada (15g)', calories: 46, protein: 0, carbs: 12.4, fat: 0 },
  { keys: ['manzana'], name: 'Manzana fresca', portion: '1 pieza mediana (180g)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { keys: ['frijoles', 'habichuelas', 'porotos'], name: 'Frijoles cocidos', portion: '1/2 taza (90g)', calories: 115, protein: 7.5, carbs: 20, fat: 0.5 },
  { keys: ['queso'], name: 'Queso fresco / blanco', portion: '1 rebanada (40g)', calories: 105, protein: 7, carbs: 1.2, fat: 8 },
  { keys: ['pasta', 'espagueti', 'fideos'], name: 'Pasta cocida', portion: '1 plato (180g)', calories: 235, protein: 8.2, carbs: 46, fat: 1.4 },
  { keys: ['jugo de naranja', 'zumo de naranja'], name: 'Jugo de naranja natural', portion: '1 vaso (240ml)', calories: 112, protein: 1.7, carbs: 26, fat: 0.5 },
  { keys: ['atun'], name: 'Atún al natural', portion: '1 lata drenada (120g)', calories: 130, protein: 28, carbs: 0, fat: 1.2 },
];
