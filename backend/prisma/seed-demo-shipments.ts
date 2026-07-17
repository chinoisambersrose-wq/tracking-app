import { PrismaClient, Prisma, TrackingItemType, TrackingMode } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function code(): string {
  return `TRK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

/** Horodatage relatif : `daysAgo` jours avant maintenant, à l'heure `h`:`m`. */
function at(daysAgo: number, h = 9, m = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d;
}

interface Step {
  status: string;
  daysAgo: number;
  note?: string;
}

interface Demo {
  type: TrackingItemType;
  label: string;
  steps: Step[]; // dans l'ordre chronologique, le dernier = statut courant
  position?: { lat: number; lng: number };
  metadata: Record<string, unknown>;
}

const DEMOS: Demo[] = [
  // ── EUROPE ──────────────────────────────────────────────
  {
    type: 'PARCEL',
    label: 'Colis électronique Paris → Berlin',
    steps: [
      { status: 'Colis enregistré', daysAgo: 4 },
      { status: 'Pris en charge', daysAgo: 3, note: 'Enlèvement entrepôt Paris' },
      { status: 'En transit', daysAgo: 1, note: 'Passage frontière DE' },
    ],
    position: { lat: 50.9375, lng: 6.9603 }, // Cologne, en route
    metadata: {
      category: 'Électronique',
      weightKg: 4.2,
      declaredValue: 850,
      fragile: true,
      lengthCm: 40,
      widthCm: 30,
      heightCm: 20,
      description: 'Ordinateur portable et accessoires',
      senderName: 'Julien Marchand',
      senderPhone: '+33 6 12 34 56 78',
      senderAddress: '12 rue de Rivoli, 75004 Paris, France',
      senderEmail: 'julien.marchand@example.com',
      recipientName: 'Anna Fischer',
      recipientPhone: '+49 151 2345 6789',
      recipientAddress: 'Alexanderplatz 5, 10178 Berlin, Allemagne',
      recipientEmail: 'anna.fischer@example.com',
      carrier: 'DHL Express',
      shipmentMode: 'Route',
      carrierReferenceNo: 'DHL-EU-88213',
      paymentMode: 'Virement bancaire',
      totalFreight: 45.9,
      originCity: 'Paris, France',
      destinationCity: 'Berlin, Allemagne',
      expectedDeliveryDate: at(-2).toISOString().slice(0, 10),
      pickupDate: at(3).toISOString().slice(0, 10),
      pickupTime: '09:00',
      departureTime: '11:30',
      comments: 'Livraison en journée uniquement, sonner à l\'interphone "Fischer".',
    },
  },
  {
    type: 'VEHICLE',
    label: 'Véhicule utilitaire Madrid → Rome',
    steps: [
      { status: 'Enregistré', daysAgo: 5 },
      { status: 'En transit', daysAgo: 2, note: 'Convoi routier en cours' },
    ],
    position: { lat: 45.75, lng: 4.85 }, // Lyon, en route
    metadata: {
      plateNumber: '4521-BXY',
      vehicleModel: 'Renault Master',
      vehicleColor: 'Blanc',
      driverName: 'Marco Rossi',
      driverPhone: '+34 611 222 333',
      carrier: 'TransEuro Logistics',
      shipmentMode: 'Route',
      carrierReferenceNo: 'TEL-2026-0456',
      paymentMode: 'Virement bancaire',
      totalFreight: 620,
      originCity: 'Madrid, Espagne',
      destinationCity: 'Rome, Italie',
      expectedDeliveryDate: at(-1).toISOString().slice(0, 10),
      pickupDate: at(4).toISOString().slice(0, 10),
      pickupTime: '07:00',
      departureTime: '08:15',
      comments: 'Convoi acheminé par transporteur porte-voitures.',
    },
  },
  {
    type: 'PARCEL',
    label: 'Documents notariés Rome → Madrid',
    steps: [
      { status: 'Colis enregistré', daysAgo: 6 },
      { status: 'En transit', daysAgo: 4 },
      { status: 'Livré', daysAgo: 0, note: 'Remis en main propre' },
    ],
    position: { lat: 40.4168, lng: -3.7038 }, // Madrid
    metadata: {
      category: 'Documents',
      weightKg: 0.4,
      declaredValue: 0,
      fragile: false,
      lengthCm: 32,
      widthCm: 22,
      heightCm: 2,
      description: 'Enveloppe scellée - documents notariés',
      senderName: 'Studio Legale Bianchi',
      senderAddress: 'Via del Corso 45, 00186 Rome, Italie',
      senderPhone: '+39 06 1234 5678',
      senderEmail: 'contact@studiobianchi.example',
      recipientName: 'Estudio Notarial García',
      recipientAddress: 'Calle Mayor 12, 28013 Madrid, Espagne',
      recipientEmail: 'notaria.garcia@example.com',
      carrier: 'UPS',
      shipmentMode: 'Aérien',
      carrierReferenceNo: 'UPS-77190-ES',
      paymentMode: 'Carte bancaire',
      totalFreight: 32,
      originCity: 'Rome, Italie',
      destinationCity: 'Madrid, Espagne',
      expectedDeliveryDate: at(0).toISOString().slice(0, 10),
      pickupDate: at(6).toISOString().slice(0, 10),
      pickupTime: '10:00',
      departureTime: '13:00',
      comments: 'Signature obligatoire à la réception.',
    },
  },
  {
    type: 'VEHICLE',
    label: 'Fourgon Berlin → Paris',
    steps: [{ status: 'En attente de ramassage', daysAgo: 0 }],
    position: { lat: 52.52, lng: 13.405 }, // Berlin, dépôt
    metadata: {
      plateNumber: 'B-KL 9021',
      vehicleModel: 'Mercedes Sprinter',
      vehicleColor: 'Gris',
      driverName: 'Klaus Weber',
      driverPhone: '+49 170 987 6543',
      carrier: 'Flotte interne',
      shipmentMode: 'Route',
      carrierReferenceNo: 'INT-BER-0099',
      paymentMode: 'Facturation mensuelle',
      totalFreight: 380,
      originCity: 'Berlin, Allemagne',
      destinationCity: 'Paris, France',
      expectedDeliveryDate: at(-3).toISOString().slice(0, 10),
      pickupDate: at(0).toISOString().slice(0, 10),
      pickupTime: '14:00',
      comments: 'En attente de confirmation du créneau de départ.',
    },
  },

  // ── ASIE ────────────────────────────────────────────────
  {
    type: 'PARCEL',
    label: 'Composants high-tech Tokyo → Singapour',
    steps: [
      { status: 'Colis enregistré', daysAgo: 3 },
      { status: 'Expédié', daysAgo: 2 },
      { status: 'En transit', daysAgo: 1, note: 'Escale Hong Kong' },
    ],
    position: { lat: 22.3193, lng: 114.1694 }, // Hong Kong, en transit
    metadata: {
      category: 'Électronique',
      weightKg: 12.5,
      declaredValue: 3200,
      fragile: true,
      lengthCm: 60,
      widthCm: 40,
      heightCm: 35,
      description: 'Composants électroniques - semi-conducteurs',
      senderName: 'Kenji Sato',
      senderPhone: '+81 90 1234 5678',
      senderAddress: '2-1 Marunouchi, Chiyoda-ku, Tokyo, Japon',
      senderEmail: 'kenji.sato@example.jp',
      recipientName: 'Wei Tan Logistics Pte Ltd',
      recipientPhone: '+65 9123 4567',
      recipientAddress: '1 Marina Boulevard, Singapour 018989',
      recipientEmail: 'contact@weitanlogistics.example.sg',
      carrier: 'FedEx',
      shipmentMode: 'Aérien',
      carrierReferenceNo: 'FDX-AS-30217',
      paymentMode: 'Virement bancaire',
      totalFreight: 410,
      originCity: 'Tokyo, Japon',
      destinationCity: 'Singapour',
      expectedDeliveryDate: at(-1).toISOString().slice(0, 10),
      pickupDate: at(3).toISOString().slice(0, 10),
      pickupTime: '08:30',
      departureTime: '10:45',
      comments: 'Manipuler avec précaution — matériel sensible à l\'électricité statique.',
    },
  },
  {
    type: 'PARCEL',
    label: 'Textile en conteneur Shanghai → Dubaï',
    steps: [
      { status: 'Colis enregistré', daysAgo: 12 },
      { status: 'Chargé sur navire', daysAgo: 10 },
      { status: 'En transit', daysAgo: 3, note: 'Détroit de Malacca' },
    ],
    position: { lat: 6.9271, lng: 79.8612 }, // Colombo, route maritime
    metadata: {
      category: 'Vêtements',
      weightKg: 850,
      declaredValue: 15000,
      fragile: false,
      lengthCm: 600,
      widthCm: 240,
      heightCm: 260,
      description: 'Conteneur textile - vêtements prêt-à-porter',
      senderName: 'Shanghai Textile Export Co.',
      senderPhone: '+86 21 5555 1234',
      senderAddress: '88 Nanjing Road, Shanghai, Chine',
      senderEmail: 'export@shanghaitextile.example.cn',
      recipientName: 'Al Futtaim Trading LLC',
      recipientPhone: '+971 4 123 4567',
      recipientAddress: 'Jebel Ali Free Zone, Dubaï, EAU',
      recipientEmail: 'trading@alfuttaim.example.ae',
      carrier: 'COSCO Shipping',
      shipmentMode: 'Maritime',
      carrierReferenceNo: 'COSCO-CN-55810',
      paymentMode: 'Lettre de crédit',
      totalFreight: 2800,
      originCity: 'Shanghai, Chine',
      destinationCity: 'Dubaï, EAU',
      expectedDeliveryDate: at(-6).toISOString().slice(0, 10),
      pickupDate: at(12).toISOString().slice(0, 10),
      pickupTime: '06:00',
      departureTime: '18:00',
      comments: 'Conteneur 40 pieds, plombé n°CN552817.',
    },
  },
  {
    type: 'VEHICLE',
    label: 'Véhicule industriel Singapour → Tokyo',
    steps: [
      { status: 'Enregistré', daysAgo: 8 },
      { status: 'Chargé sur navire', daysAgo: 6 },
      { status: 'En transit', daysAgo: 2 },
    ],
    position: { lat: 23.6978, lng: 120.9605 }, // Taïwan, en route
    metadata: {
      plateNumber: 'SGX-4471-T',
      vehicleModel: 'Toyota Hilux',
      vehicleColor: 'Rouge',
      driverName: '—',
      carrier: 'Nippon Express',
      shipmentMode: 'Maritime',
      carrierReferenceNo: 'NE-SG-11029',
      paymentMode: 'Virement bancaire',
      totalFreight: 1950,
      originCity: 'Singapour',
      destinationCity: 'Tokyo, Japon',
      expectedDeliveryDate: at(0).toISOString().slice(0, 10),
      pickupDate: at(8).toISOString().slice(0, 10),
      pickupTime: '09:00',
      comments: 'Véhicule neuf, transport RO-RO.',
    },
  },
  {
    type: 'PARCEL',
    label: 'Pièces aéronautiques Dubaï → Shanghai',
    steps: [
      { status: 'Colis enregistré', daysAgo: 5 },
      { status: 'Expédié', daysAgo: 4 },
      { status: 'Livré', daysAgo: 1, note: 'Réceptionné par le service qualité' },
    ],
    position: { lat: 31.2304, lng: 121.4737 }, // Shanghai
    metadata: {
      category: 'Véhicule / pièces auto',
      weightKg: 28,
      declaredValue: 9800,
      fragile: true,
      lengthCm: 80,
      widthCm: 50,
      heightCm: 40,
      description: 'Pièces détachées aéronautiques certifiées',
      senderName: 'Emirates Aerospace Parts',
      senderPhone: '+971 4 987 6543',
      senderAddress: 'Dubai Airport Free Zone, Dubaï, EAU',
      senderEmail: 'sales@emiratesaerospace.example.ae',
      recipientName: 'Shanghai Aviation Industry Corp.',
      recipientPhone: '+86 21 6666 8888',
      recipientAddress: '88 Hongqiao Road, Shanghai, Chine',
      recipientEmail: 'quality@saic.example.cn',
      carrier: 'Emirates SkyCargo',
      shipmentMode: 'Aérien',
      carrierReferenceNo: 'EK-SKY-90441',
      paymentMode: 'Carte bancaire',
      totalFreight: 1120,
      originCity: 'Dubaï, EAU',
      destinationCity: 'Shanghai, Chine',
      expectedDeliveryDate: at(1).toISOString().slice(0, 10),
      pickupDate: at(5).toISOString().slice(0, 10),
      pickupTime: '05:30',
      departureTime: '07:00',
      comments: 'Certificat de conformité joint au colis.',
    },
  },
];

async function main() {
  let org = await prisma.organization.findFirst({ where: { name: 'Organisation Démo' } });
  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'Organisation Démo', trackingMode: TrackingMode.BOTH },
    });
    console.log(`Organisation démo créée : ${org.id}`);
  } else {
    console.log(`Organisation démo existante réutilisée : ${org.id}`);
  }

  const results: { label: string; publicCode: string }[] = [];

  for (const demo of DEMOS) {
    const publicCode = code();
    const currentStatus = demo.steps[demo.steps.length - 1].status;

    const item = await prisma.trackingItem.create({
      data: {
        organizationId: org.id,
        type: demo.type,
        label: demo.label,
        currentStatus,
        publicCode,
        metadata: demo.metadata as Prisma.InputJsonValue,
      },
    });

    for (const step of demo.steps) {
      await prisma.trackingStatusHistory.create({
        data: {
          trackingItemId: item.id,
          status: step.status,
          note: step.note,
          createdAt: at(step.daysAgo),
        },
      });
    }

    if (demo.position) {
      await prisma.position.create({
        data: {
          trackingItemId: item.id,
          latitude: demo.position.lat,
          longitude: demo.position.lng,
          recordedAt: at(demo.steps[demo.steps.length - 1].daysAgo),
        },
      });
    }

    results.push({ label: demo.label, publicCode });
  }

  console.log('\n=== Codes de suivi créés ===');
  for (const r of results) {
    console.log(`${r.publicCode}  —  ${r.label}`);
  }
  console.log('\nTestez sur : https://tracking-app-ten-sable.vercel.app/track?code=<CODE>\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
