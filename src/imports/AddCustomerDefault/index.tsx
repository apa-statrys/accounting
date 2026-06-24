import svgPaths from "./svg-38qyojdhac";

function ElementsSignal() {
  return (
    <div className="-translate-y-1/2 absolute h-[12px] right-[56.33px] top-1/2 w-[19.971px]" data-name="Elements / Signal">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.9707 12.0001">
        <g id="Elements / Signal">
          <path d={svgPaths.pe92800} fill="var(--fill-0, black)" id="Cellular Connection" />
        </g>
      </svg>
    </div>
  );
}

function ElementsConnection() {
  return (
    <div className="-translate-y-1/2 absolute h-[12.5px] right-[33.33px] top-1/2 w-[17px]" data-name="Elements / Connection">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 12.501">
        <g id="Elements / Connection">
          <path d={svgPaths.p2bd39980} fill="var(--fill-0, black)" id="Wifi" />
        </g>
      </svg>
    </div>
  );
}

function ElementsBattery() {
  return (
    <div className="absolute h-[13px] right-0 top-0 w-[27.33px]" data-name="Elements / Battery">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27.33 13">
        <g clipPath="url(#clip0_86_2573)" id="Elements / Battery">
          <rect height="12" id="Border" opacity="0.4" rx="3.5" stroke="var(--stroke-0, black)" width="24" x="0.5" y="0.5" />
          <path d={svgPaths.p223c2d00} fill="var(--fill-0, black)" id="Cap" opacity="0.5" />
          <rect fill="var(--fill-0, black)" height="9" id="Capacity" rx="2" width="21" x="2" y="2" />
        </g>
        <defs>
          <clipPath id="clip0_86_2573">
            <rect fill="white" height="13" width="27.33" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Indicators() {
  return (
    <div className="h-[13px] relative shrink-0 w-[78.301px]" data-name="Indicators">
      <ElementsSignal />
      <ElementsConnection />
      <ElementsBattery />
    </div>
  );
}

function Frame4() {
  return (
    <div className="opacity-0 relative shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-end relative size-full">
        <div className="bg-white content-stretch flex items-center justify-center p-[13px] relative rounded-[9999px] shrink-0 size-[30px]" data-name="Button">
          <div aria-hidden className="absolute border border-[rgba(255,255,255,0)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
          <div className="relative shrink-0 size-[20px]" data-name="plus">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
              <div className="absolute inset-[20.83%]" data-name="Vector">
                <div className="absolute inset-[-5.71%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
                    <path d={svgPaths.p1a949000} id="Vector" stroke="var(--stroke-0, #1B1B1B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="[word-break:break-word] font-['GT_Walsheim_LC:Bold',sans-serif] leading-[1.1] not-italic relative shrink-0 text-[#1b1b1b] text-[18px] whitespace-nowrap">Add a customer</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Frame />
      <div className="bg-[#1b1b1b] content-stretch flex items-center justify-center p-[13px] relative rounded-[9999px] shrink-0 size-[30px]" data-name="Button">
        <div aria-hidden className="absolute border border-[#1b1b1b] border-solid inset-0 pointer-events-none rounded-[9999px]" />
        <div className="relative shrink-0 size-[16px]" data-name="plus">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
            <div className="absolute inset-[20.83%]" data-name="Vector">
              <div className="absolute inset-[-7.14%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 10.6667">
                  <path d={svgPaths.p360d1680} id="Vector" stroke="var(--stroke-0, #F9F5EA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Container">
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="search">
        <div className="absolute inset-[12.5%]" data-name="Vector">
          <div className="absolute inset-[-4.64%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.6699 19.6702">
              <path d={svgPaths.p26501ec0} id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.67" />
            </svg>
          </div>
        </div>
      </div>
      <div className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['GT_Walsheim_LC:Regular',sans-serif] justify-center leading-[0] min-w-px not-italic relative text-[#a0a0a0] text-[16px]">
        <p className="leading-[1.3]">Search</p>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px not-italic relative">
      <p className="font-['GT_Walsheim_LC:Black',sans-serif] leading-none relative shrink-0 text-[#1b1b1b] text-[20px] tracking-[-1px] w-full">{`Marlow & Finch Studio`}</p>
      <p className="font-['GT_Walsheim_LC:Regular',sans-serif] leading-[1.3] relative shrink-0 text-[#808080] text-[16px] w-full">finch@studio.com</p>
    </div>
  );
}

function Frame6() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-start relative size-full">
        <Frame5 />
      </div>
    </div>
  );
}

function Frame8() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px not-italic relative">
      <p className="font-['GT_Walsheim_LC:Black',sans-serif] leading-none relative shrink-0 text-[#1b1b1b] text-[20px] tracking-[-1px] w-full">Bright Harbor Co.</p>
      <p className="font-['GT_Walsheim_LC:Regular',sans-serif] leading-[1.3] relative shrink-0 text-[#808080] text-[16px] w-full">billing@brightharbor.com</p>
    </div>
  );
}

function Frame7() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-start relative size-full">
        <Frame8 />
      </div>
    </div>
  );
}

