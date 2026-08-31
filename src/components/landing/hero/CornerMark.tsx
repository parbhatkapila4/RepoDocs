import React from "react";
export function CornerMark({ className = "" }: { className?: string }) {
  return (
    <svg
      width="20"
      height="21"
      viewBox="0 0 20 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <g opacity="0.4">
        <path
          d="M-2.14598e-07 10.3189L8.31888 10.3189C9.14731 10.3189 9.81888 9.64731 9.81888 8.81888L9.81888 0.5"
          stroke="#C4C4B7"
          strokeWidth="1.125"
        />
      </g>
    </svg>
  );
}
