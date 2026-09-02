import { useState } from "react";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { ButtonDock } from "../components/ButtonDock";
import { ListCard } from "../ui/ListCard";
import { FONT } from "../lib/theme";

// Figma "Sales Invoice — Client" (node 1959-11709) — same hand-drawn warning-triangle illustration
// shared by DuplicateDecision/UploadErrorDialog/GeneralErrorPage/NotFoundPage for every "you need
// to decide something" moment; reused here too.
const warningTriangleIcon = new URL("./duplicate-decision-warning.svg", import.meta.url).href;

export interface CustomerConflictField {
  label: string;
  /** This session's edited value. */
  mine: string;
  /** What the other user's save changed it to. */
  theirs: string;
}

interface CustomerConflictPageProps {
  fields: CustomerConflictField[];
  onBack?: () => void;
  /** Proceed with this session's edits, discarding the other user's changes. */
  onOverwrite?: () => void;
  /** Reload the latest saved version, abandoning this session's local edits. */
  onDiscard?: () => void;
}

/**
 * CustomerConflictPage — dedicated full-screen conflict-resolution decision (never a toast/
 * snackbar that would silently last-write-win), same shell as DuplicateDecision: icon + headline +
 * body block, a detail comparison, then a sticky ButtonDock with two explicit resolution paths.
 * Triggered when Save detects the record changed underneath this session — dev-only demo (no real
 * backend to race against in this prototype), see AddCustomerPage's `simulateConflict`/`onConflict`.
 */
export function CustomerConflictPage({ fields, onBack, onOverwrite, onDiscard }: CustomerConflictPageProps) {
  const [scrolled, setScrolled] = useState(false);
  return (
    <div className="relative bg-[var(--bg-neutral-tertiary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <div
        className="flex-1 overflow-y-auto bg-[var(--bg-neutral-tertiary)]"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <PageAppHeader scrolled={scrolled}>
          <PageHeader type="center" onBack={onBack} showSearch={false} />
        </PageAppHeader>

        <div className="px-4 pt-6 pb-44 flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <img src={warningTriangleIcon} alt="" width={52} height={49} />
            <div className="flex flex-col gap-2.5">
              <p className="card-title-lg" style={{ color: "var(--text-primary)" }}>This customer was updated by someone else</p>
              <p className="text-[14px] leading-[1.4]" style={{ ...FONT, color: "var(--text-secondary)" }}>
                Someone else changed this customer while you were editing. Review what changed, then choose how to resolve it.
              </p>
            </div>
          </div>

          {/* Conflicting fields — your version vs. their version. Same white-card-no-border
              treatment as DuplicateDecision's own detail card (ListCard onLayer="gray" — the
              app's pages sit on the gray/beige background, so the card needs no border to read
              as raised, just the white-vs-gray contrast). */}
          <div className="flex flex-col gap-3">
            {fields.map((row) => (
              <ListCard key={row.label} onLayer="gray">
                <div className="py-3 flex flex-col gap-2">
                  <p className="text-[13px] font-bold" style={{ ...FONT, color: "var(--text-primary)" }}>{row.label}</p>
                  <div>
                    <p className="text-[12px]" style={{ ...FONT, color: "var(--text-secondary)" }}>Your version</p>
                    <p className="text-[14px]" style={{ ...FONT, color: "var(--text-primary)" }}>{row.mine || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[12px]" style={{ ...FONT, color: "var(--text-secondary)" }}>Their version</p>
                    <p className="text-[14px]" style={{ ...FONT, color: "var(--text-primary)" }}>{row.theirs || "—"}</p>
                  </div>
                </div>
              </ListCard>
            ))}
          </div>
        </div>
      </div>

      <ButtonDock
        type="double"
        sticky
        primaryLabel="Confirm to Overwrite"
        secondaryLabel="Discard My Changes"
        onPrimary={onOverwrite}
        onSecondary={onDiscard}
      />
    </div>
  );
}

export default CustomerConflictPage;
