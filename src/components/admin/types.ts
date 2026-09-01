export type AdminViewTab = 
  | 'overview' 
  | 'orders' 
  | 'products' 
  | 'capacity' 
  | 'archive'
  | 'settings';

export type OrderStatus = 'New' | 'Completed' | 'Cancelled';

export function normalizeOrderStatus(status?: unknown): OrderStatus {
  if (typeof status === 'string') {
    const trimmed = status.trim();
    if (trimmed === 'Completed') return 'Completed';
    if (trimmed === 'Cancelled' || trimmed === 'Canceled') return 'Cancelled';
  }
  return 'New';
}

export function getOrderStatusBadgeClass(status?: unknown): string {
  const normalized = normalizeOrderStatus(status);
  switch (normalized) {
    case 'Completed':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-400';
    case 'Cancelled':
      return 'bg-red-50 text-red-800 border-red-200 hover:border-red-400';
    case 'New':
    default:
      return 'bg-blue-50 text-blue-800 border-blue-200 hover:border-blue-400';
  }
}

export type PaymentStatus = 
  | 'GCash (Paid)' 
  | 'PayMaya (Paid)' 
  | 'QR Ph (Paid)' 
  | 'Card (Paid)' 
  | 'PayMongo (Paid)' 
  | 'COD (Pending COD)' 
  | 'COD (Pending)' 
  | 'COD (Paid)' 
  | 'Cash at Pickup (Paid)' 
  | 'Pending Verification';

export type FulfillmentType = 'Doorstep Delivery' | 'Store Pickup' | 'Delivery' | 'Pickup';

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  type: FulfillmentType;
  paymentMethod: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
  deliveryDate?: string;
  targetDate?: string;
  targetTime?: string;
  totalAmount: number;
  items: {
    name: string;
    variant?: string;
    boxSize?: 'Box of 10' | 'Box of 15' | 'Box of 20' | 'Single / Standard' | string;
    quantity: number;
    price: number;
  }[];
  // Address details for delivery
  address?: {
    street: string;
    apartment?: string;
    barangay: string;
    city: string;
    postalCode: string;
    region: string;
  };
  deliveryAddress?: string;
  deliveryNotes?: string;
  referenceNumber?: string;
  // Store pickup details
  pickupHub?: string;
  allergyWarnings?: string;
  customCakeNotes?: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  image: string;
  images?: string[];
  boxVariants: ('Box of 10' | 'Box of 15' | 'Box of 20' | string)[];
  leadTime: string;
  inStock: boolean;
  dailyCap?: number;
  allergens?: string[];
  description?: string;
  details?: string[];
  badge?: string;
  originalPrice?: number;
  rating?: number;
  reviewsCount?: number;
}

export interface BakeryHubLocation {
  id: string;
  name: string;
  address: string;
  hours: string;
  phone: string;
  isActive: boolean;
}

export interface BlackoutDate {
  id: string;
  date: string;
  reason: string;
}

export type ArchiveItemType = 'order' | 'product' | 'hub' | 'custom';

export interface ArchivedItem {
  id: string;
  originalId: string;
  type: ArchiveItemType;
  title: string;
  referenceNumber?: string;
  subtitle: string;
  categoryOrStatus?: string;
  archivedAt: string;
  archivedBy: string;
  reason?: string;
  priceOrAmount?: number;
  tags?: string[];
  originalPayload: any;
}
