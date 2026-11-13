"use client";

import React from "react";

interface WatermarkProps {
  email?: string;
  role?: string;
}

export function WatermarkOverlay({ email, role }: WatermarkProps) {
  const displayEmail = email || "ASESOR_AUTORIZADO";
  const displayRole = role || "INTERNAL_STAFF";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 select-none overflow-hidden opacity-[0.035] dark:opacity-[0.045]"
    >
      <div className="absolute inset-0 flex flex-wrap content-around justify-around gap-16 -rotate-12 scale-125">
        {Array.from({ length: 48 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center font-mono text-[10px] uppercase font-bold tracking-widest text-white whitespace-nowrap"
          >
            <span>CONFIDENCIAL · PUJAMOTOR USA</span>
            <span>ASESOR: {displayEmail}</span>
            <span>ROL: {displayRole}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

