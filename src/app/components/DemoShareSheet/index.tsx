import { motion, AnimatePresence } from "motion/react";
import WifiTetheringIcon from "@mui/icons-material/WifiTethering";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import MailIcon from "@mui/icons-material/Mail";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TelegramIcon from "@mui/icons-material/Telegram";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FolderIcon from "@mui/icons-material/Folder";
import LinkIcon from "@mui/icons-material/Link";

import styles from "./index.module.css";

const backdrop = { closed: { opacity: 0 }, open: { opacity: 1 } };
const sheet = {
  closed: { y: "100%", transition: { type: "tween" as const, duration: 0.35, ease: [0.4, 0, 0.6, 1] as const } },
  open: { y: 0, transition: { type: "spring" as const, stiffness: 360, damping: 36 } },
};

type Channel = { id: string; label: string; bg: string; Icon: typeof MailIcon };

const CHANNELS: Channel[] = [
  { id: "airdrop", label: "AirDrop", bg: "#1f8fff", Icon: WifiTetheringIcon },
  { id: "messages", label: "Messages", bg: "#34c759", Icon: ChatBubbleIcon },
  { id: "mail", label: "Mail", bg: "#2f9bff", Icon: MailIcon },
  { id: "whatsapp", label: "WhatsApp", bg: "#25d366", Icon: WhatsAppIcon },
  { id: "telegram", label: "Telegram", bg: "#2aabee", Icon: TelegramIcon },
];

interface DemoShareSheetProps {
  open: boolean;
  link: string;
  title?: string;
  onClose?: () => void;
  /** A channel/action was picked (demo only — nothing is actually shared). */
  onPick?: (channelId: string) => void;
}

/** Demo iOS-style share sheet — visual only, no real sharing happens. */
export function DemoShareSheet({ open, link, title = "Invoice payment link", onClose, onPick }: DemoShareSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className={styles.overlay} initial="closed" animate="open" exit="closed">
          <motion.div className={styles.backdrop} variants={backdrop} transition={{ duration: 0.3 }} onClick={onClose} aria-hidden />

          <motion.div className={styles.sheet} variants={sheet}>
            {/* Preview header */}
            <div className={styles.previewHeader}>
              <div className={styles.previewIcon}>
                <LinkIcon className={styles.previewIconGlyph} />
              </div>
              <div className={styles.previewText}>
                <p className={`${styles.previewTitle} card-title-sm`}>{title}</p>
                <p className={`${styles.previewLink} caption`}>{link}</p>
              </div>
              <span className={`${styles.previewBrand} caption`}>Statrys</span>
            </div>

            {/* Channels row */}
            <div className={`${styles.channelsRow} no-scrollbar`}>
              {CHANNELS.map((c) => (
                <button key={c.id} onClick={() => onPick?.(c.id)} className={styles.channelButton}>
                  <span className={styles.channelIcon} style={{ background: c.bg }}>
                    <c.Icon className={styles.channelIconGlyph} />
                  </span>
                  <span className={`${styles.channelLabel} caption`}>{c.label}</span>
                </button>
              ))}
            </div>

            {/* Actions list */}
            <div className={styles.actionsList}>
              <button onClick={() => onPick?.("copy")} className={styles.actionButton}>
                <span className={`${styles.actionLabel} body-md`}>Copy Link</span>
                <ContentCopyIcon className={styles.actionIcon} />
              </button>
              <button onClick={() => onPick?.("files")} className={`${styles.actionButton} ${styles.actionButtonLast}`}>
                <span className={`${styles.actionLabel} body-md`}>Save to Files</span>
                <FolderIcon className={styles.actionIcon} />
              </button>
            </div>

            {/* Cancel */}
            <div className={styles.cancelWrap}>
              <button onClick={onClose} className={`${styles.cancelButton} h6`}>
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DemoShareSheet;
