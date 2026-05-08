import clsx from 'clsx';
import type { LogoVariant } from '@/lib/types';

interface Props {
  variant: LogoVariant;
  className?: string;
  size?: number;
  /** When true, renders just the mark (no green badge) — for use on coloured backgrounds. */
  plain?: boolean;
}

export function LogoMark({ variant, className, size = 32, plain = false }: Props) {
  const inner = MARKS[variant];
  if (plain) {
    return (
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        className={clsx(className, 'text-brand-600')}
        aria-hidden="true"
      >
        {inner}
      </svg>
    );
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-xl bg-brand-600 text-white shrink-0',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" width={size * 0.7} height={size * 0.7}>
        {inner}
      </svg>
    </span>
  );
}

// Each mark renders inside a 32×32 viewBox using currentColor (white inside the green badge).
const MARKS: Record<LogoVariant, React.ReactNode> = {
  // 1. Spark-tick — checkmark with an AI sparkle in the upper right
  spark: (
    <>
      <path
        d="M8 17 L14 23 L24 10"
        stroke="currentColor"
        strokeWidth={3.2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 5 L25 8 L28 9 L25 10 L24 13 L23 10 L20 9 L23 8 Z"
        fill="currentColor"
      />
    </>
  ),

  // 2. Listening waves — three arcs opening leftward, fading + a check on the right
  waves: (
    <>
      <path
        d="M11 9 Q6 16 11 23"
        stroke="currentColor"
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M16 11 Q12 16 16 21"
        stroke="currentColor"
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
        opacity={0.6}
      />
      <path
        d="M21 13 Q19 16 21 19"
        stroke="currentColor"
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
        opacity={0.35}
      />
      <path
        d="M22 17 L25 20 L29 13"
        stroke="currentColor"
        strokeWidth={2.8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),

  // 3. A + spark — bold uppercase A with a small AI spark dot inside
  'a-spark': (
    <>
      <path
        d="M7 25 L16 7 L25 25"
        stroke="currentColor"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 19 L21 19"
        stroke="currentColor"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      {/* spark sitting above the apex */}
      <path
        d="M16 3 L16.6 5 L18.6 5.6 L16.6 6.2 L16 8.2 L15.4 6.2 L13.4 5.6 L15.4 5 Z"
        fill="currentColor"
      />
    </>
  ),
};

export const VARIANT_LABEL: Record<LogoVariant, string> = {
  spark: 'Spark-tick',
  waves: 'Listening waves',
  'a-spark': 'A + spark',
};

export const VARIANT_DESCRIPTION: Record<LogoVariant, string> = {
  spark: 'Quality check with an AI sparkle accent.',
  waves: 'Listening signal that resolves into a tick.',
  'a-spark': "Wordmark-friendly 'A' with a small AI spark.",
};
