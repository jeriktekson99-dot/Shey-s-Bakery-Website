export interface Product {
  id: string;
  name: string;
  category: 'Pastries' | 'Breads' | 'Pies & Tarts' | 'Specialties & Snacks' | string;
  price: number;
  basePrice?: number;
  originalPrice?: number;
  description: string;
  details?: string[];
  image: string;
  images?: string[];
  galleryImages?: string[];
  badge?: string;
  rating: number;
  reviewsCount: number;
  isNew?: boolean;
  prepTime?: string;
  leadTime?: string;
  allergens?: string[];
  availability?: 'In Stock' | 'Sold Out' | 'Pre-Order' | string;
  inStock?: boolean;
  storageInstructions?: string;
  reheatingInstructions?: string;
  variants?: string[];
  boxVariants?: ('Box of 10' | 'Box of 15' | 'Box of 20')[] | string[];
}

export interface CartItem {
  id?: string;
  product: Product;
  quantity: number;
  variant?: string;
  notes?: string;
  unitPrice?: number;
  rawPrice?: number;
  savings?: number;
}

export interface Collection {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  categoryFilter: string;
  colSpan?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface HowToOrderStep {
  step: number;
  title: string;
  description: string;
  iconName: string;
}
