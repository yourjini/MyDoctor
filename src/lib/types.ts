// Shared data types stored as JSON in the data repo

export type Attachment = {
  filename: string; // original filename
  path: string; // path in the data repo (e.g. visits/2026/<id>/receipt.jpg)
  contentType: string;
  size: number;
};

export type HospitalType =
  | "내과"
  | "외과"
  | "산부인과"
  | "정형외과"
  | "피부과"
  | "안과"
  | "이비인후과"
  | "치과"
  | "정신건강의학과"
  | "비뇨기과"
  | "유방외과"
  | "흉부외과"
  | "한의원"
  | "기타";

export type Visit = {
  id: string;
  kind: "visit";
  date: string; // YYYY-MM-DD
  subject?: string; // 대상자 (가족 구성원). 빈 값/누락은 "전체"로 취급.
  hospitalType: HospitalType | string;
  hospitalName: string;
  doctorName?: string;
  diagnosis: string;
  details?: string;
  insuranceClaimed: boolean; // 실비보험 청구 여부
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
};

export type Appointment = {
  id: string;
  kind: "appointment";
  datetime: string; // ISO datetime
  subject?: string; // 대상자
  hospitalName: string;
  hospitalType?: HospitalType | string;
  doctorName?: string;
  reason?: string;
  precautions?: string; // 주의사항
  createdAt: string;
  updatedAt: string;
};

export type Checkup = {
  id: string;
  kind: "checkup";
  date: string; // YYYY-MM-DD (year extracted for grouping)
  subject?: string; // 대상자
  title: string; // e.g. "2026 종합건강검진"
  hospitalName?: string;
  summary: string; // AI-generated or user-edited summary
  symptoms?: string; // 증상 / 소견
  doctorOpinion?: string; // 의사 소견 (사용자 추가)
  notes?: string; // 추가 메모
  attachments: Attachment[]; // PDFs, images
  createdAt: string;
  updatedAt: string;
};

export type MenstruationFlow = "light" | "normal" | "heavy";

export type HealthLog = {
  id: string;
  kind: "health";
  date: string; // YYYY-MM-DD
  subject?: string; // 대상자
  bodyTags: string[]; // 아픈 위치/증상
  moodTags: string[]; // 기분/심리
  severity?: number; // 1-5 (전체 컨디션, 1=좋음, 5=매우 안좋음)
  menstruation?: MenstruationFlow;
  note?: string;
  // 양극성장애 추적용 (박란하 전용 입력)
  moodScale?: number; // -5(우울) ~ 0(평온) ~ +5(조증)
  sleepHours?: number; // 0~24
  measuredAt?: string; // HH:MM (선택). 일중 변동 추적용
  weight?: number; // kg, 양극성 약 부작용(체중증가) 모니터링
  createdAt: string;
  updatedAt: string;
};

export type MenstrualCycle = {
  id: string;
  kind: "period";
  subject: string; // 박란하 or 최진희 (지금 생리 추적 대상)
  startDate: string; // YYYY-MM-DD
  endDate?: string; // 비어있으면 진행 중
  flow?: MenstruationFlow;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ActivityLevel = "low" | "light" | "moderate" | "active";

export type PersonProfile = {
  person: string; // 박란하 / 박범진 / 최진희 (전체는 프로필 없음)
  birthDate?: string; // YYYY-MM-DD
  heightCm?: number;
  startWeightKg?: number; // 약 시작 전 등 기준 체중
  startWeightDate?: string; // YYYY-MM-DD
  targetWeightKg?: number;
  activity?: ActivityLevel;
  dietStyle?: "lowcarb-lowfat" | "mediterranean" | "balanced";
  allergies?: string[]; // 알레르기·기피
  notes?: string;
  updatedAt: string;
};

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export type MealMacros = {
  carbG?: number;
  proteinG?: number;
  fatG?: number;
};

export type Meal = {
  id: string;
  kind: "meal";
  subject: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  slot: MealSlot;
  menu: string;
  calories?: number;
  macros?: MealMacros;
  tags: string[];
  rating?: number; // 1-5
  note?: string;
  fromLibraryId?: string;
  createdAt: string;
  updatedAt: string;
};

// Food / drink / substance the family should be cautious about,
// usually because it interacts with 박란하's medications.
export type CautionSeverity = "danger" | "warning" | "caution";

export type CautionItem = {
  id: string;
  kind: "caution";
  subject: string; // default 박란하
  name: string; // 맥주, 자몽, 마라탕 etc
  severity: CautionSeverity;
  category?: string; // 술 / 카페인 / 자극적 / 식품 / 약물 / 기타
  medications?: string[]; // 자나팜, 리튬, 콘서타, ...
  reason?: string; // why — multi-line free text
  source?: string; // URL or note
  createdAt: string;
  updatedAt: string;
};

// Notes to bring up at the next clinic visit. Standalone checklist
// — not tied to a specific HealthLog date so questions like "약 줄여
// 달라고 물어보기" can sit alongside symptom observations.
export type ClinicNoteStatus = "pending" | "done";

export type ClinicNote = {
  id: string;
  kind: "note";
  subject: string; // 박란하 / 박범진 / 최진희 / 전체
  hospitalType?: string; // 정신건강의학과 / 내과 / ... (선택)
  title?: string;
  body: string;
  tags?: string[];
  status: ClinicNoteStatus;
  doneAt?: string; // ISO datetime, status=done 일 때
  createdAt: string;
  updatedAt: string;
};

// Private diary — separate password lock above app auth.
// Used for the parent's personal notes about 박란하: condition,
// upsetting events, concerns. Not surfaced anywhere outside /diary.
export type DiaryEntry = {
  id: string;
  kind: "diary";
  date: string; // YYYY-MM-DD
  mood?: number; // -5 ~ +5, the parent's own state when writing
  title?: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type AnyRecord =
  | Visit
  | Appointment
  | Checkup
  | HealthLog
  | MenstrualCycle
  | Meal
  | DiaryEntry
  | CautionItem
  | ClinicNote;
