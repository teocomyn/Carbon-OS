"use client";

import NumberFlow, {
  continuous,
  type Format,
  type NumberFlowProps,
} from "@number-flow/react";
import * as RadixSlider from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const numberMotion = {
  opacityTiming: {
    duration: 180,
    easing: "ease-out",
  },
  transformTiming: {
    duration: 420,
    easing:
      "linear(0, 0.0033 0.8%, 0.0263 2.39%, 0.0896 4.77%, 0.4676 15.12%, 0.5688, 0.6553, 0.7274, 0.7862, 0.8336 31.04%, 0.8793, 0.9132 38.99%, 0.9421 43.77%, 0.9642 49.34%, 0.9796 55.71%, 0.9893 62.87%, 0.9952 71.62%, 0.9983 82.76%, 0.9996 99.47%)",
  },
} satisfies Pick<NumberFlowProps, "opacityTiming" | "transformTiming">;

export function AnimatedNumber(props: NumberFlowProps) {
  return (
    <NumberFlow
      willChange
      isolate
      plugins={[continuous]}
      {...numberMotion}
      {...props}
    />
  );
}

type SliderProps = RadixSlider.SliderProps & {
  locales?: Intl.LocalesArgument;
  valueFormat?: Format;
  valueText?: (value: number) => string;
};

export function Slider({
  value,
  className,
  locales = "fr-FR",
  valueFormat,
  valueText,
  ...props
}: SliderProps) {
  const currentValue = value?.[0] ?? props.defaultValue?.[0] ?? props.min ?? 0;
  const ariaLabel = props["aria-label"];

  return (
    <RadixSlider.Root
      {...props}
      value={value}
      className={cn(
        "carbon-slider group relative flex h-12 w-full touch-none select-none items-center data-disabled:cursor-not-allowed data-disabled:opacity-45",
        className,
      )}
    >
      <RadixSlider.Track className="relative h-2 grow overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)] shadow-[inset_0_1px_3px_rgba(0,0,0,.22)]">
        <RadixSlider.Range className="absolute h-full rounded-full bg-[var(--accent)] shadow-[0_0_18px_var(--accent-soft)]" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        aria-label={ariaLabel}
        aria-valuetext={valueText?.(currentValue)}
        className="relative block size-7 cursor-grab rounded-full border-2 border-[color:color-mix(in_srgb,var(--accent)_68%,white)] bg-[var(--accent)] shadow-[0_2px_8px_rgba(0,0,0,.28),0_0_0_5px_var(--accent-soft)] outline-none transition-[transform,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-[var(--positive)] focus-visible:ring-offset-3 focus-visible:ring-offset-[var(--card)] active:cursor-grabbing active:scale-95 data-disabled:cursor-not-allowed"
      >
        <span className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 translate-y-1 rounded-lg border border-[var(--border)] bg-[var(--foreground)] px-2.5 py-1.5 text-xs font-semibold text-[var(--background)] opacity-0 shadow-[0_8px_24px_rgba(0,0,0,.22)] transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-active:translate-y-0 group-active:opacity-100">
          <AnimatedNumber
            value={currentValue}
            locales={locales}
            format={valueFormat}
          />
          <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-r border-b border-[var(--border)] bg-[var(--foreground)]" />
        </span>
      </RadixSlider.Thumb>
    </RadixSlider.Root>
  );
}

export default Slider;
