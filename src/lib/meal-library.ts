// Curated meal presets focused on 저탄저지 (low-carb, low-fat) — appropriate
// for an adolescent on bipolar medication, where weight gain is a frequent
// side-effect of mood stabilizers and atypical antipsychotics. Calorie and
// macro figures are estimates per single serving.
//
// Tagging convention (matches MEAL_TAGS in health-tags.ts):
//  - 저탄저지   : low-carb + low-fat balanced plate
//  - 고단백     : ≥25g protein, supports muscle preservation during weight loss
//  - 채소많음   : vegetables / fiber-forward
//  - 빠른       : ≤10 min preparation
//  - 간편       : convenience-store / prepared
//  - 한식       : Korean style
//  - 일식 / 양식 / 분식 : cuisine hints

import type { MealSlot } from "./types";

export type MealLibraryItem = {
  id: string;
  slot: MealSlot;
  name: string;
  description?: string;
  calories: number;
  carbG: number;
  proteinG: number;
  fatG: number;
  tags: string[];
};

export const MEAL_LIBRARY: MealLibraryItem[] = [
  // --- Breakfast (아침) ---
  {
    id: "b-greek-yogurt-nuts",
    slot: "breakfast",
    name: "무가당 그릭요거트 + 베리 + 견과 1줌",
    description: "단백질 + 좋은 지방. 혈당 안정에 도움",
    calories: 280,
    carbG: 18,
    proteinG: 20,
    fatG: 14,
    tags: ["저탄저지", "고단백", "빠른", "간편"],
  },
  {
    id: "b-tofu-scramble",
    slot: "breakfast",
    name: "두부 스크램블 + 시금치 볶음",
    description: "두부 1/2모, 시금치 한 줌, 올리브유 1tsp",
    calories: 260,
    carbG: 8,
    proteinG: 22,
    fatG: 16,
    tags: ["저탄저지", "고단백", "채소많음", "한식"],
  },
  {
    id: "b-egg-toast",
    slot: "breakfast",
    name: "통밀 토스트 + 삶은 달걀 2개 + 아보카도 1/4",
    calories: 380,
    carbG: 28,
    proteinG: 18,
    fatG: 20,
    tags: ["고단백", "빠른"],
  },
  {
    id: "b-chicken-salad",
    slot: "breakfast",
    name: "닭가슴살 샐러드 + 삶은 달걀 1개",
    description: "닭가슴살 80g, 채소믹스, 발사믹 1tbsp",
    calories: 320,
    carbG: 10,
    proteinG: 35,
    fatG: 14,
    tags: ["저탄저지", "고단백", "채소많음"],
  },
  {
    id: "b-oats-protein",
    slot: "breakfast",
    name: "오트밀 + 우유 + 단백질 한 스푼",
    description: "오트 30g, 무지방 우유 200ml, 견과 약간",
    calories: 320,
    carbG: 35,
    proteinG: 22,
    fatG: 9,
    tags: ["고단백", "빠른"],
  },
  {
    id: "b-banana-pb",
    slot: "breakfast",
    name: "바나나 1개 + 무가당 땅콩버터 1tbsp + 우유",
    description: "급할 때. 시간 없을 때만 — 매일은 비추",
    calories: 290,
    carbG: 38,
    proteinG: 12,
    fatG: 11,
    tags: ["빠른"],
  },

  // --- Lunch (점심) ---
  {
    id: "l-chicken-rice-bowl",
    slot: "lunch",
    name: "닭가슴살 도시락 (현미 1/2공기 + 채소)",
    description: "닭가슴살 100g, 현미 90g, 브로콜리·당근",
    calories: 480,
    carbG: 45,
    proteinG: 40,
    fatG: 12,
    tags: ["고단백", "한식"],
  },
  {
    id: "l-salmon-salad",
    slot: "lunch",
    name: "연어 샐러드 (구운 연어 + 채소 + 올리브유)",
    description: "연어 120g, 채소 한 그릇, 올리브유 1tbsp",
    calories: 420,
    carbG: 12,
    proteinG: 35,
    fatG: 24,
    tags: ["저탄저지", "고단백", "채소많음"],
  },
  {
    id: "l-tofu-kimchi-soup",
    slot: "lunch",
    name: "두부김치찌개 + 현미밥 1/2공기",
    description: "두부 1/2모, 김치, 현미 90g",
    calories: 450,
    carbG: 50,
    proteinG: 25,
    fatG: 12,
    tags: ["한식", "고단백"],
  },
  {
    id: "l-bibimbap-light",
    slot: "lunch",
    name: "나물 비빔밥 (현미 1/2공기, 고추장 1tsp, 계란)",
    calories: 470,
    carbG: 55,
    proteinG: 20,
    fatG: 14,
    tags: ["한식", "채소많음"],
  },
  {
    id: "l-cold-noodles-light",
    slot: "lunch",
    name: "메밀 막국수 + 삶은 달걀 1개 + 채소",
    description: "양념장 적게",
    calories: 430,
    carbG: 60,
    proteinG: 18,
    fatG: 9,
    tags: ["한식"],
  },
  {
    id: "l-beef-veggie-wrap",
    slot: "lunch",
    name: "통밀 또띠야 + 소고기 70g + 채소 랩",
    description: "치즈 약간, 마요 빼고",
    calories: 460,
    carbG: 38,
    proteinG: 30,
    fatG: 18,
    tags: ["고단백", "양식"],
  },
  {
    id: "l-tuna-rice-bowl",
    slot: "lunch",
    name: "참치 (라이트) + 현미밥 1/2공기 + 김 + 채소",
    calories: 410,
    carbG: 45,
    proteinG: 28,
    fatG: 9,
    tags: ["고단백", "한식", "빠른"],
  },

  // --- Dinner (저녁) ---
  {
    id: "d-chicken-veg",
    slot: "dinner",
    name: "닭다리살 채소 볶음",
    description: "닭다리살 100g, 양배추·파프리카, 올리브유 1tsp",
    calories: 380,
    carbG: 14,
    proteinG: 32,
    fatG: 22,
    tags: ["저탄저지", "고단백", "채소많음", "한식"],
  },
  {
    id: "d-shabu-shabu",
    slot: "dinner",
    name: "샤브샤브 (소고기 80g + 채소 듬뿍)",
    description: "면 빼고, 양념장 적게",
    calories: 350,
    carbG: 12,
    proteinG: 35,
    fatG: 18,
    tags: ["저탄저지", "고단백", "채소많음", "일식"],
  },
  {
    id: "d-konjac-tteokbokki",
    slot: "dinner",
    name: "곤약면 떡볶이 (양념 적게)",
    description: "곤약면 120g, 어묵 약간, 채소",
    calories: 280,
    carbG: 35,
    proteinG: 12,
    fatG: 7,
    tags: ["저탄저지", "분식"],
  },
  {
    id: "d-grilled-fish",
    slot: "dinner",
    name: "구운 생선(고등어/삼치) + 미역국 + 채소무침",
    description: "밥 없이 또는 현미 1/3공기",
    calories: 400,
    carbG: 20,
    proteinG: 30,
    fatG: 20,
    tags: ["고단백", "한식", "채소많음"],
  },
  {
    id: "d-egg-tofu-soup",
    slot: "dinner",
    name: "계란찜 + 두부 + 미역국",
    description: "가벼운 저녁",
    calories: 320,
    carbG: 10,
    proteinG: 25,
    fatG: 18,
    tags: ["저탄저지", "고단백", "한식"],
  },
  {
    id: "d-chicken-soup",
    slot: "dinner",
    name: "닭곰탕 (다리살 100g, 무·파)",
    description: "면·밥 없이",
    calories: 340,
    carbG: 8,
    proteinG: 35,
    fatG: 18,
    tags: ["저탄저지", "고단백", "한식"],
  },
  {
    id: "d-stirfry-pork",
    slot: "dinner",
    name: "돼지안심 채소 볶음 + 쌈채소",
    calories: 410,
    carbG: 12,
    proteinG: 32,
    fatG: 24,
    tags: ["저탄저지", "고단백", "채소많음", "한식"],
  },

  // --- Snack (간식) ---
  {
    id: "s-eggs-tomato",
    slot: "snack",
    name: "삶은 달걀 2개 + 방울토마토",
    calories: 180,
    carbG: 6,
    proteinG: 14,
    fatG: 11,
    tags: ["저탄저지", "고단백", "빠른"],
  },
  {
    id: "s-greek-yogurt",
    slot: "snack",
    name: "무가당 그릭요거트 + 베리 약간",
    calories: 140,
    carbG: 14,
    proteinG: 14,
    fatG: 3,
    tags: ["고단백", "빠른", "간편"],
  },
  {
    id: "s-nuts",
    slot: "snack",
    name: "견과류 1줌 (아몬드/호두)",
    description: "약 25g, 30개 정도",
    calories: 170,
    carbG: 6,
    proteinG: 6,
    fatG: 15,
    tags: ["빠른", "간편"],
  },
  {
    id: "s-cheese-tomato",
    slot: "snack",
    name: "스트링치즈 1개 + 방울토마토",
    calories: 110,
    carbG: 6,
    proteinG: 8,
    fatG: 6,
    tags: ["저탄저지", "빠른", "간편"],
  },
  {
    id: "s-protein-shake",
    slot: "snack",
    name: "단백질 쉐이크 (우유 또는 두유)",
    calories: 180,
    carbG: 10,
    proteinG: 25,
    fatG: 4,
    tags: ["고단백", "빠른"],
  },
  {
    id: "s-fruit-light",
    slot: "snack",
    name: "사과 1/2개 또는 자몽 1/2개",
    calories: 60,
    carbG: 15,
    proteinG: 1,
    fatG: 0,
    tags: ["빠른"],
  },
  {
    id: "s-cucumber-hummus",
    slot: "snack",
    name: "오이 + 후무스 2tbsp",
    calories: 130,
    carbG: 12,
    proteinG: 5,
    fatG: 7,
    tags: ["채소많음", "양식"],
  },
];

