import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { getCheckup } from "@/lib/store";
import { deleteCheckupAction, updateCheckupAction } from "../../actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CheckupDetail({
  params,
}: {
  params: Promise<{ year: string; id: string }>;
}) {
  const { year, id } = await params;
  const c = await getCheckup(year, id);
  if (!c) notFound();

  return (
    <PageShell title="건강검진 상세" action={<Link href="/checkups" className="text-sm text-muted-foreground hover:underline">← 목록</Link>}>
      <form action={updateCheckupAction} className="space-y-4 rounded-lg border bg-card p-5">
        <input type="hidden" name="id" value={c.id} />
        <input type="hidden" name="year" value={year} />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="검진일">
            <input
              type="date"
              name="date"
              defaultValue={c.date}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="제목">
            <input
              name="title"
              defaultValue={c.title}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <Field label="병원/검진센터">
          <input
            name="hospitalName"
            defaultValue={c.hospitalName ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="요약">
          <textarea
            name="summary"
            rows={6}
            defaultValue={c.summary}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="이상 소견 / 주의 항목">
          <textarea
            name="symptoms"
            rows={4}
            defaultValue={c.symptoms ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="의사 소견">
          <textarea
            name="doctorOpinion"
            rows={3}
            defaultValue={c.doctorOpinion ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="추가 메모">
          <textarea
            name="notes"
            rows={3}
            defaultValue={c.notes ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          수정 저장
        </button>
      </form>

      {c.attachments.length > 0 && (
        <section className="mt-6 rounded-lg border bg-card p-5">
          <h3 className="mb-3 text-sm font-medium">원본 파일</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {c.attachments.map((a) => (
              <li key={a.path} className="rounded-md border p-2">
                <a
                  href={`/api/file/${a.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  {a.contentType.startsWith("image/") ? (
                    <img
                      src={`/api/file/${a.path}`}
                      alt={a.filename}
                      className="h-32 w-full rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded bg-muted text-3xl">
                      📄
                    </div>
                  )}
                  <div className="mt-1 truncate text-xs">{a.filename}</div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
        <div>
          기록 생성: {formatDate(c.createdAt, true)}
          {c.updatedAt !== c.createdAt && (
            <> · 마지막 수정: {formatDate(c.updatedAt, true)}</>
          )}
        </div>
        <form action={deleteCheckupAction}>
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="year" value={year} />
          <button type="submit" className="text-destructive hover:underline">
            삭제
          </button>
        </form>
      </div>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
