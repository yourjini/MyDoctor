import { PageShell } from "@/components/PageShell";
import { RebuildButton } from "./RebuildButton";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <PageShell title="관리자">
      <section className="space-y-4 rounded-lg border bg-card p-5">
        <div>
          <h2 className="text-base font-semibold">매니페스트 재구성</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            visits / appointments / checkups / health 네 종류의 매니페스트
            (<code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              data/&lt;kind&gt;/_index.json
            </code>
            ) 를 전체 디렉토리를 walk 하여 다시 작성합니다.
          </p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
            <li>처음 매니페스트 도입 후 1회 권장</li>
            <li>외부에서 데이터 레포를 직접 수정한 뒤 (매니페스트가 어긋났을 때)</li>
            <li>매니페스트 파일이 깨졌을 때 (평소엔 자동 self-healing)</li>
          </ul>
        </div>

        <RebuildButton />

        <p className="text-xs text-muted-foreground">
          종류별로 1 GitHub 커밋 발생. 레코드 수에 따라 수초 ~ 수십 초 걸릴 수
          있습니다.
        </p>
      </section>
    </PageShell>
  );
}
