export interface CaviteLocation {
  name: string;
  type: 'City' | 'Municipality';
  zone: 'Zone 1 (Near)' | 'Zone 2 (Mid)' | 'Zone 3 (Far)';
  zoneId: 1 | 2 | 3;
  zoneDescription: string;
  deliveryFee: number;
  postalCode: string;
}

export const CAVITE_ZONES = [
  {
    id: 1,
    name: 'Zone 1 (Near)',
    description: 'Bacoor, Imus, Dasmariñas, Kawit, Noveleta, Rosario, Cavite City',
    fee: 100
  },
  {
    id: 2,
    name: 'Zone 2 (Mid)',
    description: 'Gen. Trias, Trece Martires, Carmona, GMA, Silang, Tanza',
    fee: 140
  },
  {
    id: 3,
    name: 'Zone 3 (Far / Upland)',
    description: 'Tagaytay, Amadeo, Alfonso, Indang, Mendez, Naic, Maragondon, Ternate, Magallanes, Gen. Emilio Aguinaldo',
    fee: 180
  }
];

export const CAVITE_LOCATIONS: CaviteLocation[] = [
  // Zone 1 - Near / North & Core Cavite (₱100)
  { name: 'Bacoor City', type: 'City', zone: 'Zone 1 (Near)', zoneId: 1, zoneDescription: 'Near Bakery / North Cavite', deliveryFee: 100, postalCode: '4102' },
  { name: 'Imus City', type: 'City', zone: 'Zone 1 (Near)', zoneId: 1, zoneDescription: 'Near Bakery / North Cavite', deliveryFee: 100, postalCode: '4103' },
  { name: 'Dasmariñas City', type: 'City', zone: 'Zone 1 (Near)', zoneId: 1, zoneDescription: 'Near Bakery / Central-North Cavite', deliveryFee: 100, postalCode: '4114' },
  { name: 'Kawit', type: 'Municipality', zone: 'Zone 1 (Near)', zoneId: 1, zoneDescription: 'Near Bakery / Coastal Cavite', deliveryFee: 100, postalCode: '4104' },
  { name: 'Noveleta', type: 'Municipality', zone: 'Zone 1 (Near)', zoneId: 1, zoneDescription: 'Near Bakery / Coastal Cavite', deliveryFee: 100, postalCode: '4105' },
  { name: 'Rosario', type: 'Municipality', zone: 'Zone 1 (Near)', zoneId: 1, zoneDescription: 'Near Bakery / Coastal Cavite', deliveryFee: 100, postalCode: '4106' },
  { name: 'Cavite City', type: 'City', zone: 'Zone 1 (Near)', zoneId: 1, zoneDescription: 'Near Bakery / Peninsula Cavite', deliveryFee: 100, postalCode: '4100' },

  // Zone 2 - Mid Cavite (₱140)
  { name: 'General Trias City', type: 'City', zone: 'Zone 2 (Mid)', zoneId: 2, zoneDescription: 'Mid Cavite / Central', deliveryFee: 140, postalCode: '4107' },
  { name: 'Trece Martires City', type: 'City', zone: 'Zone 2 (Mid)', zoneId: 2, zoneDescription: 'Mid Cavite / Provincial Capital', deliveryFee: 140, postalCode: '4109' },
  { name: 'Carmona City', type: 'City', zone: 'Zone 2 (Mid)', zoneId: 2, zoneDescription: 'Mid Cavite / East Corridor', deliveryFee: 140, postalCode: '4116' },
  { name: 'GMA (Gen. Mariano Alvarez)', type: 'Municipality', zone: 'Zone 2 (Mid)', zoneId: 2, zoneDescription: 'Mid Cavite / East Corridor', deliveryFee: 140, postalCode: '4117' },
  { name: 'Silang', type: 'Municipality', zone: 'Zone 2 (Mid)', zoneId: 2, zoneDescription: 'Mid Cavite / Highway Corridor', deliveryFee: 140, postalCode: '4118' },
  { name: 'Tanza', type: 'Municipality', zone: 'Zone 2 (Mid)', zoneId: 2, zoneDescription: 'Mid Cavite / Coastal-Mid', deliveryFee: 140, postalCode: '4108' },

  // Zone 3 - Far / Upland & Coastal Cavite (₱180)
  { name: 'Tagaytay City', type: 'City', zone: 'Zone 3 (Far)', zoneId: 3, zoneDescription: 'Far / Upland Ridge Cavite', deliveryFee: 180, postalCode: '4120' },
  { name: 'Amadeo', type: 'Municipality', zone: 'Zone 3 (Far)', zoneId: 3, zoneDescription: 'Far / Upland Cavite', deliveryFee: 180, postalCode: '4119' },
  { name: 'Alfonso', type: 'Municipality', zone: 'Zone 3 (Far)', zoneId: 3, zoneDescription: 'Far / Upland Cavite', deliveryFee: 180, postalCode: '4123' },
  { name: 'Indang', type: 'Municipality', zone: 'Zone 3 (Far)', zoneId: 3, zoneDescription: 'Far / Upland Cavite', deliveryFee: 180, postalCode: '4122' },
  { name: 'Mendez', type: 'Municipality', zone: 'Zone 3 (Far)', zoneId: 3, zoneDescription: 'Far / Upland Cavite', deliveryFee: 180, postalCode: '4121' },
  { name: 'Naic', type: 'Municipality', zone: 'Zone 3 (Far)', zoneId: 3, zoneDescription: 'Far / Coastal-West Cavite', deliveryFee: 180, postalCode: '4110' },
  { name: 'Maragondon', type: 'Municipality', zone: 'Zone 3 (Far)', zoneId: 3, zoneDescription: 'Far / West Coastal Cavite', deliveryFee: 180, postalCode: '4112' },
  { name: 'Ternate', type: 'Municipality', zone: 'Zone 3 (Far)', zoneId: 3, zoneDescription: 'Far / West Coastal Cavite', deliveryFee: 180, postalCode: '4111' },
  { name: 'Magallanes', type: 'Municipality', zone: 'Zone 3 (Far)', zoneId: 3, zoneDescription: 'Far / Southwest Cavite', deliveryFee: 180, postalCode: '4113' },
  { name: 'General Emilio Aguinaldo (Bailen)', type: 'Municipality', zone: 'Zone 3 (Far)', zoneId: 3, zoneDescription: 'Far / Southwest Cavite', deliveryFee: 180, postalCode: '4124' }
];

export function getCaviteLocation(cityName: string): CaviteLocation | undefined {
  const normalized = cityName.trim().toLowerCase();
  return CAVITE_LOCATIONS.find(loc => 
    loc.name.toLowerCase() === normalized ||
    loc.name.toLowerCase().replace(' city', '') === normalized ||
    normalized.includes(loc.name.toLowerCase().replace(' city', ''))
  );
}
