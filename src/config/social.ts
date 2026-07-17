import type { SocialLinkId, SocialLinkItem } from "../types/social";

export const socialLinks: readonly SocialLinkItem[] = [
  {                                                                                                            
         id: "github",                    // 必填, 唯一标识                                                         
         icon: "github",                  // 图标名                                                                 
         name: "GitHub",                  // 显示名称                                                               
         href: "https://github.com/gE0650",                                                                         
         enabled: true,                   // 总开关                                                                 
  }, 
] satisfies readonly SocialLinkItem[];

export const socialDisplay = {
  home: ["github"],
  about: ["github"],
} as const satisfies Record<string, readonly SocialLinkId[]>;
