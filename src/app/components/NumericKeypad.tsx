import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";

import { FONT } from "../lib/theme";

interface NumericKeypadProps {
  /** A digit "0"–"9" or "." was pressed. */
  onPress: (key: string) => void;
  onBackspace: () => void;
  onDone: () => void;
  /** Optional quick-action chips shown in a bar above the Done button (e.g. "Full credit"). */
  accessory?: React.ReactNode;
}

/**
 * Custom on-screen numeric keypad (DES-720) — a demoable stand-in for the OS keyboard, which a
 * desktop web view never shows. In the native build this is replaced by the platform numeric keyboard
 * (+ iOS Done accessory); here it slides up over the phone frame while an amount input is focused.
 * Keys use onMouseDown + preventDefault so the focused input keeps focus (no blur on tap).
 */
export function NumericKeypad({ onPress, onBackspace, onDone, accessory }: NumericKeypadProps) {
  const hold = (fn: () => void) => (e: React.MouseEvent) => { e.preventDefault(); fn(); };

  const Key = ({ children, onTap, label }: { children: React.ReactNode; onTap: () => void; label?: string }) => (
    <button
      type="button"
      aria-label={label}
      onMouseDown={hold(onTap)}
      className="h-[52px] rounded-lg bg-white shadow-sm active:bg-[#e9e9ee] flex items-center justify-center"
    >
      <span className="text-[22px] leading-none text-[#1b1b1b]" style={FONT}>{children}</span>
    </button>
  );

  return (
    <div className="absolute inset-x-0 bottom-0 z-[60] bg-[#d1d4db] px-1.5 pt-2 pb-3 select-none">
      {/* Accessory bar — quick-action chips (e.g. "Full credit") on the left, Done pinned right. */}
      <div className="px-1 pb-2 flex items-center gap-2">
        {accessory && (
          <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto thin-scrollbar">
            {accessory}
          </div>
        )}
        <button
          type="button"
          onMouseDown={hold(onDone)}
          className={`${accessory ? "shrink-0 px-6" : "w-full"} h-11 rounded-xl text-white text-[16px] font-semibold`}
          style={{ ...FONT, background: "#FF4A15" }}
        >
          Done
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-1">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
          <Key key={k} onTap={() => onPress(k)}>{k}</Key>
        ))}
        <Key onTap={() => onPress(".")}>.</Key>
        <Key onTap={() => onPress("0")}>0</Key>
        <Key onTap={onBackspace} label="Backspace"><BackspaceOutlinedIcon style={{ fontSize: 22, color: "#1b1b1b" }} /></Key>
      </div>
    </div>
  );
}

export default NumericKeypad;
