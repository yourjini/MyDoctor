// 건강일지 태그 프리셋. 사용자가 추가 태그를 자유 입력하면 그 값이 그대로 저장됨.

export const BODY_TAG_GROUPS: { label: string; tags: string[] }[] = [
  { label: "머리/얼굴", tags: ["두통", "어지러움", "눈", "코", "귀", "치아", "입"] },
  { label: "목/가슴", tags: ["목감기", "기침", "인후통", "가슴답답"] },
  { label: "배", tags: ["배아픔", "위", "소화불량", "설사", "변비", "구토"] },
  { label: "허리/등", tags: ["허리", "등", "어깨"] },
  { label: "팔/다리/관절", tags: ["관절", "무릎", "팔", "다리", "근육통", "뼈"] },
  { label: "전신", tags: ["몸살", "오한", "발열", "피로", "수면부족"] },
  { label: "피부", tags: ["피부", "가려움", "두드러기"] },
  { label: "여성", tags: ["생리통", "PMS"] },
];

export const MOOD_TAG_GROUPS: { label: string; tags: string[] }[] = [
  { label: "긍정", tags: ["기분좋음", "평온", "활기참", "감사", "설렘"] },
  { label: "부정", tags: ["우울", "무기력", "슬픔", "외로움"] },
  { label: "스트레스", tags: ["불안", "짜증", "화남", "스트레스", "초조"] },
  { label: "기타", tags: ["집중안됨", "멍함", "졸림"] },
];

export const SEVERITY_LABEL: Record<number, string> = {
  1: "좋음",
  2: "괜찮음",
  3: "보통",
  4: "안좋음",
  5: "매우 안좋음",
};

export const MENSTRUATION_LABEL: Record<string, string> = {
  light: "가벼움",
  normal: "보통",
  heavy: "많음",
};

export const ALL_BODY_TAGS = BODY_TAG_GROUPS.flatMap((g) => g.tags);
export const ALL_MOOD_TAGS = MOOD_TAG_GROUPS.flatMap((g) => g.tags);
