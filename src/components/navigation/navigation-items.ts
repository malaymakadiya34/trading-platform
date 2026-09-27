export type NavigationItem = {
  label: string;
  href: string;
  shortLabel?: string;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  { label: "Home", items: [{ label: "Dashboard", shortLabel: "Home", href: "/dashboard" }] },
  {
    label: "Market",
    items: [
      { label: "Market Movement", href: "/market-movement" },
      { label: "Sector Heatmap", href: "/sector-heatmap" },
      { label: "Index Mover", href: "/index-mover" },
    ],
  },
  {
    label: "Scanners",
    items: [
      { label: "BTST Scanner", href: "/btst-scanner" },
      { label: "Intraday Boosters", href: "/intraday-boosters" },
      { label: "15-Min Breakout", href: "/breakout-15m" },
    ],
  },
  {
    label: "Markets",
    items: [
      { label: "FII / DII", href: "/fii-dii" },
      { label: "Global Markets", href: "/global-markets" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Profile", href: "/profile" },
      { label: "User Settings", href: "/profile#settings" },
    ],
  },
];
