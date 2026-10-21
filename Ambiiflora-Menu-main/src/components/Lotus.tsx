import { forwardRef } from "react";
import { LOTUS } from "@/lib/lotus";

/** The Ambiiflora lotus. Always solid black. */
const Lotus = forwardRef<SVGSVGElement, { className?: string; label?: string }>(function Lotus({ className, label }, ref) {
  return (
    <svg ref={ref} className={className} viewBox={`0 0 ${LOTUS.w} ${LOTUS.h}`} fill="#000" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      {LOTUS.paths.map((d, i) => <path key={i} d={d} data-petal="" />)}
    </svg>
  );
});
export default Lotus;
