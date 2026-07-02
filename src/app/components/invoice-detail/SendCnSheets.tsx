// Two small credit-note send sheets: the re-send prompt after editing a sent note (AC4),
// and the "which note to send" picker used when 2+ notes are unsent.
import { BottomSheet } from "../BottomSheet";
import { ButtonDock } from "../ButtonDock";
import { Tile } from "../Tile";
import { money } from "../../lib/format";
import { FONT, MUTED } from "../../lib/theme";
import type { CreditNote } from "./creditNoteTypes";

/** Re-send prompt after editing a sent credit note (AC4). */
export function ResendPromptSheet({ open, onClose, onNotNow, onSendUpdate }: { open: boolean; onClose: () => void; onNotNow: () => void; onSendUpdate: () => void }) {
  return (
    <BottomSheet
      open={open}
      title="Send updated credit note?"
      onClose={onClose}
      footer={
        <ButtonDock
          type="double"
          overflow
          secondaryLabel="Not Now"
          primaryLabel="Send Update"
          onSecondary={onNotNow}
          onPrimary={onSendUpdate}
          homeIndicator
        />
      }
    >
      <p className="text-[14px] leading-[1.45]" style={{ ...FONT, color: MUTED }}>
        This credit note has already been sent to the customer. Would you like to send the updated version now?
      </p>
    </BottomSheet>
  );
}

/** "Send credit note" picker — opened only when there are 2+ unsent notes (a single note sends
 *  directly). Choose which note's document to send; the latest is the default selection. Reuses
 *  the shared selection-card (`Tile`) style. Rows are recent-first, matching the ledger. */
export function SendPickerSheet({ open, onClose, creditNotes, selectedIndex, onSelect, onSend }: { open: boolean; onClose: () => void; creditNotes: CreditNote[]; selectedIndex: number; onSelect: (i: number) => void; onSend: () => void }) {
  return (
    <BottomSheet
      open={open}
      title="Send credit note"
      onClose={onClose}
      footer={
        <ButtonDock
          type="single"
          overflow
          primaryLabel="Send credit note"
          onPrimary={onSend}
          homeIndicator
        />
      }
    >
      <p className="text-[13px] leading-[1.4] pb-3" style={{ ...FONT, color: MUTED }}>
        This invoice has more than one credit note. Choose which one to send.
      </p>
      <div className="flex flex-col gap-2">
        {creditNotes.map((cn, i) => ({ cn, i })).reverse().map(({ cn, i }) => (
          <Tile
            key={cn.no}
            title={cn.no}
            description={`−${money(cn.amount)}${cn.sent ? ` · Sent on ${cn.sentDate}` : " · Not sent yet"}`}
            showStatus={cn.sent}
            status="SENT"
            selected={selectedIndex === i}
            onClick={() => onSelect(i)}
          />
        ))}
      </div>
    </BottomSheet>
  );
}
