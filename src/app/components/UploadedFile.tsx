import { FileText, Eye } from "lucide-react";
import { BottomSheet } from "./BottomSheet";

import { FONT } from "../lib/theme";

export interface UploadedFileInfo {
  name: string;
  size: number;
}

/** The uploaded-file chip with a Preview button. Render the overlay separately (at page root). */
export function UploadedFileCard({ file, onPreview }: { file: UploadedFileInfo; onPreview?: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-[#faf9f4] border border-[rgba(160,160,160,0.25)] rounded-xl px-4 py-3">
      <FileText size={20} strokeWidth={1.75} style={{ color: "#808080" }} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-[1.3] text-[#1b1b1b] truncate" style={FONT}>{file.name}</p>
        <p className="text-[12px] leading-[1.3] text-[#808080]" style={FONT}>
          {(file.size / 1024 / 1024).toFixed(1)} MB
        </p>
      </div>
      <button
        type="button"
        onClick={onPreview}
        className="shrink-0 h-8 px-3 rounded-lg border border-[rgba(160,160,160,0.4)] bg-white flex items-center gap-1.5 text-[13px] font-medium text-[#1b1b1b]"
        style={FONT}
      >
        <Eye size={15} strokeWidth={2} />
        Preview
      </button>
    </div>
  );
}

/**
 * Bottom-sheet viewer for the original uploaded file. Render at the PAGE ROOT (not inside a
 * scroll container, which would clip it). Demo: a representative document, no real bytes.
 */
export function FilePreviewOverlay({ open, file, onClose }: { open: boolean; file: UploadedFileInfo | null; onClose?: () => void }) {
  return (
    <BottomSheet open={open} title="Original file" onClose={onClose} heightClass="h-[72%]">
      <div className="flex flex-col items-center gap-3">
        {/* Faux scanned-invoice page standing in for the uploaded document */}
        <div className="w-full bg-white rounded-lg border border-[rgba(160,160,160,0.2)] shadow-[0_8px_24px_rgba(226,220,203,0.5)] p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="h-3.5 w-24 rounded bg-[#1b1b1b]" />
              <div className="h-2 w-20 rounded bg-[#e5e5e5]" />
            </div>
            <div className="h-9 w-9 rounded bg-[#eee]" />
          </div>
          <div className="h-px w-full bg-[#f0f0f0]" />
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-2.5 rounded bg-[#ececec]" style={{ width: `${55 - i * 8}%` }} />
                <div className="h-2.5 w-12 rounded bg-[#ececec]" />
              </div>
            ))}
          </div>
          <div className="h-px w-full bg-[#f0f0f0]" />
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 rounded bg-[#e5e5e5]" />
            <div className="h-3 w-20 rounded bg-[#1b1b1b]" />
          </div>
        </div>
        <p className="text-[12px] leading-[1.4] text-[#808080] text-center" style={FONT}>
          {file?.name} · preview of your uploaded document
        </p>
      </div>
    </BottomSheet>
  );
}