export const MEAL_TAGS: { label: string; tags: string[] }[] = [
  { label: "균형", tags: ["저탄저지", "고단백", "채소많음"] },
  { label: "스타일", tags: ["한식", "일식", "양식", "분식"] },
  { label: "편의", tags: ["빠른", "간편"] },
  { label: "주의", tags: ["탄수↑", "지방↑", "당↑", "튀김", "과식"] },
];

export const ALL_MEAL_TAGS = MEAL_TAGS.flatMap((g) => g.tags);

export function libraryById(id: string): MealLibraryItem | undefined {
  return MEAL_LIBRARY.find((m) => m.id === id);
}

export function libraryBySlot(slot: MealSlot): MealLibraryItem[] {
  return MEAL_LIBRARY.filter((m) => m.slot === slot);
}

// Pick N random items from a slot, weighted toward 저탄저지 + 고단백.
export function suggestMeals(slot: MealSlot, n = 3): MealLibraryItem[] {
  const candidates = libraryBySlot(slot);
  const weighted = candidates.map((m) => {
    let weight = 1;
    if (m.tags.includes("저탄저지")) weight += 2;
    if (m.tags.includes("고단백")) weight += 1;
    if (m.tags.includes("채소많음")) weight += 1;
    return { meal: m, weight };
  });
  const out: MealLibraryItem[] = [];
  const pool = weighted.slice();
  while (out.length < n && pool.length > 0) {
    const totalW = pool.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * totalW;
    let pickedIdx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r <= 0) {
        pickedIdx = i;
        break;
      }
    }
    out.push(pool[pickedIdx].meal);
    pool.splice(pickedIdx, 1);
  }
  return out;
}

export function nextSlot(): MealSlot {
  const h = new Date().getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 17) return "snack";
  if (h < 21) return "dinner";
  return "snack";
}
