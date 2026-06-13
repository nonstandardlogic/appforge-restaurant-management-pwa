export const MARGIN_CATEGORIES = [
  'Boissons non-alcoolisées',
  'Vins et spiritueux',
  'Viandes et poissons',
  'Épicerie et produits frais',
  'Autres',
] as const;

export interface CategoryInput {
  name: string;
  ca: number;
  openingStock: number;
  purchases: number;
  closingStock: number;
}

export interface CategoryResult {
  name: string;
  ca: number;
  costOfGoods: number;
  margebrute: number;
  color: 'green' | 'orange' | 'red';
}

export interface MarginReport {
  categories: CategoryResult[];
  totalCA: number;
  totalCostOfGoods: number;
  globalMarge: number;
  globalColor: 'green' | 'orange' | 'red';
}

function colorCode(mb: number): 'green' | 'orange' | 'red' {
  if (mb >= 30) return 'green';
  if (mb >= 20) return 'orange';
  return 'red';
}

export function computeCategoryMargin(input: CategoryInput): CategoryResult {
  const costOfGoods = input.openingStock + input.purchases - input.closingStock;
  const margebrute = input.ca > 0
    ? Number(((input.ca - costOfGoods) / input.ca * 100).toFixed(2))
    : 0;
  return { name: input.name, ca: input.ca, costOfGoods: Number(costOfGoods.toFixed(2)), margebrute, color: colorCode(margebrute) };
}

export function computeGrossMargins(inputs: CategoryInput[]): MarginReport {
  const categories = inputs.map(computeCategoryMargin);
  const totalCA = Number(categories.reduce((s, r) => s + r.ca, 0).toFixed(2));
  const totalCostOfGoods = Number(categories.reduce((s, r) => s + r.costOfGoods, 0).toFixed(2));
  const globalMarge = totalCA > 0
    ? Number(((totalCA - totalCostOfGoods) / totalCA * 100).toFixed(2))
    : 0;
  return { categories, totalCA, totalCostOfGoods, globalMarge, globalColor: colorCode(globalMarge) };
}
