import { PageShell } from "@/components/PageShell";
import { CautionForm } from "../CautionForm";
import { createCautionAction } from "../actions";

export default async function NewCautionPage() {
  return (
    <PageShell title="새 주의 항목">
      <CautionForm action={createCautionAction} />
    </PageShell>
  );
}
