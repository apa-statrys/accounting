import { BottomSheet } from "../../components/BottomSheet";
import { FONT } from "../../lib/theme";
import type { ExistingInvoice } from "../../types";

/** Read-only summary of the existing (duplicate) invoice. */
export function ExistingInvoiceSheet({ open, invoice, onClose }: { open: boolean; invoice?: ExistingInvoice; onClose: () => void }) {
  return (
    <BottomSheet open={open} title="Invoice details" onClose={onClose}>
      {invoice && (
        <div className="flex flex-col">
          {[
            { label: "Invoice Number", value: invoice.number },
            { label: "Customer", value: invoice.customer },
            { label: "Issue Date", value: invoice.issueDate },
            { label: "Due Date", value: invoice.dueDate },
            { label: "Currency", value: invoice.currency },
            { label: "Amount", value: invoice.amount },
            { label: "Status", value: invoice.status },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className={`flex items-center justify-between py-3.5 ${i === arr.length - 1 ? "" : "border-b border-[#f1f1f1]"}`}
            >
              <span className="text-[14px] leading-[1.3] text-[var(--text-secondary)]" style={FONT}>{row.label}</span>
              <span className="text-[14px] font-medium leading-[1.3] text-[var(--text-primary)] text-right" style={FONT}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
