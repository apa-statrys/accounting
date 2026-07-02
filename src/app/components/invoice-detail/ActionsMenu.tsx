// The ⋯ actions sheet — which rows show is driven by status flags computed in the page;
// every callback both closes the sheet and performs the action (wired in InvoiceDetailPage).
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { BottomSheet } from "../BottomSheet";
import { FONT, INK } from "../../lib/theme";
import type { DetailStatus } from "../../types";

interface ActionsMenuProps {
  open: boolean;
  onClose: () => void;
  status: DetailStatus;
  uploaded: boolean;
  terminal: boolean;
  cancellable: boolean;
  creditNotesCount: number;
  onRefundWithCn: () => void;
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
  terminal,
  cancellable,
  creditNotesCount,
  onRefundWithCn,
  onSendInvoice,
  onEdit,
  onDuplicate,
  onCreateCn,
  onDeleteDraft,
}: ActionsMenuProps) {
  return (
    <BottomSheet open={open} title="Invoice actions" onClose={onClose}>
      <div className="flex flex-col">
        {/* Plain Paid invoice (no refund yet) → start a refund with a credit note (DES-720). Once a refund
            is in progress, this drops out and the ⋯ shows Duplicate invoice instead. */}
        {status === "Paid" && creditNotesCount === 0 && (
          <button
            onClick={onRefundWithCn}
            className="w-full flex items-center gap-3 py-3.5 text-left"
          >
            <ReceiptLongOutlinedIcon style={{ fontSize: 20, color: "#b42318" }} />
            <span className="text-[15px]" style={{ ...FONT, color: "#b42318" }}>Refund with Credit Note</span>
          </button>
        )}

        {/* Uploaded drafts: sending stays optional (default is record-only) */}
        {status === "Draft" && uploaded && (
          <button
            onClick={onSendInvoice}
            className="w-full flex items-center gap-3 py-3.5 text-left border-b border-[#f1f1f1]"
          >
            <SendOutlinedIcon style={{ fontSize: 20, color: INK }} />
            <span className="text-[15px]" style={{ ...FONT, color: INK }}>Send invoice</span>
          </button>
        )}

        {/* Edit — full for a draft, limited for an issued still-editable invoice */}
        {(status === "Draft" || status === "Awaiting" || status === "Overdue") && (
          <button
            onClick={onEdit}
            className="w-full flex items-center gap-3 py-3.5 text-left border-b border-[#f1f1f1]"
          >
            <EditOutlinedIcon style={{ fontSize: 20, color: INK }} />
            <span className="text-[15px]" style={{ ...FONT, color: INK }}>Edit invoice</span>
          </button>
        )}

        {(!terminal || status === "Paid") && (
          <button
            onClick={onDuplicate}
            className="w-full flex items-center gap-3 py-3.5 text-left border-b border-[#f1f1f1]"
          >
            <ContentCopyIcon style={{ fontSize: 20, color: INK }} />
            <span className="text-[15px]" style={{ ...FONT, color: INK }}>Duplicate invoice</span>
          </button>
        )}

        {/* First credit note only — once one exists, adding more moves to the "+ Add credit note"
            button in the Credit notes card (relabelling avoids the misleading "Cancel" wording). */}
        {cancellable && creditNotesCount === 0 && (
          <button
            onClick={onCreateCn}
            className="w-full flex items-center gap-3 py-3.5 text-left border-b border-[#f1f1f1]"
          >
            <ReceiptLongOutlinedIcon style={{ fontSize: 20, color: "#b42318" }} />
            <span className="text-[15px]" style={{ ...FONT, color: "#b42318" }}>Create Credit Note</span>
          </button>
        )}

        {status === "Draft" && (
          <button
            onClick={onDeleteDraft}
            className="w-full flex items-center gap-3 py-3.5 text-left"
          >
            <DeleteOutlineIcon style={{ fontSize: 20, color: "#b42318" }} />
            <span className="text-[15px]" style={{ ...FONT, color: "#b42318" }}>Delete draft</span>
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
