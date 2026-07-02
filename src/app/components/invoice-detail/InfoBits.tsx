// Shared presentational bits for the invoice detail page.
import { FONT, INK, MUTED } from "../../lib/theme";

export function MetaRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 ${last ? "" : "border-b border-[rgba(160,160,160,0.18)]"}`}>
      <span className="text-[14px] leading-[1.3]" style={{ ...FONT, color: MUTED }}>{label}</span>
      <span className="text-[14px] font-medium leading-[1.3] text-right" style={{ ...FONT, color: INK }}>{value}</span>
    </div>
  );
}

/** Dashed-border info card (matches the dashboard list cards). */
export function InfoCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {title && (
        <p className="px-1 text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>{title}</p>
      )}
      <div className="bg-[#faf9f4] border border-dashed border-[rgba(160,160,160,0.3)] rounded-xl px-4">
        {children}
      </div>
    </div>
  );
}
