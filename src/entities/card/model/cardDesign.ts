// Visual concepts carried over from AtlasPay, not live backend offerings.
export const cardDesigns = ['subscriptions', 'travel', 'premium'] as const;
export type CardDesign = (typeof cardDesigns)[number];
