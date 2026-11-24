/**
 * VOLET 14 (24/11/2026) — Variante légère 640 px du capture desktop
 * AFRIBAYIT.
 *
 * Le mockup NAVIGATEUR du hero passe de MR STEVE ENGLISH au même
 * projet que le mockup TÉLÉPHONE (AFRIBAYIT — demande de l'éditeur :
 * « le même site, le même mockup que le mockup téléphone […] la
 * version desktop du mockup téléphone »). Le candidat léger
 * (srcSmall 640w) manque pour ce projet : le pipeline du volet 8
 * (Lighthouse image-delivery) en exige un — le mockup navigateur du
 * hero s'affiche à 130-290 px CSS ; sans candidat petit, le mobile
 * téléchargeait la source 1440 px.
 *
 * Source : public/assets/projects/sources/raw-afribayit-desktop.png
 * (capture Playwright brute du site live, même pipeline que
 * mrsteveenglish-desktop-640.webp). Sortie WebP q82, 640 px de large.
 */
import sharp from "sharp";
import { statSync } from "node:fs";

const SRC = "public/assets/projects/sources/raw-afribayit-desktop.png";
const OUT = "public/assets/projects/afribayit-desktop-640.webp";

const meta = await sharp(SRC).metadata();
await sharp(SRC)
  .resize({ width: 640 })
  .webp({ quality: 82 })
  .toFile(OUT);

const outMeta = await sharp(OUT).metadata();
const ko = Math.round(statSync(OUT).size / 1024);
console.log(
  `OK : ${OUT} — source ${meta.width}×${meta.height} → ${outMeta.width}×${outMeta.height}, ${ko} Ko`
);
