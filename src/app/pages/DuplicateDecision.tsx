import { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { PageAppHeader } from "../components/PageAppHeader";
import { SheetHeader, HeaderIconButton } from "../components/SheetHeader";
import { ButtonDock } from "../components/ButtonDock";
import { UploadedFileCard, FilePreviewOverlay, type UploadedFileInfo } from "../components/UploadedFile";
import type { ExistingInvoice } from "../types";

import { FONT } from "../lib/theme";

interface DuplicateDecisionProps {
  /** The matching draft already in the system. */
  existing: ExistingInvoice;
  /** The file the user uploaded — shown here with a Preview button. */
  file?: UploadedFileInfo | null;
  onBack?: () => void;
  /** Primary (DRAFT match) — open the existing draft's editor to keep editing it. */
  onEditExisting?: () => void;
  /** Primary (issued match — Awaiting/Paid) — open the existing invoice's detail page. */
  onViewInvoice?: () => void;
  /** Secondary — create a new draft from the OCR data with a freshly generated number. */
  onCreateNew?: () => void;
}

/** Pill label + palette per matched status (Draft = neutral, Awaiting = brand, Paid = green). */
const STATUS_PILL: Record<string, { label: string; bg: string; border: string; text: string }> = {
  Draft: { label: "Draft", bg: "#faf9f4", border: "rgba(160,160,160,0.4)", text: "#808080" },
  Awaiting: { label: "Awaiting Payment", bg: "#f9f5ea", border: "#ff4a15", text: "#ff4a15" },
  Paid: { label: "Paid", bg: "#ebfcef", border: "#a3e9b6", text: "#006a1d" },
};

function SummaryRow({ label, value, status }: { label: string; value: string; status?: boolean }) {
  const pill = status ? (STATUS_PILL[value] ?? STATUS_PILL.Draft) : null;
  return (
    <div className="flex items-center justify-between py-3 border-b border-[rgba(160,160,160,0.18)] last:border-b-0">
      <span className="text-[14px] leading-[1.3]" style={{ ...FONT, color: "var(--text-secondary)" }}>{label}</span>
      {pill ? (
        <span
          className="px-2 py-0.5 rounded-full border text-[11px] font-bold leading-[16px]"
          style={{ ...FONT, background: pill.bg, borderColor: pill.border, color: pill.text }}
        >
          {pill.label}
        </span>
      ) : (
        <span className="text-[14px] font-medium leading-[1.3] text-right" style={{ ...FONT, color: "var(--text-primary)" }}>{value}</span>
      )}
    </div>
  );
}

/**
 * Duplicate decision page (DES-716): shown after OCR when an uploaded invoice matches an existing
 * invoice. A decision screen — NOT the editor. Behaviour depends on the match's status:
 *  • DRAFT   → primary "Edit Existing Draft" (open its editor) + secondary "Create New Invoice".
 *  • ISSUED  → primary "View Invoice" (open its detail) + secondary "Create New Invoice"
 *    (Awaiting Payment / Paid — an issued invoice can't be edited from here).
 */
export function DuplicateDecision({ existing, file, onBack, onEditExisting, onViewInvoice, onCreateNew }: DuplicateDecisionProps) {
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isDraft = existing.status === "Draft";
  return (
    <div className="relative bg-[var(--bg-beige-primary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <div
        className="flex-1 overflow-y-auto bg-white"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <PageAppHeader scrolled={scrolled}>
          <SheetHeader
            title="Duplicate found"
            type="inside-page"
            state="fixed"
            leading={
              <HeaderIconButton aria-label="Back" onClick={onBack}>
                <ChevronLeftIcon />
              </HeaderIconButton>
            }
            trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
          />
        </PageAppHeader>

        <div className="px-4 pt-6 pb-44 flex flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <div className="w-12 h-12 rounded-full bg-[#fff7ed] border border-[#ffd9a8] flex items-center justify-center">
              <ErrorOutlineIcon style={{ fontSize: 24, color: "#b45309" }} />
            </div>
            <p className="text-[20px] font-bold leading-[1.2] text-[var(--text-primary)]" style={FONT}>Duplicate invoice found</p>
            <p className="text-[14px] leading-[1.4]" style={{ ...FONT, color: "var(--text-secondary)" }}>
              {isDraft
                ? "This upload matches an existing draft invoice. Continue editing the draft or create a new invoice."
                : "This upload matches an existing invoice. Review the existing invoice or continue with a new one if needed."}
            </p>
          </div>

          {/* Duplicate match summary — the key fields only (decision page, not the editor). */}
          <div className="rounded-xl border border-dashed border-[rgba(160,160,160,0.35)] bg-[var(--bg-neutral-secondary)] px-4">
            <SummaryRow label="Client" value={existing.customer} />
            <SummaryRow label="Invoice number" value={existing.number} />
            <SummaryRow label="Issue date" value={existing.issueDate} />
            <SummaryRow label="Amount" value={existing.amount} />
            <SummaryRow label="Status" value={existing.status} status />
          </div>

          {/* The uploaded file, with a button to preview the original. */}
          {file && <UploadedFileCard file={file} onPreview={() => setFilePreviewOpen(true)} />}
        </div>
      </div>

      {/* Decision — primary depends on the match: DRAFT → Edit Existing Draft, ISSUED → View Invoice. */}
      <ButtonDock
        type="double"
        sticky
        primaryLabel={isDraft ? "Edit Existing Draft" : "View Invoice"}
        secondaryLabel="Create New Invoice"
        onPrimary={isDraft ? onEditExisting : onViewInvoice}
        onSecondary={onCreateNew}
        homeIndicator
      />

      <FilePreviewOverlay open={filePreviewOpen} file={file ?? null} onClose={() => setFilePreviewOpen(false)} />
    </div>
  );
}

export default DuplicateDecision;
