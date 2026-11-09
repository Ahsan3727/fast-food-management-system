import type { BoardChrome } from '@/lib/chooseLayout';

/**
 * Read the board's fixed pixels from the stylesheet (custom properties on the
 * board area plus its real padding), so chooseLayout's estimate cannot drift
 * from what the CSS draws. Missing or unparsable values are simply left out,
 * which makes chooseLayout use its defaults.
 */
export function readBoardChrome(el: HTMLElement | null): Partial<BoardChrome> {
  if (!el || typeof getComputedStyle !== 'function') return {};
  const cs = getComputedStyle(el);
  const out: Partial<BoardChrome> = {};

  const header = parseFloat(cs.getPropertyValue('--board-cat-h'));
  const gap    = parseFloat(cs.getPropertyValue('--board-gap'));
  if (Number.isFinite(header)) out.catHeaderH = header;
  if (Number.isFinite(gap))    out.gap = gap;

  const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  if (Number.isFinite(padY)) out.padY = padY;
  return out;
}
