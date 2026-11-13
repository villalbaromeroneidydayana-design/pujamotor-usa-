import React from "react";
import Link from "next/link";

interface CorporateLogoProps {
  variant?: "full" | "compact" | "icon-only";
  size?: "sm" | "md" | "lg";
  withLink?: boolean;
  className?: string;
  theme?: "dark" | "light";
}

export function CorporateLogo({
  variant = "full",
  size = "md",
  withLink = true,
  className = "",
  theme = "dark",
}: CorporateLogoProps) {
  const iconSizes = {
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-14 w-14",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
  };

  const subtextSizes = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
  };

  const isLight = theme === "light";

  const Content = (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblema Oficial PUJAMOTOR USA Sin Fondo */}
      <div
        className={`relative flex items-center justify-center shrink-0 drop-shadow-[0_4px_14px_rgba(6,182,212,0.3)] transition-transform duration-300 group-hover:scale-105 ${iconSizes[size]}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/pujamotor-emblem-transparent.png"
          alt="PUJAMOTOR USA Emblema"
          className="h-full w-full object-contain pointer-events-none"
        />
      </div>

      {/* Logotipo Tipográfico PUJAMOTOR USA */}
      {variant !== "icon-only" && (
        <div className="flex flex-col leading-tight">
          <div className={`font-black tracking-tight flex items-center gap-1.5 ${textSizes[size]}`}>
            <span className={isLight ? "text-zinc-950" : "text-white"}>PUJAMOTOR</span>
            <span className="text-cyan-400 font-extrabold tracking-wider border-b-2 border-orange-500 pb-0.5">
              USA
            </span>
          </div>

          {variant === "full" && (
            <div className={`font-mono font-medium tracking-wider uppercase flex items-center gap-1.5 mt-0.5 ${subtextSizes[size]} ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
              <span className="text-cyan-400 font-semibold">BROKER</span>
              <span className="text-zinc-600">·</span>
              <span>BÚSQUEDA</span>
              <span className="text-orange-400">·</span>
              <span className="text-zinc-300">SUBASTAS</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (withLink) {
    return (
      <Link href="/" className="inline-flex items-center group transition-transform active:scale-95">
        {Content}
      </Link>
    );
  }

  return Content;
}
