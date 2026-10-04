// 저장소 레코드 종류별 캐시 태그. unstable_cache + revalidateTag 로 메모리
// 캐싱 + 쓰기 시 무효화를 조합한다.
//
// 설계:
// - list* 함수는 unstable_cache 로 감쌈. 같은 리퀘스트 내 중복 호출 즉시,
//   서로 다른 리퀘스트 간에도 Vercel 인스턴스 로컬 캐시로 재사용.
// - 쓰기 (createOrUpdateFileContents, deleteFile) 가 발생하면 github.ts 가
//   path 를 보고 해당 태그를 revalidateTag — 다음 조회 때 다시 GitHub API 를 침.
// - revalidate 60초: 혹시 외부에서 데이터 레포가 직접 수정되어도 1분 안에 반영.

export const CACHE_TAGS = {
  visits: "md:visits",
  appointments: "md:appointments",
  checkups: "md:checkups",
  health: "md:health",
  period: "md:period",
  profile: "md:profile",
  meals: "md:meals",
  diary: "md:diary",
  cautions: "md:cautions",
  notes: "md:notes",
  conditions: "md:conditions",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

// github.ts 가 writeFile/deleteFile 후 호출. path 로부터 무효화할 태그를 추정.
// 매치되는 게 없으면 null (예: 매니페스트 추가 전 임시 파일 등).
export function pathToTag(path: string): CacheTag | null {
  if (path.startsWith("data/visits/")) return CACHE_TAGS.visits;
  if (path.startsWith("data/appointments/")) return CACHE_TAGS.appointments;
  if (path.startsWith("data/checkups/")) return CACHE_TAGS.checkups;
  if (path.startsWith("data/health/")) return CACHE_TAGS.health;
  if (path.startsWith("data/period/")) return CACHE_TAGS.period;
  if (path.startsWith("data/profiles/")) return CACHE_TAGS.profile;
  if (path.startsWith("data/meals/")) return CACHE_TAGS.meals;
  if (path.startsWith("data/diary/")) return CACHE_TAGS.diary;
  if (path.startsWith("data/cautions/")) return CACHE_TAGS.cautions;
  if (path.startsWith("data/notes/")) return CACHE_TAGS.notes;
  if (path.startsWith("data/conditions/")) return CACHE_TAGS.conditions;
  return null;
}

// list* 함수에서 쓰는 revalidate 초. 외부 수정 반영을 위한 안전망.
export const CACHE_REVALIDATE_SECONDS = 60;
