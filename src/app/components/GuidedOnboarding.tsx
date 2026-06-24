import { useState, useRef } from "react";
import { X, ChevronRight, Trash2, ArrowRight, UserRound, Package, Plus, Check } from "lucide-react";
import { Button } from "./Buttons";
import { CustomerBottomSheet } from "./CustomerBottomSheet";
import { DueDateBottomSheet } from "./DueDateBottomSheet";
import { AddItemBottomSheet } from "./AddItemBottomSheet";

interface StepState {
  billTo: boolean;
  invoiceDetails: boolean;
  lineItems: boolean;
}

const DUE_DATE_OPTIONS = ["On receipt", "Net 7", "Net 15", "Net 30", "Net 60"];
const CURRENCY_OPTIONS = ["HKD", "USD", "EUR", "GBP", "CAD", "AUD"];

function SwipeableItemRow({
  item,
  onEdit,
  onDelete,
}: {
  item: { name: string; qty: number; unitPrice: number };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const DELETE_WIDTH = 80;

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    if (Math.abs(dx) > 4) isDragging.current = true;
    if (dx < 0) setOffsetX(Math.max(dx, -DELETE_WIDTH));
    else setOffsetX(Math.min(0, offsetX + dx));
  };

  const onTouchEnd = () => {
    if (offsetX < -DELETE_WIDTH / 2) {
      setOffsetX(-DELETE_WIDTH);
    } else {
      setOffsetX(0);
    }
  };

  const handleClick = () => {
    if (isDragging.current) return;
    if (offsetX !== 0) { setOffsetX(0); return; }
    onEdit();
  };

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ touchAction: "pan-y" }}>
      {/* Delete button — sits on the right, revealed by card sliding left */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 rounded-2xl"
        style={{ width: DELETE_WIDTH }}
      >
        <button
          onClick={onDelete}
          className="flex flex-col items-center gap-1 text-white w-full h-full justify-center"
        >
          <Trash2 size={18} />
          <span className="text-[10px]">Delete</span>
        </button>
      </div>

      {/* Swipeable card */}
      <div
        className="relative bg-white rounded-2xl px-4 py-4 flex items-center gap-3"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging.current ? "none" : "transform 0.25s ease",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleClick}
      >
        <div className="w-10 h-10 rounded-full bg-[#FFE8E2] flex items-center justify-center shrink-0">
          <Package size={18} className="text-[#FF4A15]" />
        </div>
        <div className="flex-1">
          <p className="text-[15px] text-gray-900">{item.name}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{item.qty} × ${item.unitPrice.toFixed(2)}</p>
        </div>
        <ChevronRight size={18} className="text-gray-300 shrink-0" />
      </div>
    </div>
  );
}

