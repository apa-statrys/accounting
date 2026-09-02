import { useState } from "react";
import { Check } from "lucide-react";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { ButtonDock } from "../components/ButtonDock";
import { FONT } from "../lib/theme";
import type { Customer } from "../types";

// Figma "Sales Invoice — Client" (node 1959-11709) — same hand-drawn warning-triangle illustration
// shared by DuplicateDecision/UploadErrorDialog/GeneralErrorPage/NotFoundPage for every "you need
// to decide something" moment; reused here too.
const warningTriangleIcon = new URL("./duplicate-decision-warning.svg", import.meta.url).href;

/** The fields a demo concurrent edit can conflict on (see AddCustomerPage's
 *  CONFLICT_DEMO_PHONE/WEBSITE/ADDRESS/CITY/ZIP) — key must be a Customer field whose value is a
 *  plain string. */
type ConflictFieldKey = "phone" | "website" | "address" | "city" | "zip";
const CONFLICT_FIELDS: { key: ConflictFieldKey; label: string }[] = [
  { key: "phone", label: "Phone Number" },
  { key: "website", label: "Website" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "zip", label: "Zip / Postal Code" },
];

/** One selectable version of a conflicting field — value leads (the actual data being compared
 *  is what matters most), subtitle names where it came from. Selecting a card is what commits to
 *  it (the whole row is tappable); the checkmark plus the brand-colored border are the only
 *  affordance needed, no "Keep mine"/"Use theirs" action text on the unselected side. White card /
 *  no border (Tile's own onLayer="gray" recipe) — this can't use ui/Tile directly since Tile's
 *  trailing slot is a fixed 30px icon box, too narrow for a longer value + checkmark layout. */
function ResolutionOption({
  value,
  subtitle,
  selected,
  onClick,
}: {
  value: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-left"
      style={{
        background: "var(--bg-neutral-primary)",
        border: `1px solid ${selected ? "var(--bg-brand-primary)" : "transparent"}`,
      }}
    >
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[14px] truncate" style={{ ...FONT, color: "var(--text-primary)" }}>{value || "—"}</span>
        <span className="text-[12px]" style={{ ...FONT, color: "var(--text-secondary)" }}>{subtitle}</span>
      </span>
      {selected && <Check size={18} strokeWidth={1.67} style={{ color: "var(--bg-brand-primary)" }} className="shrink-0" />}
    </button>
  );
}

interface CustomerConflictPageProps {
  /** This session's edited record. */
  mine: Customer;
  /** What the other user's save changed it to. */
  theirs: Customer;
  onBack?: () => void;
  /** The merged record after per-field Keep Mine/Use Theirs resolution. */
  onSave?: (resolved: Customer) => void;
}

/**
 * CustomerConflictPage — dedicated full-screen conflict-resolution decision (never a toast/
 * snackbar that would silently last-write-win), same shell as DuplicateDecision: icon + headline +
 * body block, then per-field resolution. Rather than one blanket "overwrite everything" vs.
 * "discard everything" choice, each conflicting field is its own Keep Mine/Use Theirs picker (two
 * selectable ResolutionOption cards showing each version's actual value) — clearer about exactly
 * what one CTA tap commits to than two large side-by-side comparison cards were. A single "Save"
 * CTA commits the merged result. Triggered when Save detects the record changed
 * underneath this session — dev-only demo (no real backend to race against in this prototype),
 * see AddCustomerPage's `simulateConflict`/`onConflict`.
 */
export function CustomerConflictPage({ mine, theirs, onBack, onSave }: CustomerConflictPageProps) {
  const [scrolled, setScrolled] = useState(false);
  // Defaults to "mine" for every field — a save always has somewhere sensible to land without
  // forcing a choice on fields the user doesn't care to override.
  const [resolution, setResolution] = useState<Record<ConflictFieldKey, "mine" | "theirs">>(() =>
    Object.fromEntries(CONFLICT_FIELDS.map(({ key }) => [key, "mine"])) as Record<ConflictFieldKey, "mine" | "theirs">
  );

  const handleSave = () => {
    const resolved = { ...mine };
    for (const { key } of CONFLICT_FIELDS) {
      if (resolution[key] === "theirs") resolved[key] = theirs[key];
    }
    onSave?.(resolved);
  };

  return (
    <div className="relative bg-[var(--bg-neutral-tertiary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <div
        className="flex-1 overflow-y-auto thin-scrollbar bg-[var(--bg-neutral-tertiary)]"
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
                Someone else changed this customer while you were editing. Resolve each change below, then save.
              </p>
            </div>
          </div>

          {/* One Keep Mine/Use Theirs picker per conflicting field, instead of two blanket
              whole-record choices — no separate "Resolve Changes" heading, the intro copy above
              already says as much. Field label is a SECTION label grouping its two option cards,
              not an individual form-field label — same body-sm-medium/text-primary/sentence-case
              style as AddInvoiceDetails' own Section component ("Items", "Discount", …), not
              ui/TextField's regular-weight field label. */}
          <div className="flex flex-col gap-4">
            {CONFLICT_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-2">
                <p className="body-sm-medium text-[var(--text-primary)]">{label}</p>
                <div className="flex flex-col gap-2">
                  <ResolutionOption
                    value={mine[key] ?? ""}
                    subtitle="Your version"
                    selected={resolution[key] === "mine"}
                    onClick={() => setResolution((r) => ({ ...r, [key]: "mine" }))}
                  />
                  <ResolutionOption
                    value={theirs[key] ?? ""}
                    subtitle="Their version"
                    selected={resolution[key] === "theirs"}
                    onClick={() => setResolution((r) => ({ ...r, [key]: "theirs" }))}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ButtonDock type="single" sticky primaryLabel="Save" onPrimary={handleSave} />
    </div>
  );
}

export default CustomerConflictPage;
