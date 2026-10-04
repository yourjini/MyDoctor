import { cookies } from "next/headers";
import { isPerson, SUBJECT_COOKIE, type Person } from "./people";

// 전역 인물 컨텍스트 (상단 인물 선택기가 쿠키에 저장). 서버 컴포넌트에서 읽음.
// 값이 없거나 유효하지 않으면 fallback 반환.
// 디폴트는 박란하 — 앱의 1차 관심 대상자. 사용자가 명시적으로 "전체" 또는 다른
// 인물을 선택하면 쿠키에 저장되어 유지됨.
export async function currentSubject(
  fallback: Person = "박란하",
): Promise<Person> {
  const store = await cookies();
  const v = store.get(SUBJECT_COOKIE)?.value;
  return isPerson(v) ? v : fallback;
}
