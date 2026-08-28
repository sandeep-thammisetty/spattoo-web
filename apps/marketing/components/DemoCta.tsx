"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import DemoModal from "./DemoModal";

// "Request a demo" — the button, and the modal it owns.
//
// A component rather than state lifted into whichever section wants one, so the button can be
// dropped into the hero, the pricing block or the nav without any of them learning what a modal is.
// That is the same shape as StartCta, deliberately.
//
// ⚠️ NOT gated on SHOW_SIGNIN, and that is the difference from StartCta. That flag hides the signup
// CTAs until the baker app is live, because sending someone to a signup that does not exist wastes
// their click. A demo request has the opposite logic: it is most valuable exactly when there is
// nothing to sign up for yet, because talking to those people is how the launch gets its first
// bakeries.
export default function DemoCta({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} style={style}>
        {children}
      </button>
      {open && <DemoModal onClose={() => setOpen(false)} />}
    </>
  );
}
