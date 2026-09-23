// Single source of truth for section order and measured Figma heights.
// Generated from design/sections.json — do not hand-edit the numbers below
// without re-deriving them from that file.

export type SectionId =
  | "hero"
  | "transactions"
  | "features"
  | "habits"
  | "pricing"
  | "faq"
  | "footer";

export type SectionDefinition = {
  id: SectionId;
  desktopNodeId: string;
  mobileNodeId: string;
  desktopHeight: number;
  mobileHeight: number;
};

export const SECTIONS: SectionDefinition[] = [
  {
    id: "hero",
    desktopNodeId: "2655:708",
    mobileNodeId: "2672:686",
    desktopHeight: 1923,
    mobileHeight: 1951,
  },
  {
    id: "transactions",
    desktopNodeId: "2665:459",
    mobileNodeId: "2676:988",
    desktopHeight: 1326,
    mobileHeight: 1841,
  },
  {
    id: "features",
    desktopNodeId: "2655:959",
    mobileNodeId: "2676:1004",
    desktopHeight: 1238,
    mobileHeight: 849,
  },
  {
    id: "habits",
    desktopNodeId: "2655:978",
    mobileNodeId: "2676:1010",
    desktopHeight: 956,
    mobileHeight: 1042,
  },
  {
    id: "pricing",
    desktopNodeId: "2655:1039",
    mobileNodeId: "2676:1141",
    desktopHeight: 933,
    mobileHeight: 1370,
  },
  {
    id: "faq",
    desktopNodeId: "2655:1110",
    mobileNodeId: "2677:1262",
    desktopHeight: 859,
    mobileHeight: 868,
  },
  {
    id: "footer",
    desktopNodeId: "2655:1159",
    mobileNodeId: "2677:1369",
    desktopHeight: 554,
    mobileHeight: 550,
  },
];

export const PAGE_HEIGHT = {
  desktop: 7789,
  mobile: 8471,
} as const;

const desktopHeightSum = SECTIONS.reduce(
  (sum, section) => sum + section.desktopHeight,
  0,
);
const mobileHeightSum = SECTIONS.reduce(
  (sum, section) => sum + section.mobileHeight,
  0,
);

if (desktopHeightSum !== PAGE_HEIGHT.desktop) {
  throw new Error(
    `sections.ts: desktop section heights sum to ${desktopHeightSum}, expected PAGE_HEIGHT.desktop (${PAGE_HEIGHT.desktop})`,
  );
}

if (mobileHeightSum !== PAGE_HEIGHT.mobile) {
  throw new Error(
    `sections.ts: mobile section heights sum to ${mobileHeightSum}, expected PAGE_HEIGHT.mobile (${PAGE_HEIGHT.mobile})`,
  );
}
