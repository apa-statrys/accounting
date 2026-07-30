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
  /** Scheduled recurring draft — surfaces "Send invoice" here (its dock leads with Pause series). */
  scheduledRecurring?: boolean;
  terminal: boolean;
  cancellable: boolean;
  creditNotesCount: number;
  onRefundWithCn: () => void;
  onPreviewPdf: () => void;
  onSendInvoice: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onCreateCn: () => void;
  onDeleteDraft: () => void;
}

export function ActionsMenu({
  open,
  onClose,
  status,
  uploaded,
  scheduledRecurring = false,
  terminal,
  cancellable,
  creditNotesCount,
  onRefundWithCn,
  onPreviewPdf,
  onSendInvoice,
  onEdit,
  onDuplicate,
  onCreateCn,
  onDeleteDraft,
}: ActionsMenuProps) {
  return (
    <BottomSheet open={open} title="" onClose={onClose}>
      <div className="flex flex-col gap-2 pt-2">
        {/* Plain Paid invoice (no refund yet) → start a refund with a credit note (DES-720). Once a refund
            is in progress, this drops out and the ⋯ shows Duplicate invoice instead. */}
        {SHOW_CREDIT_NOTES && status === "Paid" && creditNotesCount === 0 && (
          <Tile
            icon={<Receipt size={24} strokeWidth={1.5} color="var(--text-info-primary)" />}
            title={<span style={{ color: "var(--text-info-primary)" }}>Refund with Credit Note</span>}
            onClick={onRefundWithCn}
          />
        )}

        {/* Paid invoice: Preview as PDF also lives here (no dock on a paid invoice). */}
        {status === "Paid" && (
          <Tile icon={<FileText size={24} strokeWidth={1.5} />} title="Preview as PDF" onClick={onPreviewPdf} />
        )}

        {/* Uploaded drafts: sending stays optional (record-only default). */}
        {status === "Draft" && uploaded && (
          <Tile icon={<Send size={24} strokeWidth={1.5} />} title="Send invoice" onClick={onSendInvoice} />
        )}

        {/* Edit — full for a draft, limited for an issued still-editable invoice. Hidden for a scheduled
            recurring draft (it's the dock's secondary CTA there). */}
        {(status === "Draft" || status === "Awaiting" || status === "Overdue") && !scheduledRecurring && (
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
