import type { Metadata } from "next";
import LegalDocPage from "@/components/LegalDocPage";
import { getLegalDoc } from "@/lib/legal";

export const dynamic = "force-static";

const doc = getLegalDoc("terms")!;
export const metadata: Metadata = {
  title: `${doc.title} — Spattoo`,
  description: doc.description,
};

export default function Page() {
  return <LegalDocPage slug="terms" />;
}
