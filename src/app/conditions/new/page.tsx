import { PageShell } from "@/components/PageShell";
import { ConditionForm } from "../ConditionForm";
import { createConditionAction } from "../actions";

export default function NewConditionPage() {
  return (
    <PageShell title="새 질환">
      <ConditionForm action={createConditionAction} />
    </PageShell>
  );
}
