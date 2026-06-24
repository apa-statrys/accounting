import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LinkIcon from "@mui/icons-material/Link";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { AnimatePresence, motion } from "motion/react";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { Tile } from "./Tile";

const METHODS = [
  { id: "email", label: "Send Email", description: "Editable email with live preview", Icon: MailOutlineIcon },
  { id: "link", label: "Shareable Link", description: "Copy a permanent no-login link", Icon: LinkIcon },
  { id: "pdf", label: "Preview as PDF", description: "Save the invoice as a PDF", Icon: FileDownloadOutlinedIcon },
];

interface SendInvoiceSheetProps {
  open: boolean;
  customerName: string;
  customerEmail: string;
  /** Close (✕, top-left) — the parent decides where it goes (e.g. the invoice list). */
  onClose?: () => void;
  onChangeCustomer?: () => void;
  /** Fired when a delivery method is chosen — sends the invoice. */
  onConfirm?: (method: string) => void;
}

/** Delivery method — a full page (slides in). Pick how to send the invoice. */
export function SendInvoiceSheet({ open, onClose, onConfirm }: SendInvoiceSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-40 bg-[#F9F5EA] rounded-[48px] overflow-hidden flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 340, damping: 34 }}
        >
          <StatusBar />

          <SheetHeader
            title="Delivery method"
            type="inside-page"
            state="fixed"
            leading={
              <HeaderIconButton aria-label="Close" onClick={onClose}>
                <CloseIcon />
              </HeaderIconButton>
            }
            trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
          />

          <div className="flex-1 overflow-y-auto bg-white px-4 pt-5 pb-10">
            <div className="flex flex-col gap-2">
              {METHODS.map((m) => (
                <Tile
                  key={m.id}
                  title={m.label}
                  showIcon
                  icon={<m.Icon />}
                  showDescription={false}
                  onClick={() => onConfirm?.(m.id)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SendInvoiceSheet;
