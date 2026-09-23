// Typed static imports for hero image fills, keyed by role.
// Sources are the sha256-named files recorded in public/assets/manifest.json
// and cross-referenced against design/sections.json's hero.assets list.
// Static import lets Next.js content-hash and cache these forever; the
// width/height below are the manifest's native pixel dimensions, passed
// through explicitly to next/image per the T6 interface contract.
//
// Icon marks (nav logo, eyebrow "About Soniq" icon, stat-card icon) and the
// trusted-avatars set each have a separate desktop/mobile export in the
// manifest (different sha256 per breakpoint). This file intentionally wires
// up only the desktop variant for those and lets CSS scale it down for
// mobile, rather than rendering both and toggling visibility with
// `hidden`/`md:hidden`: these icon SVGs carry an inner-shadow <filter>, and
// calling `.decode()` on a `display:none` instance of one of them crashes
// the Chromium renderer used by scripts/measure.mjs (reproduced locally —
// visible instances decode fine, the `display:none` sibling reliably
// crashes the page). Rendering one visible element per icon avoids the
// crash and the duplicate fetch.

import heroBackgroundPhotoSrc from "../../public/assets/141ed5a52e94bc09de7c21540d2f7831bfd5eebe64afa9b194ae75706951c568.png";

import partnerLogoImpetusysSrc from "../../public/assets/8a15046e8d70deec612098004443622184d40b3b2da654b0b3cdc81740b94494.png";
import partnerLogoGalileoSrc from "../../public/assets/c8603a61bd5046b63954f1a32a2367732d8c11c7482e7c4d331bb8323d021e9e.png";
import partnerLogoEuphoriaSrc from "../../public/assets/46b4402c9cc22e430fbd9277d8d59c2c6deacb80d12b4dbfcd0034b6a716519c.png";
import partnerLogoEuropaSrc from "../../public/assets/ac9b22c61394639e191199ad9ae8930978c3b7f7f38587085eea0c22cdc81ea7.png";
import partnerLogoGlobalBankSrc from "../../public/assets/d4e88d8437859e346a45806ee2859478ba21a0ce02c66d4511c3b68931a39ecf.png";
import partnerLogoIdfadilLabsSrc from "../../public/assets/e01aa722b991a4c9dc27fb87fbe7bb1b33ecd604869ebe6d027bc21701ec330f.png";

import avatarOneSrc from "../../public/assets/35ff83ac9e7668d0c69b331e610b7274bfffc990f8c36611fbd2706f1ef754db.png";
import avatarTwoSrc from "../../public/assets/ee68d43f8729f75ad34c6786432d4db57323fcc49b375ece911e6b8bc7a40bcf.png";
import avatarThreeSrc from "../../public/assets/961f69a6bf8764530487fa26a736a36a29317cecb883950e7098fa76917fd9a9.png";

import ratingCardPhotoSrc from "../../public/assets/b85f579ecd750a673bb68639f5fd95af5348dac3818e67b01fef5b0fc0acef64.jpg";

import navLogoMarkSrc from "../../public/assets/131fb59a7b8d9b9394d4c84f7a7b1b6b96512392b3b46796b6e6589e0bf66756.svg";
import eyebrowIconSrc from "../../public/assets/a5d598f0fc05d8a497e2c4a772c3f7e6e2c2a97eec5fdc4cc283e2b00efd98f0.svg";
import avatarPlusIconSrc from "../../public/assets/d91c923b71d4aa7686f4c9c281ae7489793904bdac11e107873a9b08b92f44c5.svg";
import statIconSrc from "../../public/assets/100265fa9c53d094bdb9894f15ba188daeffdd8563aeca5b29490a471280d298.svg";

import type { StaticImageData } from "next/image";

export type HeroAsset = {
  src: StaticImageData;
  width: number;
  height: number;
  alt: string;
};

// The single above-the-fold background photo. This is the LCP candidate for
// the hero — the only asset in this file that should be rendered with
// `priority` in Hero.tsx.
export const heroBackgroundPhoto: HeroAsset = {
  src: heroBackgroundPhotoSrc,
  width: 1200,
  height: 800,
  alt: "",
};

export const partnerLogos: (HeroAsset & { name: string })[] = [
  { name: "Impetusys", src: partnerLogoImpetusysSrc, width: 888, height: 192, alt: "Impetusys" },
  { name: "Galileo", src: partnerLogoGalileoSrc, width: 537, height: 192, alt: "Galileo" },
  { name: "Euphoria", src: partnerLogoEuphoriaSrc, width: 628, height: 192, alt: "Euphoria" },
  { name: "Europa", src: partnerLogoEuropaSrc, width: 568, height: 192, alt: "Europa" },
  { name: "GlobalBank", src: partnerLogoGlobalBankSrc, width: 772, height: 192, alt: "GlobalBank" },
  { name: "Idfadil Labs", src: partnerLogoIdfadilLabsSrc, width: 788, height: 192, alt: "Idfadil Labs" },
];

export const trustedAvatars: HeroAsset[] = [
  { src: avatarOneSrc, width: 112, height: 112, alt: "" },
  { src: avatarTwoSrc, width: 112, height: 112, alt: "" },
  { src: avatarThreeSrc, width: 112, height: 112, alt: "" },
];

export const ratingCardPhoto: HeroAsset = {
  src: ratingCardPhotoSrc,
  width: 2732,
  height: 4096,
  alt: "",
};

export const navLogoMark: HeroAsset = {
  src: navLogoMarkSrc,
  width: 40,
  height: 40,
  alt: "",
};

export const eyebrowIcon: HeroAsset = {
  src: eyebrowIconSrc,
  width: 23,
  height: 23,
  alt: "",
};

export const avatarPlusIcon: HeroAsset = {
  src: avatarPlusIconSrc,
  width: 14,
  height: 14,
  alt: "",
};

export const statIcon: HeroAsset = {
  src: statIconSrc,
  width: 25,
  height: 25,
  alt: "",
};
