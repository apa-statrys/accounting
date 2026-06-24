import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { ButtonDock } from "./ButtonDock";

interface SendInvoiceProps {
  onBack?: () => void;
  onSent?: () => void;
}

/**
 * Step 3 of the sales-invoice flow.
 *
 * Scaffolded shell (StatusBar + SheetHeader + ButtonDock). The body is a
 * placeholder review area — replace with the Send Invoice Figma frame.
 */
export function SendInvoice({ onBack, onSent }: SendInvoiceProps) {
  return (
    <div
      className="relative bg-white rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
      style={{ width: 375, height: 812 }}
    >
      <StatusBar />
      <SheetHeader
        title="Send Invoice"
        type="inside-page"
        state="fixed"
        leading={
          <HeaderIconButton aria-label="Back" onClick={onBack}>
            <ChevronLeftIcon />
          </HeaderIconButton>
        }
      />

      {/* TODO: replace with the Send Invoice review/preview Figma design */}
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <p className="text-[14px] text-[#888]" style={{ fontFamily: "GT Walsheim LC, sans-serif" }}>
          Invoice review &amp; send goes here.
        </p>
      </div>

      <ButtonDock type="single" primaryLabel="Send Invoice" onPrimary={onSent} homeIndicator />
    </div>
  );
}

export default SendInvoice;
