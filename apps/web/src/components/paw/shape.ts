/** 肉球のSVG。指が上を向いている。 */
export function pawSvg(size: number): string {
  return `<svg viewBox="0 0 32 32" width="${String(size)}" height="${String(size)}" fill="currentColor" aria-hidden="true"><ellipse cx="16" cy="21.5" rx="7.2" ry="6"/><ellipse cx="6.5" cy="13" rx="2.9" ry="3.6" transform="rotate(-18 6.5 13)"/><ellipse cx="12.3" cy="7.6" rx="2.9" ry="3.7" transform="rotate(-6 12.3 7.6)"/><ellipse cx="19.7" cy="7.6" rx="2.9" ry="3.7" transform="rotate(6 19.7 7.6)"/><ellipse cx="25.5" cy="13" rx="2.9" ry="3.6" transform="rotate(18 25.5 13)"/></svg>`;
}
