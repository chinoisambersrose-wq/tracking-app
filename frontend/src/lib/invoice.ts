import { jsPDF } from 'jspdf';

export interface InvoiceMetadata {
  category?: string;
  weightKg?: number;
  declaredValue?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  plateNumber?: string;
  vehicleModel?: string;
  recipientName?: string;
  recipientAddress?: string;
  carrier?: string;
  shipmentMode?: string;
  totalFreight?: number;
  originCity?: string;
  destinationCity?: string;
}

export interface InvoiceItem {
  publicCode: string;
  type: 'PARCEL' | 'VEHICLE';
  label?: string | null;
  currentStatus: string;
  metadata?: InvoiceMetadata | null;
}

/** Dessine un code-barres décoratif (même algorithme que la page de suivi publique). */
function drawBarcode(doc: jsPDF, code: string, x: number, y: number, height: number) {
  let cursor = x;
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i);
    const widths = [(c % 3) + 1, ((c * 7) % 3) + 1];
    for (const w of widths) {
      doc.setFillColor(15, 18, 32);
      doc.rect(cursor, y, w * 0.5, height, 'F');
      cursor += w * 0.5 + 0.6;
    }
  }
}

/**
 * Génère une facture PDF minimaliste (essentiel uniquement : code de suivi +
 * code-barres, type, montant, transporteur) et déclenche son téléchargement
 * côté navigateur. Pas d'appel serveur — tout est généré côté client.
 */
export function generateInvoicePdf(item: InvoiceItem) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const m = item.metadata ?? {};
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 15;
  let y = 18;

  // En-tête
  doc.setFillColor(234, 88, 12); // brand-600
  doc.rect(0, 0, pageWidth, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TransEuroGoo', marginX, 7);

  doc.setTextColor(15, 18, 32);
  y = 24;
  doc.setFontSize(18);
  doc.text('FACTURE', marginX, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  doc.text(`Émise le ${new Date().toLocaleDateString('fr-FR')}`, marginX, y);

  // Code de suivi + code-barres
  y += 10;
  doc.setTextColor(15, 18, 32);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(item.label || item.publicCode, marginX, y);
  y += 6;
  drawBarcode(doc, item.publicCode, marginX, y, 12);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(item.publicCode, marginX, y);

  // Ligne de séparation
  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  const row = (label: string, value?: string | number) => {
    if (value === undefined || value === null || value === '') return;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(label, marginX, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 18, 32);
    doc.text(String(value), marginX + 45, y);
    y += 7;
  };

  row('Type', item.type === 'VEHICLE' ? 'Véhicule' : 'Colis');
  row('Statut', item.currentStatus);
  if (item.type === 'PARCEL') {
    row('Catégorie', m.category);
    row('Poids', m.weightKg !== undefined ? `${m.weightKg} kg` : undefined);
    if (m.lengthCm && m.widthCm && m.heightCm) {
      row('Dimensions', `${m.lengthCm} × ${m.widthCm} × ${m.heightCm} cm`);
    }
  } else {
    row('Plaque', m.plateNumber);
    row('Modèle', m.vehicleModel);
  }
  row('Origine', m.originCity);
  row('Destination', m.destinationCity);
  row('Transporteur', m.carrier);
  row('Mode', m.shipmentMode);
  row('Destinataire', m.recipientName);
  row('Adresse', m.recipientAddress);

  // Montant
  y += 3;
  doc.setDrawColor(220, 220, 220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 18, 32);
  doc.text('Montant', marginX, y);
  const amount = m.totalFreight ?? m.declaredValue;
  doc.text(amount !== undefined ? `${amount.toFixed(2)} €` : '—', pageWidth - marginX, y, { align: 'right' });

  // Pied de page
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text('Document généré automatiquement — TransEuroGoo', marginX, pageHeight - 10);

  doc.save(`facture-${item.publicCode}.pdf`);
}
