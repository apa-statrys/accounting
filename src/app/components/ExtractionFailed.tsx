import DocumentScannerOutlinedIcon from "@mui/icons-material/DocumentScannerOutlined";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { ButtonDock } from "./ButtonDock";
import CloseIcon from "@mui/icons-material/Close";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;
const INK = "#1b1b1b";
const MUTED = "#808080";

interface ExtractionFailedProps {
  /** Skip OCR and fill the invoice in by hand. */
  onManual?: () => void;
  /** Go back to pick a clearer file. */
  onReupload?: () => void;
  /** Close out of the flow. */
  onClose?: () => void;
}

/**
 * OCR returned nothing usable (DES-716, "Nothing extracted" failure handling):
 * show an error and let the client enter details manually or re-upload.
 */
export function ExtractionFailed({ onManual, onReupload, onClose }: ExtractionFailedProps) {
  return (
    <div className="relative bg-white rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <StatusBar />

      <SheetHeader
        title="Upload Invoice"
        type="inside-page"
        state="fixed"
        leading={
          <HeaderIconButton aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </HeaderIconButton>
        }
        trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
        <span className="size-16 rounded-full flex items-center justify-center" style={{ background: "#fff7ed" }}>
          <DocumentScannerOutlinedIcon style={{ fontSize: 30, color: "#b45309" }} />
        </span>
        <div className="flex flex-col gap-2">
          <p className="text-[20px] font-black leading-tight tracking-[-0.5px]" style={{ ...FONT, color: INK }}>
            We couldn’t read this invoice
          </p>
          <p className="text-[14px] leading-[1.5]" style={{ ...FONT, color: MUTED }}>
            The file may be blurry or incomplete.
          </p>
        </div>
      </div>

      <ButtonDock
        type="double"
        overflow
        secondaryLabel="Retry Upload"
        primaryLabel="Enter Manually"
        onSecondary={onReupload}
        onPrimary={onManual}
        homeIndicator
      />
    </div>
  );
}

export default ExtractionFailed;
