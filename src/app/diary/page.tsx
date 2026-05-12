import Link from "next/link";
import { cookies } from "next/headers";
import { PageShell } from "@/components/PageShell";
import { DIARY_COOKIE, verifyDiaryToken } from "@/lib/auth";
import { listDiaryEntries } from "@/lib/store";
import { DiaryLockScreen } from "./DiaryLockScreen";
import { DiaryLogoutButton } from "./DiaryLogoutButton";

export const dynamic = "force-dynamic";

export default async function DiaryPage() {
  const jar = await cookies();
  const unlocked = await verifyDiaryToken(jar.get(DIARY_COOKIE)?.value);

  if (!unlocked) {
    return (
      <PageShell title="다이어리">
        <p className="mb-4 text-sm text-muted-foreground">
          란하의 컨디션·특이사항·속상한 일을 남기는 비공개 공간입니다.
        </p>
        <DiaryLockScreen />
      </PageShell>
    );
  }

  const entries = await listDiaryEntries();

  return (
    <PageShell
      title="다이어리"
      action={
        <div className="flex items-center gap-2">
          <DiaryLogoutButton />
          <Link
            href="/diary/new"
            className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            + 새 글
          </Link>
        </div>
      }
    >
      {entries.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          기록이 없습니다. 우상단 "+ 새 글"로 시작해보세요.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => {
            const year = e.date.slice(0, 4);
            const preview = e.body.length > 160
              ? e.body.slice(0, 160) + "…"
              : e.body;
            return (
              <li key={e.id}>
                <Link
                  href={`/diary/${year}/${e.id}`}
                  className="block rounded-lg border bg-card p-4 hover:bg-accent/30"
                >
                  <div className="mb-1 flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{e.date}</span>
                    {e.mood != null && (
                      <span
                        className={
                          e.mood > 0
                            ? "rounded bg-amber-100 px-1.5 py-0.5 text-amber-800"
                            : e.mood < 0
                              ? "rounded bg-blue-100 px-1.5 py-0.5 text-blue-800"
                              : "rounded bg-muted px-1.5 py-0.5"
                        }
                      >
                        기분 {e.mood > 0 ? `+${e.mood}` : e.mood}
                      </span>
                    )}
                  </div>
                  {e.title && (
                    <h3 className="text-sm font-semibold">{e.title}</h3>
                  )}
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {preview}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
