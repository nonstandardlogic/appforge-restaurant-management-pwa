export type Role = 'gestionnaire' | 'staff';

export interface Feature {
  id: string;
  label: string;
  access: Record<Role, boolean>;
}

export const RBAC_MATRIX: Feature[] = [
  { id: 'F1', label: 'Tableau de bord opérationnel', access: { gestionnaire: true, staff: true } },
  { id: 'F2', label: 'Tableau de bord financier (CA, trésorerie, MB%)', access: { gestionnaire: true, staff: false } },
  { id: 'F3', label: 'KPIs financiers & rapports', access: { gestionnaire: true, staff: false } },
  { id: 'F4', label: 'Gestion des fournisseurs', access: { gestionnaire: true, staff: false } },
  { id: 'F5', label: 'Planning du personnel', access: { gestionnaire: true, staff: true } },
  { id: 'F6', label: 'Alertes & notifications automatiques', access: { gestionnaire: true, staff: true } },
  { id: 'F7', label: 'Commandes & réapprovisionnement', access: { gestionnaire: true, staff: true } },
  { id: 'F8', label: 'Gestion des utilisateurs (S9)', access: { gestionnaire: true, staff: false } },
  { id: 'F9', label: 'Matrice des permissions RBAC (S8)', access: { gestionnaire: true, staff: false } },
];

export const ROLES: Role[] = ['gestionnaire', 'staff'];

export function hasAccess(role: Role, featureId: string): boolean {
  const feature = RBAC_MATRIX.find((f) => f.id === featureId);
  return feature ? feature.access[role] : false;
}
