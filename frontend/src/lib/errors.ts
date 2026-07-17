import { isAxiosError } from 'axios';

export const fieldLabels: Record<string, string> = {
  email: 'Email',
  password: 'Mot de passe',
  fullName: 'Nom complet',
  organizationName: "Nom de l'organisation",
  trackingMode: 'Mode de tracking',
  trialDurationDays: "Durée d'essai",
  type: 'Type',
  label: 'Libellé',
  initialStatus: 'Statut initial',
  status: 'Statut',
};

/**
 * Traduit une erreur Axios (validation Zod, conflit, etc.) en messages
 * lisibles pour l'utilisateur, sans jamais planter en cas de forme inattendue.
 */
export function extractErrorMessages(err: unknown): string[] {
  if (!isAxiosError(err)) return ['Une erreur inattendue est survenue.'];

  const data = err.response?.data as
    | { message?: string | { fieldErrors?: Record<string, string[]>; formErrors?: string[] } }
    | undefined;

  if (!data?.message) return [err.message ?? 'Une erreur inattendue est survenue.'];

  if (typeof data.message === 'string') return [data.message];

  const messages: string[] = [];
  for (const [field, errors] of Object.entries(data.message.fieldErrors ?? {})) {
    const label = fieldLabels[field] ?? field;
    errors.forEach((e) => messages.push(`${label} : ${e}`));
  }
  (data.message.formErrors ?? []).forEach((e) => messages.push(e));

  return messages.length > 0 ? messages : ['Requête invalide.'];
}
