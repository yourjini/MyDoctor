"use client";

import { convertVisitToAppointmentAction } from "../../actions";

export function ConvertToAppointmentButton({
  visitId,
  year,
  attachmentCount,
}: {
  visitId: string;
  year: string;
  attachmentCount: number;
}) {
  return (
    <form action={convertVisitToAppointmentAction}>
      <input type="hidden" name="id" value={visitId} />
      <input type="hidden" name="year" value={year} />
      <button
        type="submit"
        onClick={(e) => {
          const msg =
            attachmentCount > 0
              ? `예약으로 전환할까요?\n\n⚠ 첨부파일 ${attachmentCount}개도 함께 삭제됩니다 (예약은 첨부 미지원).`
              : "예약으로 전환할까요?";
          if (!confirm(msg)) e.preventDefault();
        }}
        className="inline-flex min-h-11 items-center rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
      >
        → 예약으로 전환
      </button>
    </form>
  );
}
