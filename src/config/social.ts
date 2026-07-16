import type { SocialLinkId, SocialLinkItem } from "../types/social";

export const socialLinks: readonly SocialLinkItem[] = [
] satisfies readonly SocialLinkItem[];

export const socialDisplay = {
  home: [],
  about: [],
} as const satisfies Record<string, readonly SocialLinkId[]>;
