import { BottomSheet } from "../../components/BottomSheet";
import { ListRow } from "../../ui/ListRow";
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
            <ListRow key={row.label} label={row.label} value={row.value} last={i === arr.length - 1} />
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
