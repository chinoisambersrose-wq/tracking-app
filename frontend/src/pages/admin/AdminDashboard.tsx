import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../../hooks/useAuth';
import { extractErrorMessages } from '../../lib/errors';
import { MapView, MapMarker } from '../../components/MapView';

interface TrackingItemMetadata {
  category?: string;
  weightKg?: number;
  declaredValue?: number;
  fragile?: boolean;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  description?: string;
  senderName?: string;
  senderPhone?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  plateNumber?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  driverName?: string;
  driverPhone?: string;
  carrier?: string;
  shipmentMode?: string;
  carrierReferenceNo?: string;
  paymentMode?: string;
  totalFreight?: number;
  originCity?: string;
  destinationCity?: string;
  expectedDeliveryDate?: string;
  pickupDate?: string;
  pickupTime?: string;
  departureTime?: string;
  comments?: string;
}

const SHIPMENT_MODES = ['Route', 'Maritime', 'Aérien'];
const PAYMENT_MODES = ['Virement bancaire', 'Paiement à la livraison', 'Carte bancaire', 'Espèces', 'Mobile money'];

interface TrackingItem {
  id: string;
  type: 'PARCEL' | 'VEHICLE';
  publicCode: string;
  label: string | null;
  currentStatus: string;
  assignedAgent: { id: string; fullName: string } | null;
  positions?: { latitude: number; longitude: number }[];
  metadata?: TrackingItemMetadata | null;
}

interface Agent {
  id: string;
  fullName: string;
  email: string;
}

const PARCEL_CATEGORIES = [
  'Électronique',
  'Vêtements',
  'Documents',
  'Alimentaire',
  'Animaux vivants',
  'Véhicule / pièces auto',
  'Meubles',
  'Produits fragiles',
  'Autre',
];

/**
 * Champs de métadonnées communs au formulaire de création et au formulaire
 * d'édition, pré-remplis via `defaults` si fournis. Les noms des champs
 * (`name=`) correspondent aux clés attendues par le backend (voir
 * backend/src/tracking-items/dto/tracking-item-metadata.schema.ts).
 */
