"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isPerson, SUBJECT_COOKIE, type Person } from "./people";

// 상단 PersonSwitcher 에서 사람을 바꿀 때 호출하는 server action.
// 쿠키만 세팅하면 Next.js 의 라우터 캐시가 각 라우트의 "이전 subject"
// 결과를 그대로 보여줘서 탭 전환마다 사람 이름 레이블이 깜빡거림.
// revalidatePath("/", "layout") 로 전체 트리 캐시를 날려야 모든 라우트가
// 새 subject 로 재렌더되고 깜빡임이 사라진다.
export async function setSubjectAction(person: Person): Promise<void> {
  if (!isPerson(person)) return;
  const store = await cookies();
  store.set(SUBJECT_COOKIE, person, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