export function GuidedOnboarding({ onComplete }: { onComplete: () => void }) {
  const [steps, setSteps] = useState<StepState>({
    billTo: false,
    invoiceDetails: false,
    lineItems: false,
  });
  const [issueDate] = useState("Jun 11, 2026");
  const [dueDate, setDueDate] = useState("Jul 11, 2026");
  const [functionalCurrency, setFunctionalCurrency] = useState("HKD");
  const [receivingAccount] = useState("SG 829302029");
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; email: string } | null>(null);
  const [showAddItemSheet, setShowAddItemSheet] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [lineItems, setLineItems] = useState<{ id: number; name: string; qty: number; unitPrice: number }[]>([]);
  const [discount, setDiscount] = useState<{ value: number; type: "amount" | "percent" } | null>(null);

  const completedCount = Object.values(steps).filter(Boolean).length;
  const allDone = completedCount === 3;

  const markStep = (step: keyof StepState) => {
    setSteps((prev) => ({ ...prev, [step]: true }));
  };

  const stepNumClass = (done: boolean, active: boolean, stepNum: number) =>
    `w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
      done
        ? "bg-[#22C55E] text-white"
        : active && stepNum === 1
        ? "bg-transparent text-black border-2 border-black"
        : active
        ? "bg-[var(--brand-5,#FF4A15)] text-white"
        : "bg-transparent text-[#BDBDBD] border border-[#BDBDBD]"
    }`;

  const activeStep = !steps.billTo ? 1 : !steps.invoiceDetails ? 2 : 3;

  return (
    <div
      className="relative bg-[#F9F5EA] rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
      style={{ width: 375, height: 812 }}
    >
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-4 pb-1">
          <span className="text-[15px] font-semibold tracking-tight">9:41</span>
          <div className="absolute left-1/2 -translate-x-1/2 top-2 w-28 h-7 bg-black rounded-full" />
          <div className="flex items-center gap-1.5">
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              <rect x="0" y="4" width="3" height="8" rx="0.5" fill="black" />
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="0.5" fill="black" />
              <rect x="9" y="0.5" width="3" height="11.5" rx="0.5" fill="black" />
              <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="black" fillOpacity="0.3" />
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M8 2.5C10.2 2.5 12.2 3.4 13.6 4.9L15 3.4C13.2 1.5 10.7 0.3 8 0.3C5.3 0.3 2.8 1.5 1 3.4L2.4 4.9C3.8 3.4 5.8 2.5 8 2.5Z" fill="black" />
              <path d="M8 5.5C9.4 5.5 10.6 6.1 11.5 7L12.9 5.5C11.6 4.2 9.9 3.4 8 3.4C6.1 3.4 4.4 4.2 3.1 5.5L4.5 7C5.4 6.1 6.6 5.5 8 5.5Z" fill="black" />
              <circle cx="8" cy="10" r="1.5" fill="black" />
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="black" strokeOpacity="0.35" />
              <rect x="2" y="2" width="18" height="8" rx="2" fill="black" />
              <path d="M23 4V8C23.8 7.6 24.5 6.9 24.5 6C24.5 5.1 23.8 4.4 23 4Z" fill="black" fillOpacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Nav bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button className="w-8 h-8 flex items-center justify-center">
            <X className="text-black" size={20} strokeWidth={2} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-semibold text-[#101828]">New invoice</span>
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded tracking-wide">
              DRAFT
            </span>
          </div>
          <div className="w-8" />
        </div>

        {/* Sticky header + progress */}
        <div className="sticky top-0 z-10 bg-[#F9F5EA]">
          <div className="px-4 pt-2 pb-3 flex items-center justify-between">
            <h1 className="text-[18px] font-bold text-gray-900 leading-tight">
              Let's create your first invoice
            </h1>
            <span className="text-[14px] text-gray-400 font-medium shrink-0 ml-3">{completedCount}/3</span>
          </div>
          <div className="px-4 flex items-center gap-2">
            {[
              { label: "Customer", index: 0 },
              { label: "Invoice Details", index: 1 },
              { label: "Line Item", index: 2 },
            ].map(({ label, index }) => (
              <div key={label} className="flex-1">
                <div
                  className="h-[3px] rounded-full transition-all duration-500"
                  style={{ background: completedCount > index ? "#FF4A15" : "#E0E0E0" }}
                />
              </div>
            ))}
          </div>
          <div className="h-px bg-gray-200 mt-3" />
        </div>

        {/* Steps */}
        <div className="flex-1 px-4 space-y-5 overflow-y-auto pb-36 pt-5">

          {/* Step 1: BILL TO */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={stepNumClass(steps.billTo, activeStep === 1, 1)}>
                {steps.billTo ? <Check size={14} strokeWidth={3} /> : "1"}
              </div>
              <span className="tracking-widest text-primary font-bold text-[12px] text-[#808080]">BILL TO</span>
            </div>

            {activeStep === 1 && !steps.billTo && (
              null
            )}

            <button
              onClick={() => setShowCustomerSheet(true)}
              className={`w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left border-2 border-dashed ${steps.billTo ? "bg-white border-transparent" : "bg-white border-gray-300"}`}
            >
              <div className="w-10 h-10 rounded-full bg-[#FFE8E2] flex items-center justify-center shrink-0">
                <UserRound size={18} className="text-[#FF4A15]" />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 text-[14px]">
                  {selectedCustomer ? selectedCustomer.name : "Add a customer"}
                </p>
                <p className="text-[12px] text-gray-400 mt-0.5 font-regular
                  ">
                  {selectedCustomer ? selectedCustomer.email : "Pick a saved one or create a new contact"}
                </p>
              </div>
              <ChevronRight size={18} className="text-gray-300 shrink-0" />
            </button>
          </div>

          {/* Step 2: INVOICE DETAILS */}
          <div className={!steps.billTo ? "opacity-50 pointer-events-none" : ""}>
            <div className="flex items-center gap-2 mb-2">
              <div className={stepNumClass(steps.invoiceDetails, activeStep === 2, 2)}>
                {steps.invoiceDetails ? <Check size={14} strokeWidth={3} /> : "2"}
              </div>
              <span className="font-bold tracking-widest text-secondary text-[12px] text-[#808080]">INVOICE DETAILS</span>
            </div>

            {activeStep === 2 && !steps.invoiceDetails && (
              <div className="flex items-start gap-2 mb-3">
                <ArrowRight size={15} className="text-[#FF4A15] mt-0.5 shrink-0" />
                <p className="text-[13px] text-gray-500 leading-snug">
                  Set the dates, currency, and receiving account for this invoice.
                </p>
              </div>
            )}

            <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-100">
              {/* Issue date */}
              <div className="flex items-center justify-between px-4 py-4">
                <span className="text-gray-400 text-[14px]">Issue date</span>
                <button className="flex items-center gap-1.5" disabled={!steps.billTo}>
                  <span className="text-gray-900 text-[14px]">{issueDate}</span>
                  <ChevronRight size={15} className="text-gray-300" />
                </button>
              </div>

              {/* Due date */}
              <div>
                <button
                  onClick={() => steps.billTo && setShowDueDatePicker(true)}
                  disabled={!steps.billTo}
                  className="w-full flex items-center justify-between px-4 py-4"
                >
                  <span className="text-gray-400 text-[14px]">Due date</span>
                  <span className="flex items-center gap-1.5">
                    {dueDate
                      ? <span className="text-[15px] text-gray-900">{dueDate}</span>
                      : <span className="text-gray-400 text-[14px]">Choose</span>
                    }
                    <ChevronRight size={15} className="text-gray-300" />
                  </span>
                </button>
              </div>

              {/* Functional currency */}
              <div className="relative">
                <button
                  onClick={() => { if (steps.billTo) { setShowCurrencyPicker(!showCurrencyPicker); setShowDueDatePicker(false); } }}
                  disabled={!steps.billTo}
                  className="w-full flex items-center justify-between px-4 py-4"
                >
                  <span className="text-gray-400 text-[14px]">Currency</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-gray-900 text-[14px]">{functionalCurrency}</span>
                    <ChevronRight size={15} className="text-gray-300" />
                  </span>
                </button>
                {showCurrencyPicker && (
                  <div className="absolute left-0 right-0 top-full z-20 bg-white shadow-lg rounded-2xl border border-gray-100 mx-1 overflow-hidden">
                    {CURRENCY_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setFunctionalCurrency(c); setShowCurrencyPicker(false); }}
                        className={`w-full text-left px-4 py-3 text-[15px] hover:bg-gray-50 ${c === functionalCurrency ? "text-[#FF4A15] font-semibold" : "text-gray-900"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Receiving account */}
              <button
                className="w-full flex items-center justify-between px-4 py-4"
                onClick={() => { if (dueDate && steps.billTo) markStep("invoiceDetails"); }}
                disabled={!steps.billTo}
              >
                <span className="text-gray-400 text-[14px]">Receiving account</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-gray-900 text-[14px]">{receivingAccount}</span>
                  <ChevronRight size={15} className="text-gray-300" />
                </span>
              </button>
            </div>
          </div>

          {/* Step 3: LINE ITEMS */}
          <div className={!steps.invoiceDetails ? "opacity-50 pointer-events-none" : ""}>
            <div className="flex items-center gap-2 mb-2">
              <div className={stepNumClass(steps.lineItems, activeStep === 3, 3)}>
                {steps.lineItems ? <Check size={14} strokeWidth={3} /> : "3"}
              </div>
              <span className="font-bold tracking-widest text-secondary text-[12px] text-[#808080]">ITEMS</span>
            </div>

            {activeStep === 3 && !steps.lineItems && (
              <div className="flex items-start gap-2 mb-3">
                <ArrowRight size={15} className="text-[#FF4A15] mt-0.5 shrink-0" />
                <p className="text-[13px] text-gray-500 leading-snug">
                  Add the services or products you're charging for. You can add as many as you need.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {lineItems.length === 0 ? (
                <button
                  onClick={() => { if (steps.invoiceDetails) { setEditingItem(null); setShowAddItemSheet(true); } }}
                  disabled={!steps.invoiceDetails}
                  className="w-full bg-white rounded-2xl px-4 py-4 flex items-center gap-3 text-left border-2 border-dashed border-gray-300"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FFE8E2] flex items-center justify-center shrink-0">
                    <Package size={18} className="text-[#FF4A15]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-gray-900"><span className="font-normal">Add your first item</span></p>
                    <p className="text-[12px] font-regular text-gray-400 mt-0.5">A service or product you're charging for</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 shrink-0" />
                </button>
              ) : (
                <>
                  {lineItems.map((item) => (
                    <SwipeableItemRow
                      key={item.id}
                      item={item}
                      onEdit={() => { setEditingItem(item.id); setShowAddItemSheet(true); }}
                      onDelete={() => {
                        const next = lineItems.filter((i) => i.id !== item.id);
                        setLineItems(next);
                        if (next.length === 0) setSteps((p) => ({ ...p, lineItems: false }));
                      }}
                    />
                  ))}
                  <button
                    onClick={() => { setEditingItem(null); setShowAddItemSheet(true); }}
                    className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center justify-center gap-2 border border-gray-200"
                  >
                    <Plus size={15} className="text-gray-700" />
                    <span className="text-[14px] font-semibold text-gray-700">Add another item</span>
                  </button>
                </>
              )}
            </div>

            {/* Discount — always visible inline */}
            {lineItems.length > 0 && (
              <div className="mt-2 bg-white rounded-2xl px-4 py-4">
                <p className="text-[11px] font-semibold text-gray-500 tracking-widest mb-3">DISCOUNT</p>
                <div className="flex items-center bg-[#F2F2F2] rounded-xl m-[0px] px-[12px] py-[4px]">
                  <span className="text-[14px] text-gray-400 shrink-0">{functionalCurrency}</span>
                  <input
                    type="number"
                    min={0}
                    value={discount?.value ?? ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setDiscount(isNaN(val) ? null : { value: val, type: discount?.type ?? "amount" });
                    }}
                    placeholder="0"
                    className="flex-1 bg-transparent outline-none text-[14px] text-gray-900 py-2 px-2"
                  />
                  <div className="flex items-center bg-[#E4E4E4] rounded-lg p-0.5 shrink-0 p-[2px]">
                    <button
                      onClick={() => setDiscount((d) => d ? { ...d, type: "amount" } : { value: 0, type: "amount" })}
                      className={`px-3 py-1.5 rounded-md text-[13px] font-semibold transition-all ${
                        (discount?.type ?? "amount") === "amount"
                          ? "bg-[#FF4A15] text-white"
                          : "text-gray-400"
                      }`}
                    >
                      {functionalCurrency}
                    </button>
                    <button
                      onClick={() => setDiscount((d) => d ? { ...d, type: "percent" } : { value: 0, type: "percent" })}
                      className={`px-3 py-1.5 rounded-md text-[13px] font-semibold transition-all ${
                        discount?.type === "percent"
                          ? "bg-[#FF4A15] text-white"
                          : "text-gray-400"
                      }`}
                    >
                      %
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer bottom sheet */}
        <CustomerBottomSheet
          open={showCustomerSheet}
          onClose={() => setShowCustomerSheet(false)}
          onSelect={(c) => { setSelectedCustomer(c); markStep("billTo"); }}
        />

        {/* Due date bottom sheet */}
        <DueDateBottomSheet
          open={showDueDatePicker}
          onClose={() => setShowDueDatePicker(false)}
          onSelect={(val) => setDueDate(val)}
        />

        {/* Add item bottom sheet */}
        <AddItemBottomSheet
          open={showAddItemSheet}
          onClose={() => { setShowAddItemSheet(false); setEditingItem(null); }}
          onAdd={(item) => {
            if (editingItem !== null) {
              setLineItems((prev) => prev.map((i) => i.id === editingItem ? { ...i, ...item } : i));
            } else {
              setLineItems((prev) => [...prev, { id: Date.now(), ...item }]);
            }
            markStep("lineItems");
          }}
        />

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white px-4 pt-4 pb-10 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3">
            <button className="w-12 h-12 flex items-center justify-center rounded-xl border border-gray-300 bg-white shrink-0">
              <Trash2 size={18} className="text-gray-500" />
            </button>
            <Button
              variant="primary"
              className="flex-1"
              disabled={!allDone}
              onClick={onComplete}
            >
              ISSUE INVOICE
            </Button>
          </div>
        </div>
      </div>
  );
}