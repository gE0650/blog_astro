export interface FriendLinkItem {
  name: string;
  description: string;
  href: string;
  avatarSrc: string;
}

export interface LostLinkItem {
  name: string;
  description: string;
  href: string;
}

export interface LinkApplyOwner {
  name: string;
  description: string;
  href: string;
  avatarSrc: string;
}

export const linkApplyOwner = {
  name: "gE",
  description: "gE 的个人博客。",
  href: "https://0-range.cn",
  avatarSrc: "https://0-range.cn/avatar.png",
} satisfies LinkApplyOwner;

export const friendLinks = [
  {
    name: "BillFeng",
    description: "在星夜尽头，遇见另一盏灯",
    href: "https://bfyes.github.io/",
    avatarSrc: "https://avatars.githubusercontent.com/u/233542744?v=4",
  },

] satisfies readonly FriendLinkItem[];

export const lostLinks = [
] satisfies readonly LostLinkItem[];
