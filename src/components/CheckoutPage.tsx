import React, { useState, useMemo } from 'react';
import { CartItem } from '../types';
import { AdminOrder, BakeryHubLocation, BlackoutDate, PaymentStatus } from './admin/types';
import { generateUniqueId } from '../data/bakeryStore';
import { BRAND_LOGO } from '../data/bakeryData';
import { isBundleVariant } from '../utils/bundlePricing';
import { getOptimizedImageUrl } from '../lib/imageOptimization';
import {
  CAVITE_LOCATIONS,
  CAVITE_ZONES,
  getCaviteLocation,
  CaviteLocation
} from '../data/caviteDelivery';
import {
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Store,
  CreditCard,
  QrCode,
  Banknote,
  Clock,
  CheckCircle2,
  Tag,
  Lock,
  ChevronRight,
  HelpCircle,
  MapPin,
  Package,
  Check,
  Calendar,
  AlertCircle,
  CalendarDays,
  MessageSquare,
  Building2,
  Copy,
  Mail,
  ChevronUp,
  ChevronDown,
  Smartphone,
  Loader2,
  Sparkles,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { createPayMongoCheckoutSession } from '../services/paymongoClient';

interface CheckoutPageProps {
  cartItems: CartItem[];
  initialDate?: string;
  initialNotes?: string;
  hubs?: BakeryHubLocation[];
  blackoutDates?: BlackoutDate[];
  onUpdateQuantity: (productId: string, delta: number, notes?: string) => void;
  onRemoveItem: (productId: string, notes?: string) => void;
  onClearCart: () => void;
  onNavigateHome: () => void;
  onNavigateCatalog: () => void;
  onOpenCart: () => void;
  onPlaceOrder?: (newOrder: AdminOrder) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cartItems,
  initialDate,
  initialNotes,
  hubs = [],
  blackoutDates = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigateHome,
  onNavigateCatalog,
  onOpenCart,
  onPlaceOrder,
}) => {
  // Helper for tomorrow's date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Form state
  const [email, setEmail] = useState('maria.santos@example.com');
  const [emailOffers, setEmailOffers] = useState(true);
  const [fulfillment, setFulfillment] = useState<'ship' | 'pickup'>('ship');
  
  // Date & Time Scheduling state (synced from Cart selection if provided)
  const [selectedDate, setSelectedDate] = useState<string>(() => initialDate || getTomorrowDate());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:00 AM - 1:00 PM');
  const [orderInstructions, setOrderInstructions] = useState<string>(() => initialNotes || '');

  // Active Bakery Hubs for Pickup
  const activeHubs = useMemo(() => {
    const filtered = hubs.filter((h) => h.isActive !== false);
    if (filtered.length > 0) return filtered;
    return [
      {
        id: 'hub-pasig',
        name: 'Pasig Flagship Bakery & Oven Kitchen',
        address: '123 Kapitolyo Drive, Pasig City (Near Commons)',
        operatingHours: 'Daily 8:00 AM – 6:00 PM',
        phone: '0917 890 1234',
        isActive: true,
        isFlagship: true,
        orderCount: 145
      },
      {
        id: 'hub-qc',
        name: 'Quezon City Artisan Studio Hub',
        address: '45 Katipunan Avenue, Loyola Heights, QC',
        operatingHours: 'Tue–Sun 9:00 AM – 7:00 PM',
        phone: '0918 321 9876',
        isActive: true,
        isFlagship: false,
        orderCount: 88
      }
    ];
  }, [hubs]);

  const [pickupStoreId, setPickupStoreId] = useState<string>(() => activeHubs[0]?.id || 'hub-pasig');
  
  // Selected Hub Object
  const currentSelectedHub = useMemo(() => {
    return activeHubs.find((h) => h.id === pickupStoreId) || activeHubs[0];
  }, [activeHubs, pickupStoreId]);

  // Check if selected date is in blackoutDates
  const blackoutWarning = useMemo(() => {
    if (!selectedDate) return null;
    return blackoutDates.find((b) => b.date === selectedDate);
  }, [blackoutDates, selectedDate]);

  // Address state (Defaults to Cavite delivery)
  const [country, setCountry] = useState('Philippines');
  const [firstName, setFirstName] = useState('Maria');
  const [lastName, setLastName] = useState('Santos');
  const [streetAddress, setStreetAddress] = useState('123 Aguinaldo Highway');
  const [apartment, setApartment] = useState('Unit 4B');
  const [barangay, setBarangay] = useState('Palico IV');
  const [postalCode, setPostalCode] = useState('4103');
  const [city, setCity] = useState('Imus City');
  const [region, setRegion] = useState('Cavite');
  const [phone, setPhone] = useState('0917 890 1234');
  const [saveInfo, setSaveInfo] = useState(true);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [billingOption, setBillingOption] = useState<'same' | 'different'>('same');
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);

  // Billing Address state (when different)
  const [billingCountry, setBillingCountry] = useState('Philippines');
  const [billingFirstName, setBillingFirstName] = useState('');
  const [billingLastName, setBillingLastName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingApartment, setBillingApartment] = useState('');
  const [billingBarangay, setBillingBarangay] = useState('');
  const [billingPostalCode, setBillingPostalCode] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingRegion, setBillingRegion] = useState('Cavite');
  const [billingPhone, setBillingPhone] = useState('');

  // Order state
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<AdminOrder | null>(null);
  const [orderedItemsSnapshot, setOrderedItemsSnapshot] = useState<CartItem[]>([]);
  const [snapshotTotalAmount, setSnapshotTotalAmount] = useState<number>(0);
  const [snapshotPaymentMethod, setSnapshotPaymentMethod] = useState<PaymentStatus>('GCash (Paid)');
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [paymongoPendingSession, setPaymongoPendingSession] = useState<{
    url: string;
    order: AdminOrder;
    ref: string;
  } | null>(null);
  const [paymongoError, setPaymongoError] = useState<string | null>(null);

  // Cavite Location & Zone Calculations
  const matchedCaviteLocation = useMemo(() => {
    if (region !== 'Cavite') return undefined;
    return getCaviteLocation(city);
  }, [region, city]);

  const isCaviteDelivery = region === 'Cavite' && city !== 'Other (Outside Cavite)' && !!matchedCaviteLocation;

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const baseDeliveryFee = matchedCaviteLocation ? matchedCaviteLocation.deliveryFee : 100;
  const isFreeDelivery = fulfillment === 'pickup' || subtotal >= 1500;
  const deliveryFee = fulfillment === 'pickup' ? 0 : isFreeDelivery ? 0 : baseDeliveryFee;
  const totalAmount = Math.max(0, subtotal + deliveryFee);
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Helper to format date into friendly human text
  const formatReadableDate = (dateStr: string): string => {
    if (!dateStr) return 'Tomorrow';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    const randomRef = `#SHEY-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderRef(randomRef);

    // Save snapshot of order items and financial totals before cart is cleared
    const currentCartSnapshot = [...cartItems];
    setOrderedItemsSnapshot(currentCartSnapshot);
    setSnapshotTotalAmount(totalAmount);

    const fullAddress = fulfillment === 'ship'
      ? `${streetAddress}${apartment ? `, ${apartment}` : ''}, ${barangay}, ${city}, ${region} ${postalCode}`
      : undefined;

    const hubName = fulfillment === 'pickup'
      ? (currentSelectedHub?.name || 'Pasig Flagship Bakery & Oven Kitchen')
      : undefined;

    const readableDate = formatReadableDate(selectedDate);
    const scheduledDispatchSummary = readableDate;

    // Determine initial payment status string
    let initialPaymentStatus: PaymentStatus = 'COD (Pending COD)';
    if (paymentMethod === 'online') {
      initialPaymentStatus = 'GCash (Paid)';
    } else if (paymentMethod === 'cod') {
      initialPaymentStatus = fulfillment === 'pickup' ? 'Cash at Pickup (Paid)' : 'COD (Pending COD)';
    }

    setSnapshotPaymentMethod(initialPaymentStatus);

    const newOrder: AdminOrder = {
      id: generateUniqueId('ord'),
      orderNumber: randomRef,
      customerName: `${firstName} ${lastName}`.trim() || 'Valued Bakery Guest',
      customerPhone: phone || '0917 890 1234',
      customerEmail: email || 'customer@example.com',
      type: fulfillment === 'pickup' ? 'Store Pickup' : 'Doorstep Delivery',
      status: 'New',
      deliveryDate: readableDate,
      targetDate: selectedDate,
      items: currentCartSnapshot.map((item) => ({
        name: item.product.name,
        boxSize: (item.notes && item.notes.includes('Option:') ? item.notes.replace('Option: ', '') : item.notes) || (item.product.boxVariants && item.product.boxVariants[0]) || (item.product.variants && item.product.variants[0]) || 'Box of 10',
        quantity: item.quantity,
        price: item.product.price,
      })),
      totalAmount: totalAmount,
      paymentMethod: initialPaymentStatus,
      pickupHub: hubName,
      address: fulfillment === 'ship' ? {
        street: streetAddress,
        apartment: apartment || undefined,
        barangay: barangay,
        city: city,
        postalCode: postalCode,
        region: region
      } : undefined,
      deliveryAddress: fullAddress,
      deliveryNotes: `Online order. ${fulfillment === 'ship' ? `Deliver to ${city}.` : `Pickup at ${hubName}.`} Scheduled for ${scheduledDispatchSummary}.`,
      customCakeNotes: orderInstructions || undefined,
      referenceNumber: randomRef,
      createdAt: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };

    // If PayMongo method selected (GCash / Maya / QR Ph): Initiate session & open payment gateway
    if (paymentMethod === 'online') {
      setIsInitiatingPayment(true);
      setPaymongoError(null);

      try {
        const sessionRes = await createPayMongoCheckoutSession({
          items: currentCartSnapshot.map((item) => ({
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            boxSize: item.notes || item.product.boxVariants?.[0] || 'Standard Box'
          })),
          customer: {
            name: `${firstName} ${lastName}`.trim() || 'Valued Bakery Guest',
            email: email || 'customer@example.com',
            phone: phone || '0917 890 1234'
          },
          deliveryFee: fulfillment === 'ship' ? deliveryFee : 0,
          orderRef: randomRef,
          paymentMethodType: 'all',
          fulfillment: fulfillment
        });

        // If a valid checkout URL is returned from PayMongo
        if (sessionRes?.checkoutUrl) {
          try {
            localStorage.setItem('sheys_pending_order', JSON.stringify(newOrder));
          } catch (e) {
            console.warn('Could not save pending order to storage:', e);
          }

          setPaymongoPendingSession({
            url: sessionRes.checkoutUrl,
            order: newOrder,
            ref: randomRef
          });

          // Immediate navigation to PayMongo hosted payment portal
          window.location.href = sessionRes.checkoutUrl;
          return;
        }

        throw new Error('No payment URL received from PayMongo.');
      } catch (err: any) {
        console.error('PayMongo checkout session init error:', err);
        setPaymongoError(err?.message || 'Unable to connect to PayMongo payment gateway. Please make sure PAYMONGO_SECRET_KEY is configured in your Vercel Environment Variables.');
      } finally {
        setIsInitiatingPayment(false);
      }
      return;
    }

    // Direct Cash on Delivery / Counter Pickup
    setConfirmedOrder(newOrder);

    if (onPlaceOrder) {
      onPlaceOrder(newOrder);
    }

    setIsOrderComplete(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper: confirm completed PayMongo payment from modal
  const handleConfirmPayMongoCompleted = () => {
    if (!paymongoPendingSession) return;
    const paidOrder: AdminOrder = {
      ...paymongoPendingSession.order,
      paymentMethod: 'GCash (Paid)'
    };
    setSnapshotPaymentMethod('GCash (Paid)');
    setConfirmedOrder(paidOrder);
    if (onPlaceOrder) {
      onPlaceOrder(paidOrder);
    }
    setPaymongoPendingSession(null);
    setIsOrderComplete(true);
    try {
      localStorage.removeItem('sheys_pending_order');
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Order Confirmation Screen (Structured after the 3 reference cards, with Shey's Bakery theme)
  if (isOrderComplete) {
    const confirmationItems = orderedItemsSnapshot.length > 0 ? orderedItemsSnapshot : cartItems;
    const finalPaidAmount = snapshotTotalAmount > 0 ? snapshotTotalAmount : totalAmount;
    const finalPaymentMethod = snapshotPaymentMethod || paymentMethod;

    return (
      <div className="bg-[#faf5ea] min-h-screen text-[#552110] py-10 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
          
          {/* Top Center Confirmation Checkmark & Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img
                src="https://img.icons8.com/?size=100&id=hSBuomv1RRIu&format=png&color=D94D2F"
                alt="Order Confirmed"
                referrerPolicy="no-referrer"
                className="w-16 h-16 object-contain"
              />
            </div>
            
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#552110] tracking-tight">
              Thank you for your order!
            </h1>
            
            <p className="text-sm text-[#8b634b] mt-2 font-medium">
              Your order has been received and is being processed
            </p>

            {/* Order Number Box with Copy Action */}
            <div className="flex justify-center mt-5">
              <div className="bg-white border border-[#ebdcd0] rounded-2xl px-5 py-2.5 flex items-center gap-4 shadow-2xs">
                <div className="text-left">
                  <span className="text-[11px] font-semibold text-[#8b634b] block uppercase tracking-wider">
                    Order number
                  </span>
                  <span className="font-mono font-bold text-sm sm:text-base text-[#552110]">
                    {orderRef}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(orderRef);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }
                  }}
                  className="p-2 rounded-xl text-[#8b634b] hover:text-[#552110] hover:bg-[#faf5ea] transition-colors border border-transparent hover:border-[#ebdcd0] cursor-pointer"
                  title="Copy order number"
                >
                  {isCopied ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <Check className="w-4 h-4" /> Copied!
                    </span>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* CARD 1: Order Summary (Ref Image 1) */}
          <div className="bg-white rounded-2xl border border-[#ebdcd0] p-5 sm:p-6 shadow-2xs transition-all">
            <button
              type="button"
              onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
              className="w-full flex items-center justify-between font-serif text-lg sm:text-xl font-bold text-[#552110] text-left cursor-pointer select-none"
            >
              <span>Order Summary</span>
              {isOrderSummaryOpen ? (
                <ChevronUp className="w-5 h-5 text-[#8b634b]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#8b634b]" />
              )}
            </button>

            {isOrderSummaryOpen && (
              <div className="mt-4 pt-4 border-t border-[#ebdcd0] space-y-4">
                {/* Items list */}
                <div className="space-y-4">
                  {confirmationItems.length > 0 ? (
                    confirmationItems.map((item, idx) => (
                      <div key={`${item.product.id}-${idx}`} className="flex items-center gap-3.5 justify-between">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={getOptimizedImageUrl(item.product.image, { width: 150, quality: 75 })}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 object-cover rounded-xl border border-[#ebdcd0] bg-[#faf5ea] shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-[#552110] truncate">
                              {item.product.name}
                            </h4>
                            {item.notes && (
                              <p className="text-xs text-[#8b634b] truncate">{item.notes}</p>
                            )}
                            <p className="text-xs text-[#8b634b] mt-0.5">
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="font-bold text-sm sm:text-base text-[#552110] text-right shrink-0">
                          ₱{(item.product.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))
                  ) : confirmedOrder?.items && confirmedOrder.items.length > 0 ? (
                    confirmedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3.5 justify-between">
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-[#552110] truncate">
                            {item.name}
                          </h4>
                          {item.boxSize && (
                            <p className="text-xs text-[#8b634b] truncate">{item.boxSize}</p>
                          )}
                          <p className="text-xs text-[#8b634b] mt-0.5">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="font-bold text-sm sm:text-base text-[#552110] text-right shrink-0">
                          ₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#8b634b]">No item details available.</p>
                  )}
                </div>

                {/* Calculation breakdown */}
                <div className="border-t border-[#ebdcd0] pt-4 space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-[#8b634b]">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#552110]">
                      ₱{(subtotal || (finalPaidAmount - (fulfillment === 'ship' ? deliveryFee : 0))).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#8b634b]">
                    <span>Shipping</span>
                    <span className="font-semibold text-[#552110]">
                      {fulfillment === 'ship' ? (deliveryFee > 0 ? `₱${deliveryFee.toFixed(2)}` : 'Free') : 'Free'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#8b634b]">
                    <span>Payment method</span>
                    <span className="font-semibold text-[#552110] flex items-center gap-1.5">
                      {finalPaymentMethod.includes('Paid') && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                      )}
                      <span>{finalPaymentMethod}</span>
                    </span>
                  </div>
                  <div className="flex justify-between text-base sm:text-lg font-bold text-[#552110] pt-2 border-t border-[#ebdcd0]">
                    <span>Total</span>
                    <span className="text-[#d94d2f]">
                      ₱{finalPaidAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} PHP
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: Delivery / Fulfillment Details (Ref Image 2) */}
          <div className="bg-white rounded-2xl border border-[#ebdcd0] p-5 sm:p-6 shadow-2xs space-y-5">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#552110]">
              {fulfillment === 'ship' ? 'Delivery Details' : 'Pickup Details'}
            </h2>

            {/* Shipping / Destination Address with Pin Icon */}
            <div className="flex items-start gap-3.5">
              <MapPin className="w-5 h-5 text-[#8b634b] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-[#8b634b] space-y-0.5">
                <span className="font-semibold text-[#552110] block text-sm">
                  {fulfillment === 'ship' ? 'Shipping to' : 'Pickup location'}
                </span>
                {fulfillment === 'ship' ? (
                  <>
                    <p className="font-medium text-[#552110]">{firstName} {lastName}</p>
                    <p>{streetAddress}{apartment ? `, ${apartment}` : ''}</p>
                    <p>{barangay}, {city}, {region} {postalCode}</p>
                    <p className="text-[11px] text-[#8b634b] pt-0.5">Mobile: {phone}</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-[#552110]">{currentSelectedHub?.name}</p>
                    <p>{currentSelectedHub?.address}</p>
                    <p className="text-[11px] text-[#8b634b] pt-0.5">{currentSelectedHub?.operatingHours}</p>
                    <p className="text-[11px] text-[#8b634b]">Customer: {firstName} {lastName} ({phone})</p>
                  </>
                )}
              </div>
            </div>

            {/* Shipping Method with Truck Icon */}
            <div className="flex items-start gap-3.5 pt-4 border-t border-[#ebdcd0]">
              {fulfillment === 'ship' ? (
                <Truck className="w-5 h-5 text-[#8b634b] shrink-0 mt-0.5" />
              ) : (
                <Store className="w-5 h-5 text-[#8b634b] shrink-0 mt-0.5" />
              )}
              <div className="text-xs sm:text-sm text-[#8b634b] space-y-0.5">
                <span className="font-semibold text-[#552110] block text-sm">
                  {fulfillment === 'ship' ? 'Shipping method' : 'Fulfillment method'}
                </span>
                <p className="text-[#552110] font-medium">
                  {fulfillment === 'ship'
                    ? `Shipping Delivery (${deliveryFee > 0 ? `₱${deliveryFee.toFixed(2)}` : 'Free'})`
                    : 'Store Pickup Hub (Free)'}
                </p>
              </div>
            </div>

            {/* Highlighted Estimated Delivery Callout Box */}
            <div className="bg-[#faf5ea] border border-[#ebdcd0] rounded-xl p-4 flex items-start gap-3.5">
              <Package className="w-5 h-5 text-[#d94d2f] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm space-y-0.5">
                <span className="font-bold text-[#552110] block text-sm">
                  {fulfillment === 'ship' ? 'Estimated delivery' : 'Confirmed pickup schedule'}
                </span>
                <p className="font-semibold text-[#552110]">
                  {formatReadableDate(selectedDate)}
                </p>
              </div>
            </div>
          </div>

          {/* CARD 3: Appreciation & Action Buttons (Ref Image 3) */}
          <div className="bg-white rounded-2xl border border-[#ebdcd0] p-6 sm:p-8 shadow-2xs text-center space-y-3">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#552110]">
              Thanks for choosing us! Enjoy your treats!
            </h3>
            <p className="text-xs sm:text-sm text-[#8b634b] max-w-md mx-auto">
              Your support lets us keep baking quality pastries with love.
            </p>
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClearCart();
                  onNavigateCatalog('All Products');
                }}
                className="w-full sm:w-auto min-w-[180px] bg-[#d94d2f] hover:bg-[#c03d21] text-white font-bold text-sm py-3 px-8 rounded-full border border-[#542515] shadow-[0px_2px_0px_#542515] transition-all cursor-pointer active:translate-y-0.5 active:shadow-none"
              >
                Continue shopping
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearCart();
                  onNavigateHome();
                }}
                className="w-full sm:w-auto min-w-[150px] bg-white hover:bg-[#faf5ea] text-[#552110] font-semibold text-sm py-3 px-6 rounded-full border border-[#ebdcd0] transition-colors cursor-pointer"
              >
                Back to home
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // 2. Main Checkout View
  return (
    <div className="min-h-screen bg-[#faf5ea] font-sans">
      
      {/* Checkout Minimalist Top Header */}
      <header className="bg-[#faf5ea] border-b border-[#ebdcd0] sticky top-0 z-30">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Bakery Logo Mark (aligned with checkout form) */}
          <div className="lg:col-span-7 xl:col-span-7 flex justify-start lg:pl-[10%] xl:pl-[15%]">
            <div className="w-full max-w-2xl px-6 sm:px-10 lg:px-6 h-20 flex items-center justify-between lg:justify-start">
              <button
                onClick={onNavigateHome}
                className="group flex items-center cursor-pointer focus:outline-none"
                aria-label="Shey's Bakery Home"
              >
                <img
                  src={BRAND_LOGO.src}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = BRAND_LOGO.fallbackSrc;
                  }}
                  alt={BRAND_LOGO.alt}
                  referrerPolicy="no-referrer"
                  className="h-[58px] sm:h-[60px] w-auto object-contain group-hover:scale-105 transition-transform rounded-md shadow-2xs"
                />
              </button>

              {/* Mobile / Tablet Cart Button (hidden on lg where right column header takes over) */}
              <div className="flex lg:hidden items-center">
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="relative p-2 sm:p-2.5 rounded-full text-[#4a170a] hover:text-[#d01617] hover:bg-amber-100/60 transition-all focus:outline-none flex items-center justify-center group cursor-pointer"
                  aria-label="Shopping Cart"
                >
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform stroke-[1.85]" />
                  {totalItemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#d94d2f] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#faf5ea] shadow-xs transition-colors">
                      {totalItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Shopping Bag Button (precisely aligned with the right order summary column and price boundaries) */}
          <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 justify-start">
            <div className="w-full max-w-lg px-6 sm:px-10 lg:px-12 h-20 flex items-center justify-end">
              <button
                type="button"
                onClick={onOpenCart}
                className="relative p-2 sm:p-2.5 rounded-full text-[#4a170a] hover:text-[#d01617] hover:bg-amber-100/60 transition-all focus:outline-none flex items-center justify-center group cursor-pointer"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform stroke-[1.85]" />
                {totalItemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#d94d2f] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#faf5ea] shadow-xs transition-colors">
                    {totalItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main 2-Column Split Layout */}
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-65px)]">
          
          {/* 2. LEFT COLUMN — Checkout Form Flow (Warm Cream background - #faf5ea) */}
          <div className="lg:col-span-7 xl:col-span-7 bg-[#faf5ea] flex justify-start lg:pl-[10%] xl:pl-[15%]">
            <div className="w-full max-w-2xl p-6 sm:p-10 lg:p-6 lg:py-10 space-y-8">
            
            <form onSubmit={handlePayNow} className="space-y-8">
              
              {/* SECTION A: Delivery / Fulfillment Method Toggle */}
              <div className="space-y-4">
                <h2 className="font-serif text-[24px] font-black text-[#4a170a]">
                  Delivery or Store Pickup
                </h2>

                {/* Segmented Control Pill Switcher */}
                <div className="p-1 bg-[#eae4d9] rounded-2xl flex items-center border border-[#dfd7c9] shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setFulfillment('ship')}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      fulfillment === 'ship'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'bg-transparent text-gray-800 hover:text-black'
                    }`}
                  >
                    <Package className="w-4 h-4 stroke-[2.2]" />
                    <span>Ship</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillment('pickup')}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      fulfillment === 'pickup'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'bg-transparent text-gray-800 hover:text-black'
                    }`}
                  >
                    <MapPin className="w-4 h-4 stroke-[2.2]" />
                    <span>Pickup</span>
                  </button>
                </div>
              </div>

              {/* SECTION B: Contact & Fulfillment Location Details */}
              <div className="space-y-4">
                <h2 className="font-serif text-[24px] font-black text-[#4a170a]">
                  {fulfillment === 'ship' ? 'Shipping Address' : 'Bakery Pickup Hub Selection'}
                </h2>

                {fulfillment === 'ship' ? (
                  /* Address Form Fields for Delivery */
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Maria"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#4a170a] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Santos"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#4a170a] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. maria.santos@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#4a170a] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="House / Bldg No., Street Name"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#4a170a] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                          Apartment, Suite (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Unit 4B, Tower 1"
                          value={apartment}
                          onChange={(e) => setApartment(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#4a170a] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                          Barangay *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Brgy. Kapitolyo"
                          value={barangay}
                          onChange={(e) => setBarangay(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#4a170a] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                          Region / Province *
                        </label>
                        <select
                          value={region}
                          onChange={(e) => {
                            const newRegion = e.target.value;
                            setRegion(newRegion);
                            if (newRegion === 'Cavite') {
                              setCity('Imus City');
                              setPostalCode('4103');
                            } else {
                              setCity('Other (Outside Cavite)');
                            }
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm font-medium text-[#4a170a] bg-white focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-all"
                        >
                          <option value="Cavite">Cavite (Delivery Active)</option>
                          <option value="Metro Manila">Metro Manila (Outside Delivery Area)</option>
                          <option value="Laguna">Laguna (Outside Delivery Area)</option>
                          <option value="Rizal">Rizal (Outside Delivery Area)</option>
                          <option value="Bulacan">Bulacan (Outside Delivery Area)</option>
                          <option value="Other">Other Province (Outside Delivery Area)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                          City / Municipality in Cavite *
                        </label>
                        {region === 'Cavite' ? (
                          <select
                            value={city}
                            onChange={(e) => {
                              const newCity = e.target.value;
                              setCity(newCity);
                              const loc = getCaviteLocation(newCity);
                              if (loc) {
                                setPostalCode(loc.postalCode);
                              }
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm font-medium text-[#4a170a] bg-white focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-all"
                          >
                            {CAVITE_LOCATIONS.map((loc) => (
                              <option key={loc.name} value={loc.name}>
                                {loc.name}
                              </option>
                            ))}
                            <option value="Other (Outside Cavite)">
                              Other (Outside Cavite)
                            </option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Enter your city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#4a170a] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-all"
                          />
                        )}
                      </div>
                    </div>

                    {/* Non-Cavite Address Friendly Informational Message (without blocking) */}
                    {!(region === 'Cavite' && matchedCaviteLocation) && (
                      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold text-amber-900">
                            We currently deliver within Cavite only
                          </p>
                          <p className="text-amber-800 text-[11px] leading-relaxed">
                            Our motorized doorstep delivery is currently restricted to Cavite cities and municipalities. If your address is outside Cavite, you can still select <strong>Store Pickup</strong> above to collect your freshly baked order at our bakery!
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                          Postal Code *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 4103"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#4a170a] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                          Mobile Phone * (SMS delivery updates)
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 0917 890 1234"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#4a170a] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-all"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm text-[#4a170a] font-medium pt-1">
                      <input
                        type="checkbox"
                        checked={saveInfo}
                        onChange={(e) => setSaveInfo(e.target.checked)}
                        className="w-4 h-4 rounded-md text-amber-500 border-gray-300 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                      />
                      <span>Save this shipping information for faster checkout next time</span>
                    </label>

                  </div>
                ) : (
                  /* Store Pickup Location Selector */
                  <div className="space-y-4 pt-2">
                    <div className="text-xs font-bold text-[#4a170a] uppercase tracking-wider">
                      Select Bakery Pickup Hub:
                    </div>

                    <div className="space-y-3">
                      {activeHubs.map((hub) => {
                        const isSelected = pickupStoreId === hub.id;
                        return (
                          <label
                            key={hub.id}
                            onClick={() => setPickupStoreId(hub.id)}
                            className={`p-4 rounded-2xl border-2 block cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#d94d2f] bg-white ring-1 ring-[#d94d2f]/30 shadow-xs'
                                : 'border-[#ebdcd0] hover:border-amber-400 bg-white shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="pickupStoreRadio"
                                checked={isSelected}
                                onChange={() => setPickupStoreId(hub.id)}
                                className="mt-1 text-[#d94d2f] focus:ring-amber-400 accent-[#d94d2f] cursor-pointer"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-sm text-[#4a170a]">
                                    {hub.name}
                                  </span>
                                  {hub.isFlagship && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-[#4a170a] px-2 py-0.5 rounded-full">
                                      Flagship Oven
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-stone-600 mt-0.5">
                                  {hub.address}
                                </div>
                                <div className="text-[11px] text-amber-800 font-bold mt-1.5 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-[#d94d2f]" />
                                  <span>Pickup Window: {hub.operatingHours}</span>
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {/* Customer Info for Pickup */}
                    <div className="space-y-4 pt-4 border-t border-[#ebdcd0]">
                      <div className="text-xs font-bold text-[#4a170a] uppercase tracking-wider">
                        Pickup Contact Person:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                            First Name *
                          </label>
                          <input
                            type="text"
                            required={fulfillment === 'pickup'}
                            placeholder="e.g. Maria"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#4a170a] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            required={fulfillment === 'pickup'}
                            placeholder="e.g. Santos"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#4a170a] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required={fulfillment === 'pickup'}
                            placeholder="e.g. maria.santos@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#4a170a] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                            Mobile Phone * (SMS pickup alert)
                          </label>
                          <input
                            type="tel"
                            required={fulfillment === 'pickup'}
                            placeholder="e.g. 0917 890 1234"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#4a170a] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-all"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* SECTION C: Shipping Method (Only shown for delivery) */}
              {fulfillment === 'ship' && (
                <div className="space-y-3">
                  <h2 className="font-serif text-[24px] font-black text-[#4a170a]">
                    Shipping Method
                  </h2>

                  <div className="p-4 rounded-2xl border border-[#ebdcd0] bg-white shadow-2xs flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <div className="font-bold text-[#4a170a]">
                        Shipping Delivery
                      </div>
                      {matchedCaviteLocation && (
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {matchedCaviteLocation.name}, Cavite
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <span className="font-extrabold text-[#4a170a] block">
                        {deliveryFee === 0 ? 'FREE' : `₱${deliveryFee}.00`}
                      </span>
                      {deliveryFee === 0 && (
                        <span className="text-[10px] text-emerald-600 font-bold block">
                          Free Delivery
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION D: Payment Selection */}
              <div className="space-y-4">
                <div>
                  <h2 className="font-serif text-[24px] font-black text-[#4a170a]">
                    Payment
                  </h2>
                  <p className="text-xs text-stone-600 mt-0.5">
                    All transactions are secure and encrypted via PayMongo PH.
                  </p>
                </div>

                {/* Stacked Radio Options Card with white background */}
                <div className="border border-[#ebdcd0] rounded-2xl overflow-hidden divide-y divide-[#ebdcd0] bg-white shadow-2xs">
                  
                  {/* Option 1: Shared GCash, Maya (PayMaya), & QR Ph */}
                  <div>
                    <label
                      onClick={() => setPaymentMethod('online')}
                      className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-colors ${
                        paymentMethod === 'online' ? 'bg-[#f8fbfd] font-semibold' : 'bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'online'}
                          onChange={() => setPaymentMethod('online')}
                          className="text-[#d94d2f] focus:ring-[#d94d2f] accent-[#d94d2f] cursor-pointer"
                        />
                        <div>
                          <div className="text-sm font-bold text-[#4a170a]">
                            GCash, Maya & QR Ph
                          </div>
                          <div className="text-[11px] text-stone-500 font-normal">
                            Instant digital payment via PayMongo (All PH Banks & Wallets)
                          </div>
                        </div>
                      </div>

                      {/* Graphic symbols on the right */}
                      <div className="flex items-center -space-x-1.5 shrink-0 pl-2">
                        <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-black text-xs flex items-center justify-center ring-2 ring-white shadow-xs">
                          G
                        </div>
                        <div className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center ring-2 ring-white shadow-xs">
                          M
                        </div>
                        <div className="w-6 h-6 rounded-md bg-[#d94d2f] text-white font-black text-[9px] flex items-center justify-center ring-2 ring-white shadow-xs">
                          QR
                        </div>
                      </div>
                    </label>

                    {paymentMethod === 'online' && (
                      <div className="bg-white border-t border-[#ebdcd0] px-6 py-4 text-center text-xs text-[#5c3d2e] animate-fadeIn">
                        <p className="max-w-md mx-auto leading-relaxed">
                          You will proceed directly to PayMongo's secure payment checkout to pay with <strong>GCash</strong>, <strong>Maya</strong>, or <strong>QR Ph</strong> (All Philippine Banks & E-Wallets).
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Option 2: Cash on Delivery / Counter Pickup */}
                  <div>
                    <label
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-colors ${
                        paymentMethod === 'cod' ? 'bg-[#fffcf7] font-semibold' : 'bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                        />
                        <div>
                          <div className="text-sm font-bold text-[#4a170a]">
                            {fulfillment === 'pickup' ? 'Cash at Bakery Counter' : 'Cash on Delivery (COD)'}
                          </div>
                          <div className="text-[11px] text-stone-500 font-normal">
                            {fulfillment === 'pickup' ? 'Pay upon order pickup' : 'Pay rider upon doorstep delivery'}
                          </div>
                        </div>
                      </div>

                      {/* Graphic symbol on the right */}
                      <div className="flex items-center shrink-0 pl-2">
                        <div className="w-7 h-6 rounded-md border border-emerald-500/30 bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Banknote className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>
                    </label>

                    {paymentMethod === 'cod' && (
                      <div className="bg-white border-t border-[#ebdcd0] px-6 py-4 text-center text-xs text-[#5c3d2e] animate-fadeIn">
                        <p className="max-w-md mx-auto leading-relaxed">
                          {fulfillment === 'pickup'
                            ? 'Pay upon picking up your freshly baked goodies at the counter.'
                            : 'Pay exact cash upon doorstep delivery to our rider.'}
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* SECTION G: Billing Address Selection (Only shown for delivery) */}
              {fulfillment === 'ship' && (
                <div className="space-y-3">
                  <h2 className="font-serif text-[24px] font-black text-[#4a170a]">
                    Billing Address
                  </h2>

                  <div className="border border-[#ebdcd0] rounded-2xl overflow-hidden divide-y divide-[#ebdcd0] bg-white shadow-2xs text-xs sm:text-sm font-medium">
                    <label
                      onClick={() => setBillingOption('same')}
                      className={`p-4 sm:p-5 flex items-center gap-3 cursor-pointer transition-colors ${
                        billingOption === 'same' ? 'bg-[#fffcf7] font-semibold text-[#4a170a]' : 'bg-white hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="billingOption"
                        checked={billingOption === 'same'}
                        onChange={() => setBillingOption('same')}
                        className="text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                      />
                      <span>Same as shipping address</span>
                    </label>

                    <div>
                      <label
                        onClick={() => setBillingOption('different')}
                        className={`p-4 sm:p-5 flex items-center gap-3 cursor-pointer transition-colors ${
                          billingOption === 'different' ? 'bg-[#fffcf7] font-semibold text-[#4a170a]' : 'bg-white hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="billingOption"
                          checked={billingOption === 'different'}
                          onChange={() => setBillingOption('different')}
                          className="text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                        />
                        <span>Use a different billing address</span>
                      </label>

                      {billingOption === 'different' && (
                        <div className="bg-white border-t border-[#ebdcd0] p-4 sm:p-5 space-y-3 animate-fadeIn">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              required={fulfillment === 'ship' && billingOption === 'different'}
                              placeholder="First name"
                              value={billingFirstName}
                              onChange={(e) => setBillingFirstName(e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-[#4a170a] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20"
                            />
                            <input
                              type="text"
                              required={fulfillment === 'ship' && billingOption === 'different'}
                              placeholder="Last name"
                              value={billingLastName}
                              onChange={(e) => setBillingLastName(e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-[#4a170a] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20"
                            />
                          </div>

                          <input
                            type="text"
                            required={fulfillment === 'ship' && billingOption === 'different'}
                            placeholder="Street address, building, house no."
                            value={billingAddress}
                            onChange={(e) => setBillingAddress(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-[#4a170a] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20"
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              required={fulfillment === 'ship' && billingOption === 'different'}
                              placeholder="Barangay"
                              value={billingBarangay}
                              onChange={(e) => setBillingBarangay(e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-[#4a170a] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20"
                            />
                            <input
                              type="text"
                              required={fulfillment === 'ship' && billingOption === 'different'}
                              placeholder="City"
                              value={billingCity}
                              onChange={(e) => setBillingCity(e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-[#4a170a] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error banner if PayMongo connection fails */}
              {paymongoError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-3 text-red-800 text-xs sm:text-sm">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{paymongoError}</p>
                    <p className="text-red-700/80 text-xs mt-0.5">
                      You can retry or select Cash on Delivery / Counter Pickup.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION H: Action CTA Button */}
              <div className="pt-6 border-t border-[#ebdcd0] space-y-3">
                <button
                  type="submit"
                  disabled={cartItems.length === 0 || isInitiatingPayment}
                  className="w-full bg-[#d94d2f] hover:bg-[#c03d21] disabled:bg-[#d94d2f]/60 text-white font-bold py-4 px-6 rounded-2xl border border-[#542515] shadow-[0px_3px_0px_#542515] transition-all duration-200 text-center cursor-pointer text-base sm:text-lg flex items-center justify-center gap-2 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed"
                >
                  {isInitiatingPayment ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Connecting to PayMongo...</span>
                    </>
                  ) : paymentMethod === 'cod' ? (
                    <span>Confirm Bakery Order</span>
                  ) : (
                    <span>Proceed to Payment</span>
                  )}
                </button>
              </div>

            </form>

            {/* Minimalist Footer inside form column */}
            <div className="pt-12 border-t border-gray-200 text-xs text-gray-500 space-y-2">
              <p>© 2026 Shey's Bakery. All rights reserved.</p>
            </div>

            </div>
          </div>

          {/* 3. RIGHT COLUMN — Sticky Order Summary Panel (Dark Brown Background - #4a170a extending to right screen edge) */}
          <div className="lg:col-span-5 xl:col-span-5 bg-[#4a170a] text-amber-50 border-l border-amber-900/40 flex justify-start">
            
            <div className="w-full max-w-lg p-6 sm:p-10 lg:p-12 space-y-6 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
              
              {/* Itemized Cart List */}
              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-amber-200/60 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-[#d94d2f] mx-auto opacity-70" />
                  <p className="text-sm font-semibold">Your bakery order is empty.</p>
                  <button
                    onClick={onNavigateCatalog}
                    className="text-xs text-[#d01617] bg-white font-bold px-4 py-2 rounded-xl shadow-xs hover:bg-amber-100 cursor-pointer"
                  >
                    Browse Bakes
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item, idx) => {
                    const itemKey = item.id || `${item.product.id}-${item.notes || 'single'}-${idx}`;
                    const isBundle = item.variant ? isBundleVariant(item.variant) : (item.notes ? isBundleVariant(item.notes) : false);

                    return (
                      <div key={itemKey} className="flex items-center gap-4">
                        
                        {/* Thumbnail with quantity badge overlay */}
                        <div className="relative shrink-0">
                          <img
                            src={getOptimizedImageUrl(item.product.image, { width: 150, quality: 75 })}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 object-cover rounded-2xl border-2 border-white shadow-md bg-[#361007]"
                          />
                          <span className="absolute -top-2 -right-2 bg-[#d94d2f] text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                            {item.quantity}
                          </span>
                        </div>

                        {/* Product Name & Variant */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-normal text-sm text-amber-100 truncate">
                            {item.product.name}
                          </h4>
                          {item.notes && (
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <p className="text-xs text-amber-200/70 truncate">
                                {item.notes}
                              </p>
                              {isBundle && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase bg-[#d94d2f] text-white px-1.5 py-0.2 rounded">
                                  <Tag className="w-2 h-2" />
                                  10% OFF
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Calculated Price */}
                        <div className="text-right">
                          <div className="font-normal text-sm text-amber-100">
                            ₱{(item.product.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          {item.rawPrice && item.rawPrice > item.product.price && (
                            <div className="text-[11px] text-amber-300/50 line-through">
                              ₱{(item.rawPrice * item.quantity).toFixed(0)}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cost Breakdown Summary */}
              <div className="pt-2 space-y-2.5 text-sm">
                
                <div className="flex items-center justify-between text-amber-200/80 leading-normal">
                  <span>Subtotal</span>
                  <span className="font-normal text-amber-100">
                    ₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP
                  </span>
                </div>

                {cartItems.some((i) => (i.savings || 0) > 0) && (
                  <div className="flex items-center justify-between text-emerald-300 text-xs font-semibold">
                    <span>Bundle Savings</span>
                    <span>
                      -₱{cartItems.reduce((sum, i) => sum + ((i.savings || 0) * i.quantity), 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })} PHP
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-amber-200/80 leading-normal">
                  <span className="flex items-center gap-1.5">
                    <span>{fulfillment === 'pickup' ? 'Store Pickup' : 'Shipping / Delivery'}</span>
                  </span>
                  <span className="font-normal text-amber-100">
                    {deliveryFee === 0 ? 'FREE' : `₱${deliveryFee.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP`}
                  </span>
                </div>

                <div className="pt-3 flex items-baseline justify-between text-amber-50">
                  <div>
                    <span className="font-bold text-base block">Total</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[17px] font-serif font-black text-white block">
                      ₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>

      {/* PayMongo Payment Redirection / Portal Access Modal */}
      {paymongoPendingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fffcf7] rounded-3xl border border-[#ebdcd0] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 text-[#552110] relative">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 mx-auto flex items-center justify-center text-amber-700 shadow-xs">
                <ShieldCheck className="w-9 h-9 text-[#d94d2f]" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#552110] tracking-tight pt-2">
                PayMongo Payment Ready
              </h3>
              <p className="text-xs sm:text-sm text-[#8b634b]">
                Complete your payment with <strong>GCash</strong>, <strong>Maya</strong>, <strong>QR Ph</strong>, or <strong>Cards</strong>.
              </p>
            </div>

            {/* Order Brief Info */}
            <div className="bg-[#faf5ea] rounded-2xl border border-[#ebdcd0] p-4 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-[#8b634b]">
                <span>Order Reference</span>
                <span className="font-mono font-bold text-[#552110]">{paymongoPendingSession.ref}</span>
              </div>
              <div className="flex justify-between text-[#8b634b]">
                <span>Amount to Pay</span>
                <span className="font-bold text-[#d94d2f] text-sm sm:text-base">
                  ₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              <a
                href={paymongoPendingSession.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#d94d2f] hover:bg-[#c03d21] text-white font-bold py-3.5 px-6 rounded-2xl border border-[#542515] shadow-[0px_3px_0px_#542515] transition-all flex items-center justify-center gap-2 text-sm sm:text-base text-center cursor-pointer active:translate-y-0.5 active:shadow-none"
              >
                <span>Open PayMongo Payment Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={handleConfirmPayMongoCompleted}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Have Completed Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymongoPendingSession(null)}
                className="w-full bg-transparent hover:bg-amber-50 text-[#8b634b] hover:text-[#552110] font-medium py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Back to Checkout Form
              </button>
            </div>

            <div className="text-center">
              <p className="text-[11px] text-[#8b634b]/80">
                🔒 Official 256-bit SSL encrypted gateway via PayMongo Philippines
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
