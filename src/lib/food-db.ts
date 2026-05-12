// 키워드 기반 한국 음식 칼로리 추정 DB. AI 없이 동작하므로 정확도는
// 참고용이고, 수량은 자동 인식하지 않는다 — 사용자가 칼로리를 미세조정
// 가능. portion 필드는 UI 표시용.

export type FoodEntry = {
  keywords: string[]; // 사용자가 적을 만한 표현들
  label: string; // 표시 이름
  portion: string; // 1인분 기준 설명
  calories: number;
  carbG: number;
  proteinG: number;
  fatG: number;
};

export const FOOD_DB: FoodEntry[] = [
  // --- 단백질원 ---
  {
    keywords: ["닭가슴살"],
    label: "닭가슴살",
    portion: "100g",
    calories: 110,
    carbG: 0,
    proteinG: 23,
    fatG: 1,
  },
  {
    keywords: ["닭다리살", "닭다리"],
    label: "닭다리살",
    portion: "100g",
    calories: 160,
    carbG: 0,
    proteinG: 20,
    fatG: 9,
  },
  {
    keywords: ["삼겹살"],
    label: "삼겹살",
    portion: "100g",
    calories: 330,
    carbG: 0,
    proteinG: 17,
    fatG: 28,
  },
  {
    keywords: ["돼지안심", "돼지목살"],
    label: "돼지안심",
    portion: "100g",
    calories: 150,
    carbG: 0,
    proteinG: 22,
    fatG: 7,
  },
  {
    keywords: ["소고기", "쇠고기", "한우"],
    label: "소고기",
    portion: "100g",
    calories: 220,
    carbG: 0,
    proteinG: 22,
    fatG: 14,
  },
  {
    keywords: ["연어"],
    label: "연어",
    portion: "100g",
    calories: 200,
    carbG: 0,
    proteinG: 22,
    fatG: 12,
  },
  {
    keywords: ["고등어"],
    label: "고등어",
    portion: "1토막",
    calories: 220,
    carbG: 0,
    proteinG: 22,
    fatG: 14,
  },
  {
    keywords: ["참치"],
    label: "참치(라이트)",
    portion: "100g",
    calories: 110,
    carbG: 0,
    proteinG: 22,
    fatG: 3,
  },
  {
    keywords: ["달걀", "계란"],
    label: "달걀",
    portion: "1개",
    calories: 75,
    carbG: 0,
    proteinG: 6,
    fatG: 5,
  },
  {
    keywords: ["두부"],
    label: "두부",
    portion: "1/2모(150g)",
    calories: 130,
    carbG: 4,
    proteinG: 13,
    fatG: 7,
  },
  {
    keywords: ["새우"],
    label: "새우",
    portion: "100g",
    calories: 100,
    carbG: 0,
    proteinG: 20,
    fatG: 2,
  },

  // --- 탄수화물원 ---
  {
    keywords: ["현미밥", "현미", "잡곡밥", "잡곡"],
    label: "현미밥",
    portion: "1공기(210g)",
    calories: 310,
    carbG: 65,
    proteinG: 6,
    fatG: 2,
  },
  {
    keywords: ["흰쌀밥", "쌀밥", "공기밥", "백미밥"],
    label: "흰쌀밥",
    portion: "1공기(210g)",
    calories: 310,
    carbG: 68,
    proteinG: 5,
    fatG: 1,
  },
  {
    keywords: ["밥"],
    label: "밥",
    portion: "1공기",
    calories: 300,
    carbG: 65,
    proteinG: 5,
    fatG: 1,
  },
  {
    keywords: ["면", "라면", "국수"],
    label: "면",
    portion: "1인분",
    calories: 380,
    carbG: 60,
    proteinG: 10,
    fatG: 12,
  },
  {
    keywords: ["곤약면", "곤약"],
    label: "곤약면",
    portion: "120g",
    calories: 20,
    carbG: 4,
    proteinG: 0,
    fatG: 0,
  },
  {
    keywords: ["떡볶이"],
    label: "떡볶이",
    portion: "1인분",
    calories: 480,
    carbG: 85,
    proteinG: 9,
    fatG: 9,
  },
  {
    keywords: ["떡"],
    label: "떡",
    portion: "100g",
    calories: 230,
    carbG: 52,
    proteinG: 4,
    fatG: 0,
  },
  {
    keywords: ["오트밀", "귀리"],
    label: "오트밀",
    portion: "30g 건조",
    calories: 110,
    carbG: 20,
    proteinG: 4,
    fatG: 2,
  },
  {
    keywords: ["통밀빵", "통밀토스트"],
    label: "통밀빵",
    portion: "1쪽",
    calories: 90,
    carbG: 16,
    proteinG: 4,
    fatG: 1,
  },
  {
    keywords: ["식빵", "토스트"],
    label: "식빵",
    portion: "1쪽",
    calories: 100,
    carbG: 18,
    proteinG: 3,
    fatG: 1,
  },
  {
    keywords: ["또띠야", "또르띠야", "랩"],
    label: "통밀 또띠야",
    portion: "1장",
    calories: 130,
    carbG: 22,
    proteinG: 4,
    fatG: 3,
  },
  {
    keywords: ["고구마"],
    label: "고구마",
    portion: "중 1개(150g)",
    calories: 130,
    carbG: 30,
    proteinG: 2,
    fatG: 0,
  },
  {
    keywords: ["감자"],
    label: "감자",
    portion: "중 1개(150g)",
    calories: 110,
    carbG: 25,
    proteinG: 3,
    fatG: 0,
  },

  // --- 채소 / 국 ---
  {
    keywords: ["샐러드", "채소믹스"],
    label: "샐러드 채소",
    portion: "1접시",
    calories: 70,
    carbG: 10,
    proteinG: 3,
    fatG: 1,
  },
  {
    keywords: ["김치"],
    label: "김치",
    portion: "1인분(50g)",
    calories: 20,
    carbG: 3,
    proteinG: 1,
    fatG: 0,
  },
  {
    keywords: ["미역국"],
    label: "미역국",
    portion: "1그릇",
    calories: 60,
    carbG: 5,
    proteinG: 4,
    fatG: 2,
  },
  {
    keywords: ["된장국", "된장찌개"],
    label: "된장찌개",
    portion: "1그릇",
    calories: 130,
    carbG: 10,
    proteinG: 9,
    fatG: 7,
  },
  {
    keywords: ["김치찌개"],
    label: "김치찌개",
    portion: "1그릇",
    calories: 200,
    carbG: 10,
    proteinG: 14,
    fatG: 11,
  },
  {
    keywords: ["계란찜"],
    label: "계란찜",
    portion: "1인분",
    calories: 130,
    carbG: 2,
    proteinG: 10,
    fatG: 9,
  },
  {
    keywords: ["나물", "시금치", "콩나물"],
    label: "나물 무침",
    portion: "1접시",
    calories: 60,
    carbG: 6,
    proteinG: 3,
    fatG: 3,
  },
  {
    keywords: ["브로콜리"],
    label: "브로콜리",
    portion: "100g",
    calories: 35,
    carbG: 7,
    proteinG: 3,
    fatG: 0,
  },
  {
    keywords: ["방울토마토", "토마토"],
    label: "방울토마토",
    portion: "10알",
    calories: 30,
    carbG: 6,
    proteinG: 1,
    fatG: 0,
  },
  {
    keywords: ["아보카도"],
    label: "아보카도",
    portion: "1/2개",
    calories: 130,
    carbG: 7,
    proteinG: 2,
    fatG: 12,
  },

  // --- 유제품·간식 ---
  {
    keywords: ["그릭요거트"],
    label: "그릭요거트(무가당)",
    portion: "150g",
    calories: 90,
    carbG: 5,
    proteinG: 14,
    fatG: 2,
  },
  {
    keywords: ["요거트"],
    label: "요거트",
    portion: "100g",
    calories: 80,
    carbG: 12,
    proteinG: 4,
    fatG: 2,
  },
  {
    keywords: ["우유"],
    label: "우유",
    portion: "200ml",
    calories: 130,
    carbG: 10,
    proteinG: 7,
    fatG: 7,
  },
  {
    keywords: ["치즈", "스트링치즈"],
    label: "치즈",
    portion: "1조각(20g)",
    calories: 70,
    carbG: 1,
    proteinG: 5,
    fatG: 5,
  },
  {
    keywords: ["견과", "아몬드", "호두", "땅콩"],
    label: "견과류",
    portion: "1줌(25g)",
    calories: 150,
    carbG: 5,
    proteinG: 5,
    fatG: 13,
  },
  {
    keywords: ["베리", "블루베리", "딸기"],
    label: "베리류",
    portion: "100g",
    calories: 50,
    carbG: 12,
    proteinG: 1,
    fatG: 0,
  },
  {
    keywords: ["바나나"],
    label: "바나나",
    portion: "1개",
    calories: 100,
    carbG: 27,
    proteinG: 1,
    fatG: 0,
  },
  {
    keywords: ["사과"],
    label: "사과",
    portion: "1개",
    calories: 80,
    carbG: 22,
    proteinG: 0,
    fatG: 0,
  },
  {
    keywords: ["과자", "쿠키", "비스킷"],
    label: "과자",
    portion: "1봉",
    calories: 250,
    carbG: 35,
    proteinG: 3,
    fatG: 12,
  },
  {
    keywords: ["초콜릿"],
    label: "초콜릿",
    portion: "1조각(20g)",
    calories: 110,
    carbG: 13,
    proteinG: 2,
    fatG: 6,
  },
  {
    keywords: ["아이스크림"],
    label: "아이스크림",
    portion: "1컵",
    calories: 230,
    carbG: 28,
    proteinG: 4,
    fatG: 12,
  },

  // --- 음료·기름 ---
  {
    keywords: ["아메리카노", "커피"],
    label: "아메리카노",
    portion: "1잔",
    calories: 5,
    carbG: 1,
    proteinG: 0,
    fatG: 0,
  },
  {
    keywords: ["라떼"],
    label: "라떼",
    portion: "1잔",
    calories: 130,
    carbG: 10,
    proteinG: 7,
    fatG: 7,
  },
  {
    keywords: ["콜라", "사이다", "탄산음료"],
    label: "탄산음료",
    portion: "1캔(250ml)",
    calories: 110,
    carbG: 28,
    proteinG: 0,
    fatG: 0,
  },
  {
    keywords: ["올리브유"],
    label: "올리브유",
    portion: "1tsp",
    calories: 40,
    carbG: 0,
    proteinG: 0,
    fatG: 5,
  },
  {
    keywords: ["참기름", "들기름"],
    label: "참기름",
    portion: "1tsp",
    calories: 40,
    carbG: 0,
    proteinG: 0,
    fatG: 5,
  },
  {
    keywords: ["마요네즈"],
    label: "마요네즈",
    portion: "1tbsp",
    calories: 90,
    carbG: 0,
    proteinG: 0,
    fatG: 10,
  },

  // --- 인기/패스트푸드 ---
  {
    keywords: ["김밥"],
    label: "김밥",
    portion: "1줄",
    calories: 350,
    carbG: 50,
    proteinG: 12,
    fatG: 10,
  },
  {
    keywords: ["불고기"],
    label: "불고기",
    portion: "1인분",
    calories: 320,
    carbG: 12,
    proteinG: 28,
    fatG: 17,
  },
  {
    keywords: ["제육볶음", "제육"],
    label: "제육볶음",
    portion: "1인분",
    calories: 450,
    carbG: 18,
    proteinG: 28,
    fatG: 28,
  },
  {
    keywords: ["치킨", "프라이드치킨", "후라이드"],
    label: "프라이드 치킨",
    portion: "조각 3pc",
    calories: 550,
    carbG: 20,
    proteinG: 35,
    fatG: 35,
  },
  {
    keywords: ["햄버거", "버거"],
    label: "햄버거",
    portion: "1개",
    calories: 500,
    carbG: 45,
    proteinG: 25,
    fatG: 25,
  },
  {
    keywords: ["피자"],
    label: "피자",
    portion: "조각 2pc",
    calories: 500,
    carbG: 55,
    proteinG: 22,
    fatG: 22,
  },
  {
    keywords: ["라면(1인분)", "라면"],
    label: "라면",
    portion: "1봉",
    calories: 500,
    carbG: 75,
    proteinG: 11,
    fatG: 17,
  },
];

