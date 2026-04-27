import { PageShell } from "@/components/PageShell";
import { CheckupForm } from "./CheckupForm";

export default function NewCheckupPage() {
  return (
    <PageShell title="새 건강검진">
      <CheckupForm />
    </PageShell>
  );
}
