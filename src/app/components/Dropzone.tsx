import { useRef } from "react";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;

interface DropzoneProps {
  accept?: string;
  multiple?: boolean;
  hint?: string;
  /** If provided, click defers to this (e.g. to show a picker menu) instead of the file input. */
  onClick?: () => void;
  onFiles?: (files: File[]) => void;
}

/** Dashed dropzone — click to choose files (or open a custom picker menu). */
export function Dropzone({
  accept = ".pdf,.jpg,.jpeg,.png,image/png,image/jpeg,application/pdf",
  multiple = true,
  hint = "Select one or more files under 10MB",
  onClick,
  onFiles,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => (onClick ? onClick() : inputRef.current?.click())}
      className="w-full flex flex-col items-center justify-center gap-4 bg-white border border-dashed border-[rgba(160,160,160,0.45)] rounded-2xl py-12 px-6 transition-colors hover:bg-[#faf9f4]"
    >
      <CloudUploadOutlinedIcon style={{ fontSize: 34, color: "#808080" }} />
      <span className="text-[14px] leading-[1.3] text-[#808080] text-center" style={FONT}>
        {hint}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles?.(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
    </button>
  );
}

export default Dropzone;