/** Champs d'expédition communs (transporteur, mode, référence, dates...), affichés pour PARCEL et VEHICLE. */
function ShipmentFields({ defaults }: { defaults?: TrackingItemMetadata }) {
  return (
    <div className="space-y-2 border-t border-dashed pt-2">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Informations d'expédition</p>
      <div className="grid grid-cols-3 gap-2">
        <input name="carrier" defaultValue={defaults?.carrier} placeholder="Transporteur" className="rounded border px-2 py-1.5 text-sm" />
        <select name="shipmentMode" defaultValue={defaults?.shipmentMode ?? ''} className="rounded border px-2 py-1.5 text-sm">
          <option value="">Mode d'expédition…</option>
          {SHIPMENT_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input name="carrierReferenceNo" defaultValue={defaults?.carrierReferenceNo} placeholder="Référence transporteur" className="rounded border px-2 py-1.5 text-sm" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select name="paymentMode" defaultValue={defaults?.paymentMode ?? ''} className="rounded border px-2 py-1.5 text-sm">
          <option value="">Mode de paiement…</option>
          {PAYMENT_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          name="totalFreight"
          type="number"
          step="0.01"
          min={0}
          defaultValue={defaults?.totalFreight}
          placeholder="Frais totaux"
          className="rounded border px-2 py-1.5 text-sm"
        />
        <input name="expectedDeliveryDate" type="date" defaultValue={defaults?.expectedDeliveryDate} className="rounded border px-2 py-1.5 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input name="originCity" defaultValue={defaults?.originCity} placeholder="Ville d'origine" className="rounded border px-2 py-1.5 text-sm" />
        <input name="destinationCity" defaultValue={defaults?.destinationCity} placeholder="Ville de destination" className="rounded border px-2 py-1.5 text-sm" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input name="pickupDate" type="date" defaultValue={defaults?.pickupDate} className="rounded border px-2 py-1.5 text-sm" title="Date de ramassage" />
        <input name="pickupTime" type="time" defaultValue={defaults?.pickupTime} className="rounded border px-2 py-1.5 text-sm" title="Heure de ramassage" />
        <input name="departureTime" type="time" defaultValue={defaults?.departureTime} className="rounded border px-2 py-1.5 text-sm" title="Heure de départ" />
      </div>
      <textarea
        name="comments"
        defaultValue={defaults?.comments}
        placeholder="Commentaires / consignes de livraison (visible publiquement)"
        rows={2}
        className="w-full rounded border px-2 py-1.5 text-sm"
      />
    </div>
  );
}

function MetadataFields({ type, defaults }: { type: 'PARCEL' | 'VEHICLE'; defaults?: TrackingItemMetadata }) {
  if (type === 'VEHICLE') {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input name="plateNumber" defaultValue={defaults?.plateNumber} placeholder="Plaque d'immatriculation" className="rounded border px-2 py-1.5 text-sm" />
          <input name="vehicleModel" defaultValue={defaults?.vehicleModel} placeholder="Modèle" className="rounded border px-2 py-1.5 text-sm" />
          <input name="vehicleColor" defaultValue={defaults?.vehicleColor} placeholder="Couleur" className="rounded border px-2 py-1.5 text-sm" />
          <input name="driverName" defaultValue={defaults?.driverName} placeholder="Nom du chauffeur" className="rounded border px-2 py-1.5 text-sm" />
          <input name="driverPhone" defaultValue={defaults?.driverPhone} placeholder="Téléphone du chauffeur" className="rounded border px-2 py-1.5 text-sm" />
        </div>
        <ShipmentFields defaults={defaults} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <select name="category" defaultValue={defaults?.category ?? ''} className="rounded border px-2 py-1.5 text-sm">
          <option value="">Catégorie du colis…</option>
          {PARCEL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          name="weightKg"
          type="number"
          step="0.01"
          min={0}
          defaultValue={defaults?.weightKg}
          placeholder="Poids (kg)"
          className="rounded border px-2 py-1.5 text-sm"
        />
        <input
          name="declaredValue"
          type="number"
          step="0.01"
          min={0}
          defaultValue={defaults?.declaredValue}
          placeholder="Valeur déclarée"
          className="rounded border px-2 py-1.5 text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input name="lengthCm" type="number" step="0.1" min={0} defaultValue={defaults?.lengthCm} placeholder="Longueur (cm)" className="rounded border px-2 py-1.5 text-sm" />
        <input name="widthCm" type="number" step="0.1" min={0} defaultValue={defaults?.widthCm} placeholder="Largeur (cm)" className="rounded border px-2 py-1.5 text-sm" />
        <input name="heightCm" type="number" step="0.1" min={0} defaultValue={defaults?.heightCm} placeholder="Hauteur (cm)" className="rounded border px-2 py-1.5 text-sm" />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" name="fragile" defaultChecked={defaults?.fragile} />
        Colis fragile
      </label>
      <textarea
        name="description"
        defaultValue={defaults?.description}
        placeholder="Description du contenu"
        rows={2}
        className="w-full rounded border px-2 py-1.5 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <input name="senderName" defaultValue={defaults?.senderName} placeholder="Nom de l'expéditeur" className="rounded border px-2 py-1.5 text-sm" />
        <input name="senderPhone" defaultValue={defaults?.senderPhone} placeholder="Téléphone expéditeur" className="rounded border px-2 py-1.5 text-sm" />
        <input name="recipientName" defaultValue={defaults?.recipientName} placeholder="Nom du destinataire" className="rounded border px-2 py-1.5 text-sm" />
        <input name="recipientPhone" defaultValue={defaults?.recipientPhone} placeholder="Téléphone destinataire" className="rounded border px-2 py-1.5 text-sm" />
        <input
          name="recipientAddress"
          defaultValue={defaults?.recipientAddress}
          placeholder="Adresse de livraison"
          className="col-span-2 rounded border px-2 py-1.5 text-sm"
        />
      </div>
      <ShipmentFields defaults={defaults} />
    </div>
  );
}

/** Lit le formulaire et ne garde que les champs de métadonnées non vides. */
function readMetadataFromForm(form: FormData): TrackingItemMetadata {
  const metadata: TrackingItemMetadata = {};
  const str = (key: keyof TrackingItemMetadata) => {
    const v = form.get(key as string);
    if (v && String(v).trim() !== '') (metadata as any)[key] = String(v).trim();
  };
  const num = (key: keyof TrackingItemMetadata) => {
    const v = form.get(key as string);
    if (v !== null && String(v).trim() !== '') (metadata as any)[key] = Number(v);
  };

  str('category');
  num('weightKg');
  num('declaredValue');
  num('lengthCm');
  num('widthCm');
  num('heightCm');
  str('description');
  str('senderName');
  str('senderPhone');
  str('recipientName');
  str('recipientPhone');
  str('recipientAddress');
  str('plateNumber');
  str('vehicleModel');
  str('vehicleColor');
  str('driverName');
  str('driverPhone');
  str('carrier');
  str('shipmentMode');
  str('carrierReferenceNo');
  str('paymentMode');
  num('totalFreight');
  str('originCity');
  str('destinationCity');
  str('expectedDeliveryDate');
  str('pickupDate');
  str('pickupTime');
  str('departureTime');
  str('comments');
  metadata.fragile = form.get('fragile') === 'on';

  return metadata;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [newItemType, setNewItemType] = useState<'PARCEL' | 'VEHICLE'>('PARCEL');
  const [itemFormErrors, setItemFormErrors] = useState<string[]>([]);
  const [agentFormErrors, setAgentFormErrors] = useState<string[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [showAgentPassword, setShowAgentPassword] = useState(false);
  const [submittingAgent, setSubmittingAgent] = useState(false);
  const [submittingItem, setSubmittingItem] = useState(false);
  const [pickingItemId, setPickingItemId] = useState<string | null>(null);
  const [pendingPosition, setPendingPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [positionError, setPositionError] = useState<string | null>(null);
  const [submittingPosition, setSubmittingPosition] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormErrors, setEditFormErrors] = useState<string[]>([]);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  async function loadItems() {
    const { data } = await api.get<TrackingItem[]>('/tracking-items');
    setItems(data);
  }

  async function loadAgents() {
    const { data } = await api.get<Agent[]>('/agents');
    setAgents(data);
  }

  useEffect(() => {
    loadItems();
    loadAgents();
    const socket = getSocket();
    socket?.on('status:update', loadItems);
    socket?.on('position:update', loadItems);
    return () => {
      socket?.off('status:update', loadItems);
      socket?.off('position:update', loadItems);
    };
  }, []);

  async function handleCreateItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setItemFormErrors([]);
    setSubmittingItem(true);
    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    try {
      await api.post('/tracking-items', {
        type: form.get('type'),
        label: form.get('label') || undefined,
        initialStatus: form.get('initialStatus') || 'RECEIVED',
        metadata: readMetadataFromForm(form),
      });
      setShowItemForm(false);
      formEl.reset();
      await loadItems();
    } catch (err) {
      setItemFormErrors(extractErrorMessages(err));
    } finally {
      setSubmittingItem(false);
    }
  }

  async function handleCreateAgent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAgentFormErrors([]);
    setSubmittingAgent(true);
    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    try {
      await api.post('/agents', {
        email: form.get('email'),
        password: form.get('password'),
        fullName: form.get('fullName'),
      });
      setShowAgentForm(false);
      formEl.reset();
      await loadAgents();
    } catch (err) {
      setAgentFormErrors(extractErrorMessages(err));
    } finally {
      setSubmittingAgent(false);
    }
  }

  async function removeAgent(id: string) {
    if (!confirm('Retirer cet agent ?')) return;
    setPageError(null);
    try {
      await api.delete(`/agents/${id}`);
      await loadAgents();
    } catch (err) {
      setPageError(extractErrorMessages(err).join(' '));
    }
  }

  async function handleUpdateMetadata(e: FormEvent<HTMLFormElement>, itemId: string) {
    e.preventDefault();
    setEditFormErrors([]);
    setSubmittingEdit(true);
    const form = new FormData(e.currentTarget);

    try {
      await api.patch(`/tracking-items/${itemId}/metadata`, readMetadataFromForm(form));
      setEditingItemId(null);
      await loadItems();
    } catch (err) {
      setEditFormErrors(extractErrorMessages(err));
    } finally {
      setSubmittingEdit(false);
    }
  }

  function startPickingPosition(itemId: string) {
    setPickingItemId(itemId);
    setPendingPosition(null);
    setPositionError(null);
  }

  function cancelPickingPosition() {
    setPickingItemId(null);
    setPendingPosition(null);
    setPositionError(null);
  }

  function handleMapClick(lat: number, lng: number) {
    if (!pickingItemId) return;
    setPendingPosition({ lat, lng });
  }

  async function confirmPendingPosition() {
    if (!pickingItemId || !pendingPosition) return;
    setPositionError(null);
    setSubmittingPosition(true);
    try {
      await api.post('/positions', {
        trackingItemId: pickingItemId,
        latitude: pendingPosition.lat,
        longitude: pendingPosition.lng,
      });
      setPickingItemId(null);
      setPendingPosition(null);
      await loadItems();
    } catch (err) {
      setPositionError(extractErrorMessages(err).join(' '));
    } finally {
      setSubmittingPosition(false);
    }
  }

  async function assignAgent(itemId: string, agentId: string) {
    if (!agentId) return;
    setPageError(null);
    try {
      await api.patch(`/tracking-items/${itemId}/assign/${agentId}`);
      await loadItems();
    } catch (err) {
      setPageError(extractErrorMessages(err).join(' '));
    }
  }

  const markers: MapMarker[] = items
    .filter((i) => i.positions?.length)
    .map((i) => ({
      id: i.id,
      lat: i.positions![0].latitude,
      lng: i.positions![0].longitude,
      label: i.label ?? i.publicCode,
      status: i.currentStatus,
    }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-white p-4">
        <h1 className="text-xl font-semibold">Admin — {user?.fullName}</h1>
        <div className="space-x-4">
          <button
            onClick={() => {
              setShowAgentForm((v) => !v);
              setAgentFormErrors([]);
            }}
            className="rounded bg-purple-600 px-3 py-1.5 text-white"
          >
            + Agent
          </button>
          <button
            onClick={() => {
              setShowItemForm((v) => !v);
              setItemFormErrors([]);
            }}
            className="rounded bg-blue-600 px-3 py-1.5 text-white"
          >
            + Élément de tracking
          </button>
          <button onClick={logout} className="text-sm text-gray-500 hover:underline">
            Déconnexion
          </button>
        </div>
      </div>

      {pageError && (
        <div className="mx-4 mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{pageError}</div>
      )}

      {showAgentForm && (
        <form onSubmit={handleCreateAgent} className="space-y-3 border-b bg-gray-50 p-4">
          {agentFormErrors.length > 0 && (
            <ul className="list-inside list-disc rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {agentFormErrors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-3">
            <input name="fullName" placeholder="Nom complet" required minLength={2} className="flex-1 rounded border px-3 py-2" />
            <input name="email" type="email" placeholder="Email" required className="flex-1 rounded border px-3 py-2" />
            <div className="relative flex-1">
              <input
                name="password"
                type={showAgentPassword ? 'text' : 'password'}
                placeholder="Mot de passe (8 car. min.)"
                required
                minLength={8}
                className="w-full rounded border px-3 py-2 pr-16"
              />
              <button
                type="button"
                onClick={() => setShowAgentPassword((v) => !v)}
                className="absolute inset-y-0 right-2 text-xs text-gray-500 hover:text-gray-700"
              >
                {showAgentPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <button
              type="submit"
              disabled={submittingAgent}
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submittingAgent ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      {showItemForm && (
        <form onSubmit={handleCreateItem} className="space-y-3 border-b bg-gray-50 p-4">
          {itemFormErrors.length > 0 && (
            <ul className="list-inside list-disc rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {itemFormErrors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-3">
            <select
              name="type"
              value={newItemType}
              onChange={(e) => setNewItemType(e.target.value as 'PARCEL' | 'VEHICLE')}
              className="rounded border px-3 py-2"
            >
              <option value="PARCEL">Colis</option>
              <option value="VEHICLE">Véhicule</option>
            </select>
            <input name="label" placeholder="Libellé" className="flex-1 rounded border px-3 py-2" />
            <input name="initialStatus" placeholder="Statut initial (ex: RECEIVED)" className="rounded border px-3 py-2" />
          </div>

          <MetadataFields type={newItemType} />

          <button
            type="submit"
            disabled={submittingItem}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submittingItem ? 'Création…' : 'Créer'}
          </button>
        </form>
      )}

      <div className="grid flex-1 grid-cols-3 gap-4 overflow-auto p-4">
        <div className="col-span-1 space-y-4 overflow-auto">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-500">Éléments de tracking</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="rounded border bg-white p-3 text-sm">
                  <div className="font-medium">{item.label ?? item.publicCode}</div>
                  <div className="text-gray-500">Code : {item.publicCode}</div>
                  <div>Statut : {item.currentStatus}</div>

                  {item.type === 'PARCEL' ? (
                    <div className="mt-1 text-xs text-gray-600">
                      {item.metadata?.category && <span>{item.metadata.category}</span>}
                      {item.metadata?.weightKg && <span> · {item.metadata.weightKg} kg</span>}
                      {item.metadata?.fragile && <span className="ml-1 text-orange-600">Fragile</span>}
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-gray-600">
                      {item.metadata?.plateNumber && <span>{item.metadata.plateNumber}</span>}
                      {item.metadata?.vehicleModel && <span> · {item.metadata.vehicleModel}</span>}
                    </div>
                  )}

                  <label className="mt-2 block text-xs text-gray-500">
                    Agent assigné
                    <select
                      value={item.assignedAgent?.id ?? ''}
                      onChange={(e) => assignAgent(item.id, e.target.value)}
                      className="mt-1 w-full rounded border px-2 py-1"
                    >
                      <option value="">Non assigné</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.fullName}
                        </option>
                      ))}
                    </select>
                  </label>

                  {pickingItemId === item.id ? (
                    <p className="mt-2 text-xs font-medium text-orange-600">
                      Cliquez sur la carte pour choisir la position →
                    </p>
                  ) : (
                    <button
                      onClick={() => startPickingPosition(item.id)}
                      className="mt-2 block text-xs text-blue-600 hover:underline"
                    >
                      {item.positions?.length ? 'Actualiser la position sur la carte' : 'Définir la position sur la carte'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingItemId(editingItemId === item.id ? null : item.id);
                      setEditFormErrors([]);
                    }}
                    className="mt-1 block text-xs text-blue-600 hover:underline"
                  >
                    {editingItemId === item.id ? 'Fermer' : 'Modifier les infos'}
                  </button>

                  {editingItemId === item.id && (
                    <form
                      onSubmit={(e) => handleUpdateMetadata(e, item.id)}
                      className="mt-2 space-y-2 rounded border bg-gray-50 p-2"
                    >
                      {editFormErrors.length > 0 && (
                        <ul className="list-inside list-disc rounded border border-red-300 bg-red-50 p-2 text-xs text-red-700">
                          {editFormErrors.map((msg, i) => (
                            <li key={i}>{msg}</li>
                          ))}
                        </ul>
                      )}
                      <MetadataFields type={item.type} defaults={item.metadata ?? undefined} />
                      <button
                        type="submit"
                        disabled={submittingEdit}
                        className="w-full rounded bg-blue-600 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {submittingEdit ? 'Enregistrement…' : 'Enregistrer les infos'}
                      </button>
                    </form>
                  )}
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-gray-500">Aucun élément pour le moment.</p>}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-500">Agents</h2>
            <div className="space-y-2">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between rounded border bg-white p-3 text-sm">
                  <div>
                    <div className="font-medium">{agent.fullName}</div>
                    <div className="text-gray-500">{agent.email}</div>
                  </div>
                  <button onClick={() => removeAgent(agent.id)} className="text-red-600 hover:underline">
                    Retirer
                  </button>
                </div>
              ))}
              {agents.length === 0 && <p className="text-sm text-gray-500">Aucun agent pour le moment.</p>}
            </div>
          </div>
        </div>
        <div className="col-span-2 flex h-[600px] flex-col gap-2">
          {pickingItemId && (
            <div className="flex items-center justify-between rounded border border-orange-300 bg-orange-50 p-2 text-sm">
              <span>
                {pendingPosition
                  ? `Position choisie : ${pendingPosition.lat.toFixed(5)}, ${pendingPosition.lng.toFixed(5)}`
                  : 'Cliquez sur la carte pour placer le marqueur.'}
                {positionError && <span className="ml-2 text-red-600">{positionError}</span>}
              </span>
              <div className="flex gap-2">
                {pendingPosition && (
                  <button
                    onClick={confirmPendingPosition}
                    disabled={submittingPosition}
                    className="rounded bg-orange-600 px-3 py-1 text-white hover:bg-orange-700 disabled:opacity-60"
                  >
                    {submittingPosition ? 'Enregistrement…' : 'Confirmer'}
                  </button>
                )}
                <button onClick={cancelPickingPosition} className="rounded border px-3 py-1 text-gray-600">
                  Annuler
                </button>
              </div>
            </div>
          )}
          <div className="flex-1">
            <MapView markers={markers} onMapClick={pickingItemId ? handleMapClick : undefined} pendingMarker={pendingPosition} />
          </div>
        </div>
      </div>
    </div>
  );
}
