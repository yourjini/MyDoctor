import { cookies } from "next/headers";
import { isPerson, SUBJECT_COOKIE, type Person } from "./people";

// 전역 인물 컨텍스트 (상단 인물 선택기가 쿠키에 저장). 서버 컴포넌트에서 읽음.
// 값이 없거나 유효하지 않으면 fallback 반환.
export async function currentSubject(fallback: Person = "전체"): Promise<Person> {
  const store = await cookies();
  const v = store.get(SUBJECT_COOKIE)?.value;
  return isPerson(v) ? v : fallback;
}
