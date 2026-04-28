// ─── Kroger-Owned Grocery Banners ───
//
// All chains owned by The Kroger Co. that share product catalogs and
// loyalty card systems. Auto Scan price checks work for any of these stores
// because they all share the Kroger Plus Card and the Kroger Developer API.
//
// The `chainCode` is what the Kroger API expects in filter.chain queries.

export interface KrogerFamilyChain {
  storeId: string;       // CartKey internal store ID
  chainCode: string;     // Kroger API chain identifier
  refundWindowDays: number;
}

export const KROGER_FAMILY: KrogerFamilyChain[] = [
  { storeId: 'kroger',       chainCode: 'KROGER',         refundWindowDays: 14 },
  { storeId: 'harristeeter', chainCode: 'HARRIS_TEETER',  refundWindowDays: 14 },
  { storeId: 'fredmeyer',    chainCode: 'FRED_MEYER',     refundWindowDays: 14 },
  { storeId: 'ralphs',       chainCode: 'RALPHS',         refundWindowDays: 14 },
  { storeId: 'kingsoopers',  chainCode: 'KING_SOOPERS',   refundWindowDays: 14 },
  { storeId: 'frys',         chainCode: 'FRYS',           refundWindowDays: 14 },
  { storeId: 'smiths',       chainCode: 'SMITHS',         refundWindowDays: 14 },
  { storeId: 'qfc',          chainCode: 'QFC',            refundWindowDays: 14 },
  { storeId: 'marianos',     chainCode: 'MARIANOS',       refundWindowDays: 14 },
  { storeId: 'pickn',        chainCode: 'PICK_N_SAVE',    refundWindowDays: 14 },
  { storeId: 'metromarket',  chainCode: 'METRO_MARKET',   refundWindowDays: 14 },
  { storeId: 'baker',        chainCode: 'BAKERS',         refundWindowDays: 14 },
  { storeId: 'gerbes',       chainCode: 'GERBES',         refundWindowDays: 14 },
  { storeId: 'ownersmarket', chainCode: 'OWENS_MARKET',   refundWindowDays: 14 },
  { storeId: 'paylesssm',    chainCode: 'PAY_LESS',       refundWindowDays: 14 },
  { storeId: 'dillons',      chainCode: 'DILLONS',        refundWindowDays: 14 },
  { storeId: 'jaycfoods',    chainCode: 'JAY_C',          refundWindowDays: 14 },
  { storeId: 'foodsco',      chainCode: 'FOODS_CO',       refundWindowDays: 14 },
  { storeId: 'citymarket',   chainCode: 'CITY_MARKET',    refundWindowDays: 14 },
];

const KROGER_FAMILY_IDS = new Set(KROGER_FAMILY.map((c) => c.storeId));

export function isKrogerFamily(storeId: string): boolean {
  return KROGER_FAMILY_IDS.has(storeId);
}

export function getKrogerChainCode(storeId: string): string | null {
  return KROGER_FAMILY.find((c) => c.storeId === storeId)?.chainCode || null;
}

export function getKrogerFamilyStoreIds(): string[] {
  return KROGER_FAMILY.map((c) => c.storeId);
}
