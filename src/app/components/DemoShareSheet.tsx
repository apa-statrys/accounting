import { motion, AnimatePresence } from "motion/react";
import WifiTetheringIcon from "@mui/icons-material/WifiTethering";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import MailIcon from "@mui/icons-material/Mail";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TelegramIcon from "@mui/icons-material/Telegram";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FolderIcon from "@mui/icons-material/Folder";
import LinkIcon from "@mui/icons-material/Link";

import { FONT } from "../lib/theme";

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
        <motion.div className="absolute inset-0 z-[60]" initial="closed" animate="open" exit="closed">
          <motion.div className="absolute inset-0 bg-black/30" variants={backdrop} transition={{ duration: 0.3 }} onClick={onClose} aria-hidden />

          <motion.div className="absolute inset-x-2 bottom-2 rounded-[20px] bg-[#f2f2f7] overflow-hidden" variants={sheet}>
            {/* Preview header */}
            <div className="flex items-center gap-3 bg-white px-4 py-3">
              <div className="size-11 rounded-[12px] bg-[#1b1b1b] flex items-center justify-center shrink-0">
                <LinkIcon style={{ fontSize: 22, color: "white" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[#1b1b1b] truncate" style={FONT}>{title}</p>
                <p className="text-[12px] text-[#8e8e93] truncate" style={FONT}>{link}</p>
              </div>
              <span className="text-[12px] text-[#8e8e93]" style={FONT}>Statrys</span>
            </div>

            {/* Channels row */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 py-4 bg-white border-t border-[#ececef]">
              {CHANNELS.map((c) => (
                <button key={c.id} onClick={() => onPick?.(c.id)} className="flex flex-col items-center gap-1.5 w-[60px] shrink-0">
                  <span className="size-[58px] rounded-full flex items-center justify-center" style={{ background: c.bg }}>
                    <c.Icon style={{ fontSize: 26, color: "white" }} />
                  </span>
                  <span className="text-[11px] text-[#1b1b1b] text-center leading-tight" style={FONT}>{c.label}</span>
                </button>
              ))}
            </div>

            {/* Actions list */}
            <div className="mt-2 bg-white">
              <button onClick={() => onPick?.("copy")} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#ececef]">
                <span className="text-[16px] text-[#1b1b1b]" style={FONT}>Copy Link</span>
                <ContentCopyIcon style={{ fontSize: 20, color: "#1b1b1b" }} />
              </button>
              <button onClick={() => onPick?.("files")} className="w-full flex items-center justify-between px-4 py-3.5">
                <span className="text-[16px] text-[#1b1b1b]" style={FONT}>Save to Files</span>
                <FolderIcon style={{ fontSize: 20, color: "#1b1b1b" }} />
              </button>
            </div>

            {/* Cancel */}
            <div className="mt-2">
              <button onClick={onClose} className="w-full bg-white py-3.5 text-[17px] font-semibold text-[#1f8fff]" style={FONT}>
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
