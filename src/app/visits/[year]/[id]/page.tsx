import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { HospitalTypeSelect } from "@/components/HospitalTypeSelect";
import { getVisit } from "@/lib/store";
import { deleteVisitAction, updateVisitAction } from "../../actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VisitDetail({
  params,
}: {
  params: Promise<{ year: string; id: string }>;
}) {
  const { year, id } = await params;
  const visit = await getVisit(year, id);
  if (!visit) notFound();

  return (
    <PageShell title="방문 상세" action={<Link href="/visits" className="text-sm text-muted-foreground hover:underline">← 목록</Link>}>
      <form
        action={updateVisitAction}
        className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
      >
        <input type="hidden" name="id" value={visit.id} />
        <input type="hidden" name="year" value={year} />

        <Field label="방문일">
          <input
            type="date"
            name="date"
            defaultValue={visit.date}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="병원 유형">
            <HospitalTypeSelect defaultValue={visit.hospitalType} />
          </Field>
          <Field label="병원명">
            <input
              name="hospitalName"
              defaultValue={visit.hospitalName}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <Field label="의사 이름">
          <input
            name="doctorName"
            defaultValue={visit.doctorName ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="병명 / 진단">
          <input
            name="diagnosis"
            defaultValue={visit.diagnosis}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="상세 내용">
          <textarea
            name="details"
            rows={4}
            defaultValue={visit.details ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="insuranceClaimed"
            defaultChecked={visit.insuranceClaimed}
            className="h-4 w-4"
          />
          실비보험 청구 완료
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            수정 저장
          </button>
        </div>
      </form>

      {visit.attachments.length > 0 && (
        <section className="mt-6 rounded-lg border bg-card p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-medium">첨부파일</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visit.attachments.map((a) => (
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

      <div className="mt-6 flex flex-col items-start justify-between gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <div>
          기록 생성: {formatDate(visit.createdAt, true)}
          {visit.updatedAt !== visit.createdAt && (
            <> · 마지막 수정: {formatDate(visit.updatedAt, true)}</>
          )}
        </div>
        <form action={deleteVisitAction}>
          <input type="hidden" name="id" value={visit.id} />
          <input type="hidden" name="year" value={year} />
          <button
            type="submit"
            className="rounded text-destructive hover:underline"
          >
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
