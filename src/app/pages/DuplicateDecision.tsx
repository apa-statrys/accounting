import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { ButtonDock } from "../components/ButtonDock";
import { BottomSheet } from "../components/BottomSheet";
import { ListCard } from "../ui/ListCard";
import { ListRow } from "../ui/ListRow";
import { Badge, type BadgeColor } from "../ui/Badge";
import type { UploadedFileInfo } from "../components/UploadedFile";
import { FileItemBase } from "../ui/FileItemBase";
import { fileSizeLabel } from "../lib/format";
import { InvoiceDocumentPreview } from "./shared/InvoicePreviewPage";
import type { ExistingInvoice } from "../types";

import { FONT } from "../lib/theme";

// Figma "Sales Invoice — Client" (node 1959-11709) — hand-drawn warning-triangle illustration.
const warningTriangleIcon = new URL("./duplicate-decision-warning.svg", import.meta.url).href;

interface DuplicateDecisionProps {
  /** The matching draft already in the system. */
  existing: ExistingInvoice;
  /** The file the user uploaded — shown here with a Preview button. */
  file?: UploadedFileInfo | null;
  onBack?: () => void;
  /** Preview sheet's "Re-upload" — re-invokes the native scanner, not just a back navigation. */
  onReupload?: () => void;
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
export function DuplicateDecision({ existing, file, onBack, onReupload, onEditExisting, onViewInvoice, onCreateNew }: DuplicateDecisionProps) {
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isDraft = existing.status === "Draft";
  const statusBadge = STATUS_BADGE[existing.status] ?? STATUS_BADGE.Draft;

  // The match's own total (e.g. "USD 6,450.05") — this decision page only carries the summary
  // fields (no real line items/bank), so the preview shows one line for the total, same fallback
  // pattern as CreditNoteDetailPage's own document preview when it has no real lines either.
  const previewTotal = Number(existing.amount.replace(/[^0-9.]/g, "")) || 0;
  return (
    <div className="relative bg-[var(--bg-neutral-tertiary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <div
        className="flex-1 overflow-y-auto bg-[var(--bg-neutral-tertiary)]"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <PageAppHeader scrolled={scrolled}>
          <PageHeader type="center" onBack={onBack} showSearch={false} />
        </PageAppHeader>

        <div className="px-4 pt-6 pb-44 flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <img src={warningTriangleIcon} alt="" width={52} height={49} />
            <div className="flex flex-col gap-2.5">
              <p className="card-title-lg" style={{ color: "var(--text-primary)" }}>This invoice already exists</p>
              <p className="text-[14px] leading-[1.4]" style={{ ...FONT, color: "var(--text-secondary)" }}>
                We found an existing invoice with the same number below. You can view it, or continue anyway to create a separate new invoice.
              </p>
            </div>
          </div>

          {/* Duplicate match summary — the key fields only (decision page, not the editor). */}
          <ListCard onLayer="gray">
            <ListRow label="Client" value={existing.customer} />
            <ListRow label="Invoice number" value={existing.number} />
            <ListRow label="Issue date" value={existing.issueDate} />
            <ListRow label="Amount" value={existing.amount} />
            <div className="flex items-center justify-between min-h-[56px] py-3">
              <span className="body-sm text-[var(--text-primary)]">Status</span>
              <Badge label={statusBadge.label} color={statusBadge.color} variant="text" />
            </div>
          </ListCard>

          {/* Files — the same FileItemBase-based section as AddInvoiceDetails' own: a single file
              stays full width, a multi-page scan splits into one FileItemBase per page at a
              fixed width in a horizontally scrollable strip so the next one peeks into view.
              Tap a row to preview it; Re-upload (title-right) re-invokes the scanner directly
              (same onReupload as the preview sheet's footer button). */}
          {file && (() => {
            const pageCount = file.pages && file.pages > 1 ? file.pages : 1;
            const fileType = file.name.split(".").pop()?.toLowerCase() ?? "file";
            return (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="body-sm-medium text-[var(--text-primary)]">Files</p>
                  {onReupload && (
                    <button
                      type="button"
                      onClick={onReupload}
                      className="flex items-center gap-1 body-sm-medium"
                      style={{ color: "var(--link-primary)" }}
                    >
                      <RefreshCw size={14} strokeWidth={1.67} />
                      Re-upload
                    </button>
                  )}
                </div>
                <div className={pageCount > 1 ? "flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" : undefined}>
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <div key={i} className={pageCount > 1 ? "shrink-0 w-[220px]" : "w-full"}>
                      <FileItemBase
                        name={pageCount > 1 ? `Page ${i + 1}` : file.name}
                        size={pageCount > 1 ? `${(file.size / pageCount / 1024 / 1024).toFixed(1)} MB` : fileSizeLabel(file)}
                        fileType={fileType}
                        state="completed"
                        action="none"
                        onClick={() => setFilePreviewOpen(true)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Decision — primary opens the match (DRAFT → its editor, ISSUED → its detail page);
          secondary abandons the match and creates a separate new invoice instead. */}
      <ButtonDock
        type="double"
        sticky
        primaryLabel="View Original Invoice"
        secondaryLabel="Continue Anyway"
        onPrimary={isDraft ? onEditExisting : onViewInvoice}
        onSecondary={onCreateNew}
      />

      {/* Preview — the actual invoice document (same InvoiceDocumentPreview the full PDF preview
          and Send sheet use), not a generic faux-scan mockup. Title is the uploaded file's own
          name; "Re-upload" re-invokes the native scanner (onReupload), not just a back navigation. */}
      <BottomSheet
        open={filePreviewOpen}
        title={file?.name ?? "Invoice"}
        onClose={() => setFilePreviewOpen(false)}
        heightClass="h-[72%]"
        footer={<ButtonDock type="single" primaryLabel="Re-upload" onPrimary={onReupload} />}
      >
        <InvoiceDocumentPreview
          invoiceNo={existing.number}
          customerName={existing.customer}
          customerEmail=""
          issueDateLabel={existing.issueDate}
          dueDateLabel={existing.dueDate}
          currency={existing.currency}
          items={[{ name: "Invoice total", qty: 1, unit: "Unit", unitPrice: previewTotal, amount: previewTotal }]}
          subtotal={previewTotal}
          discount={0}
          total={previewTotal}
          bank={{ holder: "Your Company Ltd", bankName: "", number: "", swift: "", currency: existing.currency }}
        />
      </BottomSheet>
    </div>
  );
}

export default DuplicateDecision;
