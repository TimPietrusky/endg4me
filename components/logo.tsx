import { type SVGProps } from "react";
import { LOGO_VIEWBOX, LOGO_PATHS } from "@/lib/logo-svg";

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      fill="currentColor"
      className={className}
      aria-label="endg4me"
      {...props}
    >
      {LOGO_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
