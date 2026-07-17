import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { extractErrorMessages } from '../../lib/errors';

interface AdminRow {
  id: string;
  email: string;
  fullName: string;
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'SUSPENDED';
  daysRemaining: number | null;
  organization: { name: string; trackingMode: string };
}

const statusLabels: Record<AdminRow['status'], string> = {
  ACTIVE: 'Actif',
  TRIAL: "En essai",
  EXPIRED: 'Expiré',
  SUSPENDED: 'Suspendu',
};

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function loadAdmins() {
    const { data } = await api.get<AdminRow[]>('/admins');
    setAdmins(data);
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormErrors([]);
    setSubmitting(true);
    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    try {
      await api.post('/admins', {
        email: form.get('email'),
        password: form.get('password'),
        fullName: form.get('fullName'),
        organizationName: form.get('organizationName'),
        trackingMode: form.get('trackingMode'),
        trialDurationDays: Number(form.get('trialDurationDays')),
      });
      setShowForm(false);
      formEl.reset();
      await loadAdmins();
    } catch (err) {
      setFormErrors(extractErrorMessages(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function extendTrial(id: string) {
    const days = prompt("Nombre de jours à ajouter à l'essai ?", '7');
    if (!days) return;
    setPageError(null);
    try {
      await api.patch(`/trials/${id}/extend`, { additionalDays: Number(days) });
      await loadAdmins();
    } catch (err) {
      setPageError(extractErrorMessages(err).join(' '));
    }
  }

  async function suspend(id: string) {
    setPageError(null);
    try {
      await api.patch(`/admins/${id}/suspend`);
      await loadAdmins();
    } catch (err) {
      setPageError(extractErrorMessages(err).join(' '));
    }
  }

  async function reactivate(id: string) {
    setPageError(null);
    try {
      await api.patch(`/admins/${id}/reactivate`);
      await loadAdmins();
    } catch (err) {
      setPageError(extractErrorMessages(err).join(' '));
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Super Admin — {user?.fullName}</h1>
        <button onClick={logout} className="text-sm text-gray-500 hover:underline">
          Déconnexion
        </button>
      </div>

      {pageError && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{pageError}</div>
      )}

      <button
        onClick={() => {
          setShowForm((v) => !v);
          setFormErrors([]);
        }}
        className="mb-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        {showForm ? 'Annuler' : '+ Nouvel administrateur'}
      </button>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 grid grid-cols-2 gap-3 rounded-lg bg-white p-4 shadow">
          {formErrors.length > 0 && (
            <ul className="col-span-2 list-inside list-disc rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {formErrors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          )}

          <input name="fullName" placeholder="Nom complet" required minLength={2} className="rounded border px-3 py-2" />
          <input name="email" type="email" placeholder="Email" required className="rounded border px-3 py-2" />
          <div>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe"
                required
                minLength={8}
                className="w-full rounded border px-3 py-2 pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-2 text-xs text-gray-500 hover:text-gray-700"
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">8 caractères minimum.</p>
          </div>
          <input
            name="organizationName"
            placeholder="Nom de l'organisation"
            required
            minLength={2}
            className="rounded border px-3 py-2"
          />
          <select name="trackingMode" className="rounded border px-3 py-2" defaultValue="PARCEL">
            <option value="PARCEL">Colis</option>
            <option value="GPS">GPS</option>
            <option value="BOTH">Les deux</option>
          </select>
          <div>
            <input
              name="trialDurationDays"
              type="number"
              defaultValue={14}
              min={1}
              max={365}
              required
              className="w-full rounded border px-3 py-2"
            />
            <p className="mt-1 text-xs text-gray-500">Durée de l'essai en jours.</p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="col-span-2 rounded bg-green-600 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Création…' : 'Créer'}
          </button>
        </form>
      )}

      <table className="w-full overflow-hidden rounded-lg bg-white shadow">
        <thead className="bg-gray-100 text-left text-sm">
          <tr>
            <th className="p-3">Nom</th>
            <th className="p-3">Email</th>
            <th className="p-3">Organisation</th>
            <th className="p-3">Statut</th>
            <th className="p-3">Jours restants</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {admins.map((a) => (
            <tr key={a.id} className="border-t">
              <td className="p-3">{a.fullName}</td>
              <td className="p-3">{a.email}</td>
              <td className="p-3">{a.organization?.name}</td>
              <td className="p-3">{statusLabels[a.status]}</td>
              <td className="p-3">{a.daysRemaining ?? '—'}</td>
              <td className="space-x-2 p-3">
                <button onClick={() => extendTrial(a.id)} className="text-blue-600 hover:underline">
                  Prolonger
                </button>
                {a.status === 'SUSPENDED' ? (
                  <button onClick={() => reactivate(a.id)} className="text-green-600 hover:underline">
                    Réactiver
                  </button>
                ) : (
                  <button onClick={() => suspend(a.id)} className="text-red-600 hover:underline">
                    Suspendre
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
