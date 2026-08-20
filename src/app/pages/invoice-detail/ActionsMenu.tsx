// The ⋯ actions sheet — which rows show is driven by status flags computed in the page;
// every callback both closes the sheet and performs the action (wired in InvoiceDetailPage).
import { Pencil, Trash2, Receipt, Plus, Send, FileText } from "lucide-react";
import { BottomSheet } from "../../components/BottomSheet";
import { Tile } from "../../ui/Tile";
import { SHOW_CREDIT_NOTES } from "../../lib/flags";
import type { DetailStatus } from "../../types";

interface ActionsMenuProps {
  open: boolean;
  onClose: () => void;
  status: DetailStatus;
  uploaded: boolean;
  /** Preview as PDF row — Paid (with or without a CN) or a refund that's done/already submitted
   *  (nothing left to do on the invoice itself). Always menu-only, never a sticky dock CTA. */
  showPreviewPdf: boolean;
  cancellable: boolean;
  creditNotesCount: number;
  onRefundWithCn: () => void;
  onPreviewPdf: () => void;
  onSendInvoice: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onCreateCn: () => void;
  onDeleteDraft: () => void;
  /** Suppress the "Edit Invoice" row — either an empty draft (its own dock CTA already leads to
   *  Edit, so the ⋯ menu offers only Delete draft) or a logged-but-unapproved payment (Pending
   *  Reconciliation), which locks editing until the accountant approves or reverses it. */
  hideEdit?: boolean;
  /** DES-751 — the invoice's date falls in a closed accounting period. A refund needs a NEW credit
   *  note, which can't be created in a locked period, so "Refund with Credit Note" is hidden
   *  outright here (unlike Edit/Send/Add-credit-note, which stay visible and block via a dialog on
   *  tap) — there's nothing to explain mid-flow since the row never offers the action at all. */
  lockedPeriod?: boolean;
}

export function ActionsMenu({
  open,
  onClose,
  status,
  uploaded,
  showPreviewPdf,
  cancellable,
  creditNotesCount,
  onRefundWithCn,
  onPreviewPdf,
  onSendInvoice,
  onEdit,
  onDuplicate,
  onCreateCn,
  onDeleteDraft,
  hideEdit,
  lockedPeriod = false,
}: ActionsMenuProps) {
  return (
    <BottomSheet open={open} title="" onClose={onClose} hideClose>
      <div className="flex flex-col gap-2 pt-2">
        {/* Plain Paid invoice (no refund yet) → start a refund with a credit note (DES-720). Once a refund
            is in progress, this drops out and the ⋯ shows Duplicate invoice instead. Hidden entirely
            (not shown-then-blocked) in a locked accounting period — see `lockedPeriod` doc above. */}
        {SHOW_CREDIT_NOTES && status === "Paid" && creditNotesCount === 0 && !lockedPeriod && (
          <Tile
            icon={<Receipt size={24} strokeWidth={1.5} />}
            title="Refund with Credit Note"
            onClick={onRefundWithCn}
          />
        )}

        {/* Preview as PDF — menu-only, never a sticky dock CTA (see showPreviewPdf's own doc comment). */}
        {showPreviewPdf && (
          <Tile icon={<FileText size={24} strokeWidth={1.5} />} title="Preview as PDF" onClick={onPreviewPdf} />
        )}

        {/* Uploaded drafts: sending stays optional (record-only default). */}
        {status === "Draft" && uploaded && (
          <Tile icon={<Send size={24} strokeWidth={1.5} />} title="Send invoice" onClick={onSendInvoice} />
        )}

        {/* Edit — full for a draft, limited for an issued still-editable invoice. */}
        {(status === "Draft" || status === "Awaiting" || status === "Overdue") && !hideEdit && (
          <Tile icon={<Pencil size={24} strokeWidth={1.5} />} title="Edit Invoice" onClick={onEdit} />
        )}

        {/* First credit note only — once one exists, adding more moves to the "+ Add credit note"
            button in the Credit notes card (relabelling avoids the misleading "Cancel" wording). */}
        {SHOW_CREDIT_NOTES && cancellable && creditNotesCount === 0 && (
          <Tile
            icon={<Plus size={24} strokeWidth={1.5} color="var(--text-error-primary)" />}
            title={<span style={{ color: "var(--text-error-primary)" }}>Add credit note</span>}
            onClick={onCreateCn}
          />
        )}

        {status === "Draft" && (
          <Tile
            icon={<Trash2 size={24} strokeWidth={1.5} color="var(--text-error-primary)" />}
            title={<span style={{ color: "var(--text-error-primary)" }}>Delete draft</span>}
            onClick={onDeleteDraft}
          />
        )}
      </div>
    </BottomSheet>
  );
}
