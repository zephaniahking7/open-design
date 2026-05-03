import type { CSSProperties } from 'react';

/**
 * Bonanza Cr8tives wordmark — launch-safe, text-set.
 *
 * Replaces the Stage 2 hand-rolled "Brixton Hand" geometry with a
 * clean two-line wordmark set in Satoshi 900 (the same UI typeface
 * used everywhere else on the landing). Single source of truth: the
 * Wordmark component. All consumers (Header, Footer, VisionInput
 * maker's mark, 404 surface) inherit automatically.
 *
 * Layout:
 *   BONANZA          (line 1, 56px, letter-spacing 1.5)
 *   CR8TIVES         (line 2, 56px, letter-spacing 1.5)
 *
 * The SVG uses currentColor so the mark inherits its colour from the
 * parent (white on the dark landing, pink on the focused-state, etc).
 * preserveAspectRatio is xMinYMid so the mark left-aligns inside its
 * box regardless of the consumer's height.
 *
 * Monogram: a single uppercase B in the same typeface inside a
 * 64×64 viewBox, optically centred.
 */

const FONT_STACK =
  "Satoshi, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const SVG_STYLE = 'height:100%;width:auto;display:block';

const WORDMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 132" role="img" aria-label="Bonanza Cr8tives" preserveAspectRatio="xMinYMid meet" style="${SVG_STYLE}"><title>Bonanza Cr8tives</title><text x="0" y="50" font-family="${FONT_STACK}" font-weight="900" font-size="56" letter-spacing="1.5" fill="currentColor">BONANZA</text><text x="0" y="120" font-family="${FONT_STACK}" font-weight="900" font-size="56" letter-spacing="1.5" fill="currentColor">CR8TIVES</text></svg>`;

const MONOGRAM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="B" preserveAspectRatio="xMidYMid meet" style="${SVG_STYLE}"><title>Bonanza monogram</title><text x="32" y="50" text-anchor="middle" font-family="${FONT_STACK}" font-weight="900" font-size="56" fill="currentColor">B</text></svg>`;

export type WordmarkVariant = 'full' | 'mark';

interface WordmarkProps {
  variant?: WordmarkVariant;
  className?: string;
  height?: number | string;
  ariaLabel?: string;
}

export function Wordmark({
  variant = 'full',
  className,
  height,
  ariaLabel,
}: WordmarkProps) {
  const html = variant === 'mark' ? MONOGRAM_SVG : WORDMARK_SVG;
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    color: 'currentColor',
    lineHeight: 0,
  };
  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }
  return (
    <span
      className={className}
      style={style}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
