import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../../hooks/useAuth';
import { extractErrorMessages } from '../../lib/errors';
import { MapView, MapMarker } from '../../components/MapView';
import { generateInvoicePdf } from '../../lib/invoice';
import { useI18n } from '../../lib/i18n';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

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
  senderAddress?: string;
  senderEmail?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  recipientEmail?: string;
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
// À la demande du client, seul le virement bancaire reste proposé.
const PAYMENT_MODES = ['Virement bancaire'];
const STATUS_OPTIONS = ['RECEIVED', 'PREPARING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'];
// Référence transporteur : 14 chiffres minimum, uniquement des chiffres.
const CARRIER_REF_PATTERN = '\\d{14,}';

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

/** Champs d'expédition communs (transporteur, mode, référence, dates...), affichés pour PARCEL et VEHICLE. */
function ShipmentFields({ defaults }: { defaults?: TrackingItemMetadata }) {
  const { t } = useI18n();
  return (
    <div className="space-y-2 border-t border-dashed pt-2">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{t('admin.md.shipmentTitle')}</p>
      <div className="grid grid-cols-3 gap-2">
        <input name="carrier" defaultValue={defaults?.carrier} placeholder={t('admin.md.carrier')} className="rounded border px-2 py-1.5 text-sm" />
        <select name="shipmentMode" defaultValue={defaults?.shipmentMode ?? ''} className="rounded border px-2 py-1.5 text-sm">
          <option value="">{t('admin.md.shipmentMode')}</option>
          {SHIPMENT_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          name="carrierReferenceNo"
          defaultValue={defaults?.carrierReferenceNo}
          placeholder={t('admin.md.carrierRef')}
          pattern={CARRIER_REF_PATTERN}
          minLength={14}
          inputMode="numeric"
          title={t('admin.md.carrierRef')}
          className="rounded border px-2 py-1.5 text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select name="paymentMode" defaultValue={defaults?.paymentMode ?? PAYMENT_MODES[0]} className="rounded border px-2 py-1.5 text-sm">
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
          placeholder={t('admin.md.totalFreight')}
          className="rounded border px-2 py-1.5 text-sm"
        />
        <input name="expectedDeliveryDate" type="date" defaultValue={defaults?.expectedDeliveryDate} className="rounded border px-2 py-1.5 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input name="originCity" defaultValue={defaults?.originCity} placeholder={t('admin.md.originCity')} className="rounded border px-2 py-1.5 text-sm" />
        <input name="destinationCity" defaultValue={defaults?.destinationCity} placeholder={t('admin.md.destinationCity')} className="rounded border px-2 py-1.5 text-sm" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input name="pickupDate" type="date" defaultValue={defaults?.pickupDate} className="rounded border px-2 py-1.5 text-sm" title="Date de ramassage" />
        <input name="pickupTime" type="time" defaultValue={defaults?.pickupTime} className="rounded border px-2 py-1.5 text-sm" title="Heure de ramassage" />
        <input name="departureTime" type="time" defaultValue={defaults?.departureTime} className="rounded border px-2 py-1.5 text-sm" title="Heure de départ" />
      </div>
      <textarea
        name="comments"
        defaultValue={defaults?.comments}
        placeholder={t('admin.md.comments')}
        rows={2}
        className="w-full rounded border px-2 py-1.5 text-sm"
      />
    </div>
  );
}

function MetadataFields({ type, defaults }: { type: 'PARCEL' | 'VEHICLE'; defaults?: TrackingItemMetadata }) {
  const { t } = useI18n();

  if (type === 'VEHICLE') {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input name="plateNumber" defaultValue={defaults?.plateNumber} placeholder={t('admin.md.plateNumber')} className="rounded border px-2 py-1.5 text-sm" />
          <input name="vehicleModel" defaultValue={defaults?.vehicleModel} placeholder={t('admin.md.vehicleModel')} className="rounded border px-2 py-1.5 text-sm" />
          <input name="vehicleColor" defaultValue={defaults?.vehicleColor} placeholder={t('admin.md.vehicleColor')} className="rounded border px-2 py-1.5 text-sm" />
          <input name="driverName" defaultValue={defaults?.driverName} placeholder={t('admin.md.driverName')} className="rounded border px-2 py-1.5 text-sm" />
          <input name="driverPhone" defaultValue={defaults?.driverPhone} placeholder={t('admin.md.driverPhone')} className="rounded border px-2 py-1.5 text-sm" />
        </div>
        <ShipmentFields defaults={defaults} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <select name="category" defaultValue={defaults?.category ?? ''} className="rounded border px-2 py-1.5 text-sm">
          <option value="">{t('admin.md.category')}</option>
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
          placeholder={t('admin.md.weight')}
          className="rounded border px-2 py-1.5 text-sm"
        />
        <input
          name="declaredValue"
          type="number"
          step="0.01"
          min={0}
          defaultValue={defaults?.declaredValue}
          placeholder={t('admin.md.declaredValue')}
          className="rounded border px-2 py-1.5 text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input name="lengthCm" type="number" step="0.1" min={0} defaultValue={defaults?.lengthCm} placeholder={t('admin.md.length')} className="rounded border px-2 py-1.5 text-sm" />
        <input name="widthCm" type="number" step="0.1" min={0} defaultValue={defaults?.widthCm} placeholder={t('admin.md.width')} className="rounded border px-2 py-1.5 text-sm" />
        <input name="heightCm" type="number" step="0.1" min={0} defaultValue={defaults?.heightCm} placeholder={t('admin.md.height')} className="rounded border px-2 py-1.5 text-sm" />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" name="fragile" defaultChecked={defaults?.fragile} />
        {t('admin.md.fragileLabel')}
      </label>
      <textarea
        name="description"
        defaultValue={defaults?.description}
        placeholder={t('admin.md.description')}
        rows={2}
        className="w-full rounded border px-2 py-1.5 text-sm"
      />
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{t('admin.md.contactsTitle')}</p>
      <div className="grid grid-cols-2 gap-2">
        <input name="senderName" defaultValue={defaults?.senderName} placeholder={t('admin.md.senderName')} className="rounded border px-2 py-1.5 text-sm" />
        <input name="senderPhone" defaultValue={defaults?.senderPhone} placeholder={t('admin.md.senderPhone')} className="rounded border px-2 py-1.5 text-sm" />
        <input name="senderEmail" type="email" defaultValue={defaults?.senderEmail} placeholder={t('admin.md.senderEmail')} className="rounded border px-2 py-1.5 text-sm" />
        <input
          name="senderAddress"
          defaultValue={defaults?.senderAddress}
          placeholder={t('admin.md.senderAddress')}
          className="rounded border px-2 py-1.5 text-sm"
        />
        <input name="recipientName" defaultValue={defaults?.recipientName} placeholder={t('admin.md.recipientName')} className="rounded border px-2 py-1.5 text-sm" />
        <input name="recipientPhone" defaultValue={defaults?.recipientPhone} placeholder={t('admin.md.recipientPhone')} className="rounded border px-2 py-1.5 text-sm" />
        <input name="recipientEmail" type="email" defaultValue={defaults?.recipientEmail} placeholder={t('admin.md.recipientEmail')} className="rounded border px-2 py-1.5 text-sm" />
        <input
          name="recipientAddress"
          defaultValue={defaults?.recipientAddress}
          placeholder={t('admin.md.recipientAddress')}
          className="rounded border px-2 py-1.5 text-sm"
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
  str('senderAddress');
  str('senderEmail');
  str('recipientName');
  str('recipientPhone');
  str('recipientAddress');
  str('recipientEmail');
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
  const { t } = useI18n();
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [newItemType, setNewItemType] = useState<'PARCEL' | 'VEHICLE'>('PARCEL');
  const [itemFormErrors, setItemFormErrors] = useState<string[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [submittingItem, setSubmittingItem] = useState(false);
  const [pickingItemId, setPickingItemId] = useState<string | null>(null);
  const [pendingPosition, setPendingPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [positionError, setPositionError] = useState<string | null>(null);
  const [submittingPosition, setSubmittingPosition] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormErrors, setEditFormErrors] = useState<string[]>([]);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  async function loadItems() {
    const { data } = await api.get<TrackingItem[]>('/tracking-items');
    setItems(data);
  }

  useEffect(() => {
    loadItems();
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

  function buildShareLink(item: TrackingItem): string {
    const base = `${window.location.origin}/track?code=${encodeURIComponent(item.publicCode)}`;
    return user?.whatsappPhone ? `${base}&wa=${encodeURIComponent(user.whatsappPhone)}` : base;
  }

  async function shareTrackingLink(item: TrackingItem) {
    const link = buildShareLink(item);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedItemId(item.id);
      setTimeout(() => setCopiedItemId((cur) => (cur === item.id ? null : cur)), 2000);
    } catch {
      // Presse-papiers indisponible (permissions navigateur) : on affiche le lien pour copie manuelle.
      prompt('Copiez ce lien :', link);
    }
  }

  async function updateStatus(itemId: string, status: string) {
    setPageError(null);
    try {
      await api.patch(`/tracking-items/${itemId}/status`, { status });
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
        <h1 className="text-xl font-semibold">{t('admin.title')} — {user?.fullName}</h1>
        <div className="flex items-center gap-4">
          <LanguageSwitcher langs={['fr', 'en']} />
          <button
            onClick={() => {
              setShowItemForm((v) => !v);
              setItemFormErrors([]);
            }}
            className="rounded bg-blue-600 px-3 py-1.5 text-white"
          >
            {t('admin.newItem')}
          </button>
          <button onClick={logout} className="text-sm text-gray-500 hover:underline">
            {t('admin.logout')}
          </button>
        </div>
      </div>

      {pageError && (
        <div className="mx-4 mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{pageError}</div>
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
              <option value="PARCEL">{t('admin.parcel')}</option>
              <option value="VEHICLE">{t('admin.vehicle')}</option>
            </select>
            <input name="label" placeholder={t('admin.label')} className="flex-1 rounded border px-3 py-2" />
            <input name="initialStatus" placeholder={t('admin.initialStatus')} className="rounded border px-3 py-2" />
          </div>

          <MetadataFields type={newItemType} />

          <button
            type="submit"
            disabled={submittingItem}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submittingItem ? t('admin.creating') : t('admin.create')}
          </button>
        </form>
      )}

      <div className="grid flex-1 grid-cols-3 gap-4 overflow-auto p-4">
        <div className="col-span-1 space-y-4 overflow-auto">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-500">{t('admin.trackingItems')}</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="rounded border bg-white p-3 text-sm">
                  <div className="font-medium">{item.label ?? item.publicCode}</div>
                  <div className="text-gray-500">{t('admin.code')} {item.publicCode}</div>

                  <label className="mt-1 block text-xs text-gray-500">
                    {t('admin.status')}
                    <select
                      value={item.currentStatus}
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                      className="mt-1 w-full rounded border px-2 py-1"
                    >
                      {!STATUS_OPTIONS.includes(item.currentStatus) && (
                        <option value={item.currentStatus}>{item.currentStatus}</option>
                      )}
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>

                  {item.type === 'PARCEL' ? (
                    <div className="mt-1 text-xs text-gray-600">
                      {item.metadata?.category && <span>{item.metadata.category}</span>}
                      {item.metadata?.weightKg && <span> · {item.metadata.weightKg} kg</span>}
                      {item.metadata?.fragile && <span className="ml-1 text-orange-600">{t('admin.fragileBadge')}</span>}
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-gray-600">
                      {item.metadata?.plateNumber && <span>{item.metadata.plateNumber}</span>}
                      {item.metadata?.vehicleModel && <span> · {item.metadata.vehicleModel}</span>}
                    </div>
                  )}

                  {pickingItemId === item.id ? (
                    <p className="mt-2 text-xs font-medium text-orange-600">{t('admin.clickMap')}</p>
                  ) : (
                    <button
                      onClick={() => startPickingPosition(item.id)}
                      className="mt-2 block text-xs text-blue-600 hover:underline"
                    >
                      {item.positions?.length ? t('admin.updatePosition') : t('admin.setPosition')}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingItemId(editingItemId === item.id ? null : item.id);
                      setEditFormErrors([]);
                    }}
                    className="mt-1 block text-xs text-blue-600 hover:underline"
                  >
                    {editingItemId === item.id ? t('admin.close') : t('admin.editInfo')}
                  </button>

                  <button
                    onClick={() => generateInvoicePdf(item)}
                    className="mt-1 block text-xs text-blue-600 hover:underline"
                  >
                    {t('admin.generateInvoice')}
                  </button>

                  <button
                    onClick={() => shareTrackingLink(item)}
                    className="mt-1 block text-xs text-blue-600 hover:underline"
                  >
                    {copiedItemId === item.id ? t('admin.linkCopied') : t('admin.copyLink')}
                  </button>
                  {!user?.whatsappPhone && (
                    <p className="mt-0.5 text-[11px] text-gray-400">{t('admin.noWhatsapp')}</p>
                  )}

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
                        {submittingEdit ? t('admin.saving') : t('admin.save')}
                      </button>
                    </form>
                  )}
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-gray-500">{t('admin.noItems')}</p>}
            </div>
          </div>
        </div>
        <div className="col-span-2 flex h-[600px] flex-col gap-2">
          {pickingItemId && (
            <div className="flex items-center justify-between rounded border border-orange-300 bg-orange-50 p-2 text-sm">
              <span>
                {pendingPosition
                  ? `${t('admin.positionChosen')} ${pendingPosition.lat.toFixed(5)}, ${pendingPosition.lng.toFixed(5)}`
                  : t('admin.clickMapPlace')}
                {positionError && <span className="ml-2 text-red-600">{positionError}</span>}
              </span>
              <div className="flex gap-2">
                {pendingPosition && (
                  <button
                    onClick={confirmPendingPosition}
                    disabled={submittingPosition}
                    className="rounded bg-orange-600 px-3 py-1 text-white hover:bg-orange-700 disabled:opacity-60"
                  >
                    {submittingPosition ? t('admin.saving') : t('admin.confirm')}
                  </button>
                )}
                <button onClick={cancelPickingPosition} className="rounded border px-3 py-1 text-gray-600">
                  {t('admin.cancel')}
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