function Frame10() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px not-italic relative">
      <p className="font-['GT_Walsheim_LC:Black',sans-serif] leading-none relative shrink-0 text-[#1b1b1b] text-[20px] tracking-[-1px] w-full">Otto Reyes</p>
      <p className="font-['GT_Walsheim_LC:Regular',sans-serif] leading-[1.3] relative shrink-0 text-[#808080] text-[16px] w-full">otto@eyedesign.co</p>
    </div>
  );
}

function Frame9() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-start relative size-full">
        <Frame10 />
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
      <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="RadioCard">
        <div className="flex flex-col items-center justify-center size-full">
          <div className="content-stretch flex flex-col items-center justify-center p-[16px] relative size-full">
            <Frame6 />
          </div>
        </div>
      </div>
      <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="RadioCard">
        <div className="flex flex-col items-center justify-center size-full">
          <div className="content-stretch flex flex-col items-center justify-center p-[16px] relative size-full">
            <Frame7 />
          </div>
        </div>
      </div>
      <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="RadioCard">
        <div className="flex flex-col items-center justify-center size-full">
          <div className="content-stretch flex flex-col items-center justify-center p-[16px] relative size-full">
            <Frame9 />
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[16px] items-start relative size-full">
        <Frame2 />
        <div className="bg-white content-stretch flex h-[44px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0 w-[343px]" data-name="SearchInput">
          <div aria-hidden className="absolute border border-[rgba(208,208,208,0.4)] border-solid inset-[-0.5px] pointer-events-none rounded-[8.5px]" />
          <Container1 />
        </div>
        <Frame3 />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[613px] relative shrink-0 w-full" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[144px] pt-[20px] px-[16px] relative size-full">
          <Frame1 />
        </div>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-start px-[16px] relative size-full">
        <div className="bg-white flex-[1_0_0] min-w-px relative rounded-[4px]" data-name="Button">
          <div aria-hidden className="absolute border border-[rgba(27,27,27,0.3)] border-solid inset-0 pointer-events-none rounded-[4px]" />
          <div className="flex flex-row items-center justify-center size-full">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center justify-center px-[17px] py-[13px] relative size-full">
              <p className="[word-break:break-word] font-['GT_Walsheim_LC:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[16px] text-[rgba(27,27,27,0.3)] text-center uppercase whitespace-nowrap">Send Later</p>
            </div>
          </div>
        </div>
        <div className="bg-[rgba(27,27,27,0.3)] flex-[1_0_0] min-w-px relative rounded-[4px]" data-name="Button">
          <div aria-hidden className="absolute border border-[rgba(255,255,255,0)] border-solid inset-0 pointer-events-none rounded-[4px]" />
          <div className="flex flex-row items-center justify-center size-full">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center justify-center px-[17px] py-[13px] relative size-full">
              <p className="[word-break:break-word] font-['GT_Walsheim_LC:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[16px] text-[rgba(249,245,234,0.6)] text-center uppercase whitespace-nowrap">Send Invoice</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddCustomerDefault() {
  return (
    <div className="bg-[#f9f5ea] content-stretch flex flex-col items-start overflow-clip relative rounded-[48px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] size-full" data-name="Add Customer / Default">
      <div className="relative shrink-0 w-[375px]" data-name="StatusBar">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between overflow-clip px-[32px] py-[16px] relative rounded-[inherit] size-full">
          <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Elements / Time">
            <div className="[word-break:break-word] flex flex-col font-['SF_Pro_Text:Semibold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-black text-center tracking-[-0.5px] whitespace-nowrap" style={{ fontFeatureSettings: '"ss03"' }}>
              <p className="leading-[17px]">09:41</p>
            </div>
          </div>
          <Indicators />
        </div>
      </div>
      <div className="bg-[#f9f5ea] relative shrink-0 w-[375px]" data-name="SheetHeader">
        <div aria-hidden className="absolute border-[rgba(208,208,208,0.4)] border-b border-solid inset-0 pointer-events-none" />
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between pb-[13px] pt-[12px] px-[16px] relative size-full">
          <div className="bg-white relative rounded-[9999px] shrink-0 size-[30px]" data-name="Button">
            <div aria-hidden className="absolute border border-[rgba(255,255,255,0)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center p-[13px] relative size-full">
              <div className="relative shrink-0 size-[20px]" data-name="x">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
                  <div className="absolute inset-1/4" data-name="Vector">
                    <div className="absolute inset-[-6.67%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.3333 11.3333">
                        <path d={svgPaths.pc84b800} id="Vector" stroke="var(--stroke-0, #1B1B1B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="[word-break:break-word] flex-[1_0_0] font-['GT_Walsheim_LC:Bold',sans-serif] leading-none min-w-px not-italic relative text-[#1b1b1b] text-[16px] text-center tracking-[-0.8px]">New Invoice</p>
          <Frame4 />
        </div>
      </div>
      <Container />
      <div className="bg-white relative shrink-0 w-[375px]" data-name="ButtonDock">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start justify-center pt-[16px] relative size-full">
          <Container2 />
          <div className="h-[32px] relative shrink-0 w-[375px]" data-name="app-status-bar(lower)">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
              <div className="absolute inset-[65.63%_32%_18.75%_32.27%]" data-name="Bar">
                <div className="absolute bg-black inset-0 rounded-[10px]" data-name="Base" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}