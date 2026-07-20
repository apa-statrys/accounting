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

/** Dashed-border info card (Figma 1209). Section cards are WHITE with the title as the first row
 *  inside (grey uppercase + full-width divider); the `hero` tone is the cream status card. */
export function InfoCard({ title, tone = "section", children }: { title?: string; tone?: "section" | "hero"; children: React.ReactNode }) {
  const hero = tone === "hero";
  return (
    <div
      className={`shrink-0 border border-dashed rounded-[12px] px-4 ${hero ? "bg-[var(--bg-neutral-secondary)] border-[rgba(160,160,160,0.5)]" : "bg-white border-[rgba(160,160,160,0.2)]"}`}
      style={{ boxShadow: "0px 4px 14px 0px rgba(226,220,203,0.3)" }}
    >
      {title && (
        <p className="-mx-4 px-4 pt-3.5 pb-3 text-[12px] font-bold uppercase tracking-wide leading-[16.5px] border-b border-[rgba(160,160,160,0.2)]" style={{ ...FONT, color: "var(--text-placeholder)" }}>{title}</p>
      )}
      {children}
    </div>
  );
}
