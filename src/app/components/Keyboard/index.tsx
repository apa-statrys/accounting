import { ArrowBigUp, Delete, Mic, Smile } from "lucide-react";
import styles from "./index.module.css";

const ROW_1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
const ROW_2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
const ROW_3 = ["Z", "X", "C", "V", "B", "N", "M"];

/**
 * Decorative on-screen QWERTY keyboard (Figma "Keyboard" node 659-3124) — a demoable stand-in
 * for the OS keyboard, which a desktop web view never shows. Purely visual chrome: the real
 * text input underneath still takes physical/browser keyboard input, this just fills the space
 * below it so a focused search field reads like it would on-device (same idea as NumericKeypad,
 * but decorative-only since a QWERTY layout has no compact set of "keys" worth wiring up).
 */
export function Keyboard() {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.row}>
        {ROW_1.map((k) => (
          <span key={k} className={styles.key}>{k}</span>
        ))}
      </div>
      <div className={`${styles.row} ${styles.rowInset}`}>
        {ROW_2.map((k) => (
          <span key={k} className={styles.key}>{k}</span>
        ))}
      </div>
      <div className={styles.row}>
        <span className={`${styles.key} ${styles.control} ${styles.wide}`}><ArrowBigUp size={18} /></span>
        {ROW_3.map((k) => (
          <span key={k} className={styles.key}>{k}</span>
        ))}
        <span className={`${styles.key} ${styles.control} ${styles.wide}`}><Delete size={18} /></span>
      </div>
      <div className={styles.row}>
        <span className={`${styles.key} ${styles.control} ${styles.narrow}`}>123</span>
        <span className={`${styles.key} ${styles.space}`}>space</span>
        <span className={`${styles.key} ${styles.go} ${styles.narrow}`}>Go</span>
      </div>
      <div className={styles.utilityRow}>
        <Smile size={22} className={styles.utilityIcon} />
        <Mic size={22} className={styles.utilityIcon} />
      </div>
      <div className={styles.homeIndicator}>
        <span className={styles.homeBar} />
      </div>
    </div>
  );
}

export default Keyboard;
