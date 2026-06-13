export interface BreakEvenInput {
  chargesFixees: number;
  chargesVariables: number;
  caHT: number;
  proportionFood: number;
}

export interface BreakEvenResult {
  seuilRentabilite: number;
  tauxMargeCoutsVariables: number;
  tvaEffective: number;
  labelCCNHCR: string;
}

export function computeBreakEven(input: BreakEvenInput): BreakEvenResult {
  const { chargesFixees, chargesVariables, caHT, proportionFood } = input;
  const tvaEffective = Number((proportionFood * 0.10 + (1 - proportionFood) * 0.20).toFixed(4));
  const label = 'CCN HCR — 39h/semaine';

  if (caHT <= 0 || chargesVariables >= caHT) {
    return { seuilRentabilite: 0, tauxMargeCoutsVariables: 0, tvaEffective, labelCCNHCR: label };
  }

  const tmcv = Number((1 - chargesVariables / caHT).toFixed(4));
  const seuil = Number((chargesFixees / tmcv).toFixed(2));

  return { seuilRentabilite: seuil, tauxMargeCoutsVariables: tmcv, tvaEffective, labelCCNHCR: label };
}
