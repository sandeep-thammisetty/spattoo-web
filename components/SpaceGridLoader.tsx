"use client";

import dynamic from "next/dynamic";

const SpaceGrid = dynamic(() => import("@/components/SpaceGrid"), { ssr: false });

export default function SpaceGridLoader() {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <SpaceGrid />
    </div>
  );
}
