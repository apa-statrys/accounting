import { useState } from "react";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { ButtonDock } from "../components/ButtonDock";
import { ListCard } from "../ui/ListCard";
import { ListRow } from "../ui/ListRow";
import { Badge, type BadgeColor } from "../ui/Badge";
import { FilePreviewOverlay, type UploadedFileInfo } from "../components/UploadedFile";
import { FileItemBase } from "../ui/FileItemBase";
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

/** Badge label + color per matched status — same mapping as the Sales Invoice List's own row
 *  status (sales-invoice-list/InvoiceCard's rowStatus). */
const STATUS_BADGE: Record<string, { label: string; color: BadgeColor }> = {
  Draft: { label: "Draft", color: "neutral" },
  Awaiting: { label: "Awaiting Payment", color: "warning" },
  Paid: { label: "Paid", color: "success" },
};

/**
 * Duplicate decision page (DES-716): shown after OCR when an uploaded invoice matches an existing
 * invoice. A decision screen — NOT the editor. Behaviour depends on the match's status:
 *  • DRAFT   → primary "Edit Existing Draft" (open its editor) + secondary "Create New Invoice".
 *  • ISSUED  → primary "View Invoice" (open its detail) + secondary "Create New Invoice"
 *    (Awaiting Payment / Paid — an issued invoice can't be edited from here).
 * Beige page + white ListCard, same shell as every other page (InvoiceSettings, CustomerList,
 * etc.); no page title — the icon/heading/description block below already conveys "duplicate
 * found", so a repeated title in the header would be redundant.
 */
export function DuplicateDecision({ existing, file, onBack, onEditExisting, onViewInvoice, onCreateNew }: DuplicateDecisionProps) {
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isDraft = existing.status === "Draft";
  const statusBadge = STATUS_BADGE[existing.status] ?? STATUS_BADGE.Draft;
  return (
    <div className="relative bg-[var(--bg-beige-primary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <div
        className="flex-1 overflow-y-auto bg-[var(--bg-beige-primary)]"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <PageAppHeader scrolled={scrolled}>
          <PageHeader type="center" onBack={onBack} showSearch={false} />
        </PageAppHeader>

        <div className="px-4 pt-6 pb-44 flex flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--bg-warning-subtle)", border: "1px solid var(--border-warning-subtle)" }}>
              <ErrorOutlineIcon style={{ fontSize: 24, color: "var(--icon-warning-primary)" }} />
            </div>
            <p className="text-[20px] font-bold leading-[1.2] text-[var(--text-primary)]" style={FONT}>Duplicate invoice found</p>
            <p className="text-[14px] leading-[1.4]" style={{ ...FONT, color: "var(--text-secondary)" }}>
              {isDraft
                ? "This upload matches an existing draft invoice. Continue editing the draft or create a new invoice."
                : "This upload matches an existing invoice. Review the existing invoice or continue with a new one if needed."}
            </p>
          </div>

          {/* Duplicate match summary — the key fields only (decision page, not the editor). */}
          <ListCard onLayer="beige">
            <ListRow label="Client" value={existing.customer} />
            <ListRow label="Invoice number" value={existing.number} />
            <ListRow label="Issue date" value={existing.issueDate} />
            <ListRow label="Amount" value={existing.amount} />
            <div className="flex items-center justify-between min-h-[56px] py-3">
              <span className="body-sm text-[var(--text-primary)]">Status</span>
              <Badge label={statusBadge.label} color={statusBadge.color} variant="text" />
            </div>
          </ListCard>

          {/* The uploaded file — tap the row to preview the original. Read-only decision page, so
              no delete/replace action (action="none"). */}
          {file && (
            <FileItemBase
              name={file.name}
              size={`${(file.size / 1024 / 1024).toFixed(1)} MB`}
              fileType={file.name.split(".").pop()?.toLowerCase() ?? "file"}
              state="completed"
              action="none"
              onClick={() => setFilePreviewOpen(true)}
            />
          )}
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
      />

      <FilePreviewOverlay open={filePreviewOpen} file={file ?? null} onClose={() => setFilePreviewOpen(false)} />
    </div>
  );
}

export default DuplicateDecision;
