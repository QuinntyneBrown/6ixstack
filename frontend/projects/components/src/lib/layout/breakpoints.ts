/** Mirrors styles/_breakpoints.scss for CDK BreakpointObserver (L2-095). */
export const BREAKPOINTS = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
} as const;

export const mediaUp = (name: keyof typeof BREAKPOINTS) => `(min-width: ${BREAKPOINTS[name]}px)`;