// 간단 매칭: 메뉴 텍스트에 키워드가 나타나면 1인분으로 카운트.
// 같은 음식이 여러 번 등장하지 않도록 entry 단위로 중복 제거.
// 수량 자동 인식 안 함 — UI에서 사용자가 ±로 조정.
export type FoodMatch = {
  entry: FoodEntry;
  count: number; // 사용자가 조정 가능한 인분 수
};

export function matchFoods(text: string): FoodMatch[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const seen = new Set<FoodEntry>();
  const matches: FoodMatch[] = [];

  // 긴 키워드부터 매칭해서 "현미밥"이 "밥"보다 우선되도록 정렬.
  const orderedEntries = FOOD_DB.slice().sort((a, b) => {
    const aMax = Math.max(...a.keywords.map((k) => k.length));
    const bMax = Math.max(...b.keywords.map((k) => k.length));
    return bMax - aMax;
  });

  let masked = lower;
  for (const entry of orderedEntries) {
    for (const kw of entry.keywords) {
      const k = kw.toLowerCase();
      if (masked.includes(k)) {
        if (!seen.has(entry)) {
          seen.add(entry);
          matches.push({ entry, count: 1 });
        }
        // 매칭된 부분을 공백으로 치환해서 더 짧은 키워드의 중복 매칭 차단
        masked = masked.replace(new RegExp(k, "g"), " ".repeat(k.length));
        break;
      }
    }
  }
  return matches;
}

export function sumMatch(matches: FoodMatch[]): {
  calories: number;
  carbG: number;
  proteinG: number;
  fatG: number;
} {
  return matches.reduce(
    (acc, m) => ({
      calories: acc.calories + m.entry.calories * m.count,
      carbG: acc.carbG + m.entry.carbG * m.count,
      proteinG: acc.proteinG + m.entry.proteinG * m.count,
      fatG: acc.fatG + m.entry.fatG * m.count,
    }),
    { calories: 0, carbG: 0, proteinG: 0, fatG: 0 },
  );
}
