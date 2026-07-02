import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { ATTENTION_TASKS } from "../data/attentionTasks";
import type { AttentionTask } from "../types";

import { FONT } from "../lib/theme";

interface NeedAttentionProps {
  onBack?: () => void;
  /** Open the invoice this task is about. */
  onOpenInvoice?: (inv: AttentionTask["invoice"]) => void;
}

/** Solid beige card (no border) with a primary-black CTA — a distinct Need Attention style
 *  (differentiated from the dashed invoice cards; the dashboard stack stays dark). */
function TaskCard({ task, onOpen }: { task: AttentionTask; onOpen?: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full bg-[#faf9f4] border border-[rgba(160,160,160,0.25)] rounded-xl px-[17px] py-[13px] flex items-center gap-3 text-left active:bg-[#f4f1e6] transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold leading-[1.3] text-[#1b1b1b] truncate" style={FONT}>{task.title}</p>
        <p className="text-[12px] leading-[1.3] text-[#808080] truncate" style={FONT}>{task.sub}</p>
      </div>
      <span
        className="shrink-0 h-[30px] px-3 rounded bg-[#1b1b1b] flex items-center justify-center text-[14px] font-medium uppercase leading-none text-white"
        style={FONT}
      >
        {task.action}
      </span>
    </button>
  );
}

/** Dedicated "Need attention" screen — every pending action that needs review/confirmation. */
export function NeedAttention({ onBack, onOpenInvoice }: NeedAttentionProps) {
  return (
    <div className="relative bg-[#F9F5EA] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <StatusBar />

      <SheetHeader
        title="Needs Attention"
        type="inside-page"
        state="fixed"
        leading={
          <HeaderIconButton aria-label="Back" onClick={onBack}>
            <ChevronLeftIcon />
          </HeaderIconButton>
        }
        trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
      />

      <div className="flex-1 overflow-y-auto thin-scrollbar bg-white px-4 pt-5 pb-10 flex flex-col gap-4">
        <p className="text-[13px] leading-[1.4] text-[#808080]" style={FONT}>
          {ATTENTION_TASKS.length} items require action. Open an item to resolve it.
        </p>

        <div className="flex flex-col gap-2">
          {ATTENTION_TASKS.map((t) => (
            <TaskCard key={t.id} task={t} onOpen={() => onOpenInvoice?.(t.invoice)} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default NeedAttention;
