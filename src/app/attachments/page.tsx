import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { HealthDataTabs } from "@/components/HealthDataTabs";
import { SubjectBadge } from "@/components/SubjectBadge";
import { KindChip } from "@/components/KindChip";
import { distinctHospitalsOf, listAllAttachments } from "@/lib/attachments";
import { asPerson, matchesFilter, PEOPLE } from "@/lib/people";
import { currentSubject } from "@/lib/current-subject";

export const dynamic = "force-dynamic";

type SearchParams = {
  subject?: string;
  hospital?: string;
  year?: string;
};

export default async function AttachmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const subject =
    sp.subject != null ? asPerson(sp.subject) : await currentSubject();
  const hospital = (sp.hospital ?? "").trim();
  const year = (sp.year ?? "").trim();

  const everything = await listAllAttachments();
  const hospitals = distinctHospitalsOf(everything);
  const years = Array.from(
    new Set(everything.map((a) => a.date.slice(0, 4))),
  ).sort((a, b) => b.localeCompare(a));

  const filtered = everything.filter((it) => {
    if (!matchesFilter(it.subject, subject)) return false;
    if (hospital && it.hospitalName !== hospital) return false;
    if (year && !it.date.startsWith(year)) return false;
    return true;
  });

  // 월 단위로 묶어 섹션 헤더로 나눔.
  const byMonth = new Map<string, typeof filtered>();
  for (const it of filtered) {
    const ym = it.date.slice(0, 7);
    const arr = byMonth.get(ym) ?? [];
    arr.push(it);
    byMonth.set(ym, arr);
  }
  const months = Array.from(byMonth.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <PageShell title="건강자료">
      <HealthDataTabs />
      <section className="mb-5 space-y-3 rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold">필터</h2>

        <form className="flex flex-wrap items-center gap-2" method="get">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            대상자
            <select
              name="subject"
              defaultValue={subject}
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              {PEOPLE.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            병원
            <select
              name="hospital"
              defaultValue={hospital}
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              <option value="">전체</option>
              {hospitals.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            연도
            <select
              name="year"
              defaultValue={year}
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              <option value="">전체</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="min-h-[36px] rounded-md border bg-background px-3 text-sm hover:bg-accent"
          >
            적용
          </button>
          {(hospital || year || subject !== "전체") && (
            <Link
              href="/attachments"
              className="min-h-[36px] rounded-md px-3 text-sm text-muted-foreground hover:underline"
            >
              초기화
            </Link>
          )}
        </form>

        <div className="text-xs text-muted-foreground">
          총 {filtered.length} 개 · 전체 {everything.length} 개 중
        </div>
      </section>

      {filtered.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          조건에 맞는 첨부파일이 없습니다.
        </p>
      ) : (
        <div className="space-y-6">
          {months.map((ym) => (
            <section key={ym}>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {ym.replace("-", "년 ")}월
              </h3>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {byMonth.get(ym)!.map((it) => (
                  <li key={`${it.recordId}-${it.attachment.path}`}>
                    <AttachmentCardView it={it} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function AttachmentCardView({
  it,
}: {
  it: Awaited<ReturnType<typeof listAllAttachments>>[number];
}) {
  const { attachment: a, date, hospitalName, recordKind, sourceHref } = it;
  const isImage = a.contentType.startsWith("image/");
  const isPdf =
    a.contentType === "application/pdf" || /\.pdf$/i.test(a.filename);
  const isAudio =
    a.contentType.startsWith("audio/") ||
    /\.(mp3|m4a|aac|wav|ogg|oga|webm|3gpp?|amr)$/i.test(a.filename);
  const fileUrl = `/api/file/${a.path}?filename=${encodeURIComponent(a.filename)}`;

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      <Link href={sourceHref} className="block">
        <div className="relative aspect-square bg-muted">
          {isImage ? (
            <img
              src={fileUrl}
              alt={a.filename}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">
              {isPdf ? "📄" : isAudio ? "🎙️" : "📎"}
            </div>
          )}
          <div className="absolute left-1.5 top-1.5">
            <SubjectBadge subject={it.subject} size="sm" />
          </div>
          <div className="absolute right-1.5 top-1.5">
            <KindChip kind={recordKind} size="sm" />
          </div>
        </div>

        <div className="space-y-0.5 p-2.5">
          <div className="truncate text-xs text-muted-foreground">
            {date}
            {hospitalName ? ` · ${hospitalName}` : ""}
          </div>
          <div
            className="truncate text-sm font-medium"
            title={a.filename}
          >
            {a.filename}
          </div>
        </div>
      </Link>
    </div>
  );
}
