"use client";

import { motion } from "motion/react";

const items = [
  { label: "Transport", value: 32, color: "#286f53", x: "7%", y: "20%" },
  { label: "Logement", value: 22, color: "#ff9f66", x: "66%", y: "9%" },
  { label: "Alimentation", value: 20, color: "#ef6cae", x: "44%", y: "54%" },
  { label: "Achats", value: 15, color: "#43b9c5", x: "10%", y: "68%" },
  { label: "Services", value: 11, color: "#8b95a7", x: "72%", y: "67%" },
];

export function HeroVisual() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[680px] overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--card)] shadow-[0_35px_100px_rgba(30,27,54,.08)] lg:h-[500px]">
      <div className="soft-grid absolute inset-0" />
      <div className="absolute left-7 top-7 z-10">
        <p className="eyebrow">Exemple de bilan</p>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Composition annuelle illustrative
        </p>
      </div>
      <div className="absolute right-7 top-7 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-[11px] font-medium text-[var(--muted-foreground)]">
        <span className="size-1.5 rounded-full bg-[var(--accent)]" /> Données
        d’exemple
      </div>
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="var(--accent)" stopOpacity=".25" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity=".03" />
          </linearGradient>
        </defs>
        <path
          d="M340 245 C270 180 235 178 150 170 M340 245 C430 190 475 160 520 145 M340 245 C310 300 290 335 270 360 M340 245 C410 270 475 315 525 350"
          fill="none"
          stroke="url(#fade)"
          strokeWidth="1.5"
          strokeDasharray="4 7"
        />
      </svg>
      <motion.div
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-1/2 top-1/2 z-20 grid size-[150px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[var(--border)] bg-[color:var(--background)/.92] shadow-[0_25px_60px_rgba(44,36,95,.15)] backdrop-blur-xl lg:size-[174px]"
      >
        <div className="text-center">
          <p className="number-tabular text-[42px] font-semibold leading-none tracking-[-.07em] lg:text-[50px]">
            8,4
          </p>
          <p className="mt-2 text-xs font-semibold">t CO₂e / an</p>
          <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
            EXEMPLE
          </p>
        </div>
      </motion.div>
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          style={{ left: item.x, top: item.y }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 + index * 0.08, duration: 0.5 }}
          className="absolute z-20 w-[118px] rounded-2xl border border-[var(--border)] bg-[color:var(--card)/.88] p-3 shadow-sm backdrop-blur-md lg:w-[132px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium">{item.label}</span>
            <span
              className="size-2 rounded-full"
              style={{ background: item.color }}
            />
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--surface)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.value * 2.4}%` }}
              transition={{ delay: 0.6 + index * 0.08, duration: 0.8 }}
              className="h-full rounded-full"
              style={{ background: item.color }}
            />
          </div>
          <p className="mt-2 font-mono text-[10px] text-[var(--muted-foreground)]">
            {item.value}% du total
          </p>
        </motion.div>
      ))}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-[11px] text-[var(--muted-foreground)] shadow-sm">
        Survolez une source pour comprendre son impact
      </div>
    </div>
  );
}
