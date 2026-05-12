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

// 양극성장애 추적용 (박란하 전용으로 폼에서 노출)
export const MANIC_TAG_GROUP = {
  label: "조증 신호",
  tags: [
    "잠 안옴",
    "과활동",
    "말 많아짐",
    "생각 빠름",
    "충동구매",
    "자신감 과잉",
    "분노 폭발",
    "짜증·예민",
  ],
};

export const DEPRESSIVE_TAG_GROUP = {
  label: "우울 신호",
  tags: [
    "잠 많아짐",
    "무기력",
    "외출 거부",
    "흥미 상실",
    "식욕 변화",
    "죄책감·자책",
    "울음",
    "자살 생각",
    "집중력 저하",
  ],
};

export const ATTENDANCE_TAG_GROUP = {
  label: "출결",
  tags: ["결석", "지각", "조퇴"],
};

export const MANIC_TAGS = new Set(MANIC_TAG_GROUP.tags);
export const DEPRESSIVE_TAGS = new Set(DEPRESSIVE_TAG_GROUP.tags);
export const ATTENDANCE_TAGS = new Set(ATTENDANCE_TAG_GROUP.tags);

// 박란하 양극성 박스에서 다루는 모든 신호 태그 (저장은 moodTags 안에 통합)
export const BIPOLAR_SIGNAL_TAGS = new Set<string>([
  ...MANIC_TAG_GROUP.tags,
  ...DEPRESSIVE_TAG_GROUP.tags,
  ...ATTENDANCE_TAG_GROUP.tags,
]);

export const MOOD_SCALE_MARKERS: Record<number, string> = {
  [-5]: "심한 우울",
  [-3]: "우울",
  0: "평온",
  3: "고양",
  5: "심한 조증",
};

export const ALL_BODY_TAGS = BODY_TAG_GROUPS.flatMap((g) => g.tags);
export const ALL_MOOD_TAGS = MOOD_TAG_GROUPS.flatMap((g) => g.tags);
