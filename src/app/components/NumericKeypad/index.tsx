import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";

import styles from "./index.module.css";

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
    <button type="button" aria-label={label} onMouseDown={hold(onTap)} className={styles.key}>
      <span className={styles.keyText}>{children}</span>
    </button>
  );

  return (
    <div className={styles.root}>
      {/* Accessory bar — quick-action chips (e.g. "Full credit") on the left, Done pinned right. */}
      <div className={styles.accessoryBar}>
        {accessory && (
          <div className={`${styles.accessoryScroll} thin-scrollbar`}>
            {accessory}
          </div>
        )}
        <button
          type="button"
          onMouseDown={hold(onDone)}
          className={`${styles.doneBtn} ${accessory ? styles.doneBtnCompact : styles.doneBtnFull}`}
        >
          Done
        </button>
      </div>
      <div className={styles.grid}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
          <Key key={k} onTap={() => onPress(k)}>{k}</Key>
        ))}
        <Key onTap={() => onPress(".")}>.</Key>
        <Key onTap={() => onPress("0")}>0</Key>
        <Key onTap={onBackspace} label="Backspace"><BackspaceOutlinedIcon className={styles.backspaceIcon} /></Key>
      </div>
    </div>
  );
}

export default NumericKeypad;
