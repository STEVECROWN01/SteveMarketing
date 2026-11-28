/**
 * VOLET 29 (28/11/2026) — GÉNÉRATEUR XLSX MINIMAL, SANS DÉPENDANCE.
 *
 * L'espace Prospects enregistre ses données dans le dépôt GitHub de
 * stockage sous la forme d'un CLASSEUR EXCEL mis à jour à chaque
 * import (demande de l'éditeur : « ça met à jour le fichier Excel
 * qui est dans le GitHub — on ne doit jamais perdre les données »).
 * Ce module écrit ce classeur à la main (Open XML dans un ZIP non
 * compressé) : une feuille, des cellules texte (inline) ou nombre,
 * des lignes d'en-tête en gras sur fond gris et des largeurs de
 * colonnes — tout ce qu'il faut, rien de plus.
 */

/* ----------------------------- CRC-32 ----------------------------- */

const TABLE_CRC = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(tampon: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < tampon.length; i++) {
    crc = TABLE_CRC[(crc ^ tampon[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/* --------------------------- ZIP (STORE) -------------------------- */

/** Un fichier du ZIP. */
type EntreeZip = { nom: string; contenu: Buffer };

/** Date ZIP fixe (2026-01-01) — le contenu, pas l'horodatage, compte. */
const DOS_TIME = 0;
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;

/** Écrit un nombre non signé en little-endian. */
function u16(v: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(v >>> 0, 0);
  return b;
}
function u32(v: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(v >>> 0, 0);
  return b;
}

/** Construit un ZIP (méthode STORE : aucune compression). */
function construireZip(entrees: EntreeZip[]): Buffer {
  const morceaux: Buffer[] = [];
  const centrales: Buffer[] = [];
  let offset = 0;
  for (const e of entrees) {
    const nom = Buffer.from(e.nom, "utf8");
    const crc = crc32(e.contenu);
    /* En-tête local : signature, version, drapeaux UTF-8 (0x0800),
       méthode 0 (store), date, CRC, tailles, nom. */
    const local = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(DOS_TIME),
      u16(DOS_DATE),
      u32(crc),
      u32(e.contenu.length),
      u32(e.contenu.length),
      u16(nom.length),
      u16(0),
      nom,
    ]);
    morceaux.push(local, e.contenu);
    /* Réperoire central : mêmes informations + offset du fichier. */
    const central = Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(DOS_TIME),
      u16(DOS_DATE),
      u32(crc),
      u32(e.contenu.length),
      u32(e.contenu.length),
      u16(nom.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nom,
    ]);
    centrales.push(central);
    offset += local.length + e.contenu.length;
  }
  const tailleCentrale = centrales.reduce((s, c) => s + c.length, 0);
  const fin = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entrees.length),
    u16(entrees.length),
    u32(tailleCentrale),
    u32(offset),
    u16(0),
  ]);
  return Buffer.concat([...morceaux, ...centrales, fin]);
}

/* --------------------------- Feuille XLSX ------------------------- */

/** Une cellule : texte (défaut), nombre, ou texte + style. */
export type CelluleXlsx = string | number | { v: string | number; gras?: boolean; fond?: boolean };

export type FeuilleXlsx = {
  /** Nom de la feuille (≤ 31 caractères). */
  nom: string;
  /** Les lignes ; la première sert d'en-tête (gras, fond gris). */
  lignes: CelluleXlsx[][];
  /** Largeurs de colonnes indicatives (caractères). */
  largeurs?: number[];
};

function echapperXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    /* caractères de contrôle interdits en XML : retirés */
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
}

/** Le libellé de colonne Excel (A, B…, AA, AB…) pour un index 0. */
function colonneLettre(i: number): string {
  let s = "";
  let n = i;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function celluleXml(ref: string, c: CelluleXlsx, enTete: boolean): string {
  const cell =
    typeof c === "object" && c !== null && "v" in c ? c : ({ v: c } as { v: string | number; gras?: boolean });
  const { v } = cell;
  const gras = (cell as { gras?: boolean }).gras ?? enTete;
  const fond = (cell as { fond?: boolean }).fond ?? enTete;
  const style = fond ? ' s="2"' : gras ? ' s="1"' : "";
  if (typeof v === "number" && Number.isFinite(v)) {
    return `<c r="${ref}"${style}><v>${v}</v></c>`;
  }
  const texte = echapperXml(String(v ?? ""));
  return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${texte}</t></is></c>`;
}

function feuilleXml(f: FeuilleXlsx): string {
  const lignes: string[] = [];
  f.lignes.forEach((ligne, indexLigne) => {
    const enTete = indexLigne === 0;
    const cells = ligne
      .map((c, i) => celluleXml(`${colonneLettre(i)}${indexLigne + 1}`, c, enTete))
      .join("");
    lignes.push(`<row r="${indexLigne + 1}">${cells}</row>`);
  });
  const cols = f.largeurs
    ? `<cols>${f.largeurs
        .map((l, i) => `<col min="${i + 1}" max="${i + 1}" width="${l}" customWidth="1"/>`)
        .join("")}</cols>`
    : "";
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    cols +
    `<sheetData>${lignes.join("")}</sheetData>` +
    `</worksheet>`
  );
}

/** Construit un classeur .xlsx (Buffer) — une feuille par entrée. */
export function genererXlsx(feuilles: FeuilleXlsx[]): Buffer {
  const noms = feuilles.map((f) => f.nom.replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Feuille");
  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    feuilles
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join("") +
    `</Types>`;

  const racineRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets>` +
    noms.map((n, i) => `<sheet name="${echapperXml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("") +
    `</sheets></workbook>`;

  const workbookRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    noms
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join("") +
    `<Relationship Id="rId${noms.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`;

  /* Styles : 0 = normal, 1 = gras, 2 = en-tête (gras + fond gris). */
  const styles =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
    `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8E8E8"/><bgColor indexed="64"/></patternFill></fill></fills>` +
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="3">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
    `<xf numFmtId="0" fontId="1" fillId="1" borderId="0" xfId="0" applyFont="1" applyFill="1"/>` +
    `</cellXfs>` +
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
    `</styleSheet>`;

  const entrees: EntreeZip[] = [
    { nom: "[Content_Types].xml", contenu: Buffer.from(contentTypes, "utf8") },
    { nom: "_rels/.rels", contenu: Buffer.from(racineRels, "utf8") },
    { nom: "xl/workbook.xml", contenu: Buffer.from(workbook, "utf8") },
    { nom: "xl/_rels/workbook.xml.rels", contenu: Buffer.from(workbookRels, "utf8") },
    { nom: "xl/styles.xml", contenu: Buffer.from(styles, "utf8") },
    ...feuilles.map((f, i) => ({
      nom: `xl/worksheets/sheet${i + 1}.xml`,
      contenu: Buffer.from(feuilleXml(f), "utf8"),
    })),
  ];
  return construireZip(entrees);
}
