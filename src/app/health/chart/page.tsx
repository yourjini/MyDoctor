import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { listHealthLogs } from "@/lib/store";
import { HealthChart } from "./HealthChart";

export const dynamic = "force-dynamic";

export default async function HealthChartPage() {
  const logs = await listHealthLogs();
  return (
    <PageShell
      title="데일리리포트 그래프"
      action={
        <Link
          href="/health"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← 목록
        </Link>
      }
    >
      <HealthChart logs={logs} />
    </PageShell>
  );
}
