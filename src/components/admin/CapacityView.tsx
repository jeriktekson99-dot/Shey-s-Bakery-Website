import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShoppingBag, 
  User, 
  Phone, 
  MapPin, 
  Eye, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  Search, 
  Plus, 
  Trash2, 
  Truck, 
  CalendarDays,
  X,
  ChevronDown
} from 'lucide-react';
import { AdminOrder, BlackoutDate, OrderStatus, getOrderStatusBadgeClass, normalizeOrderStatus } from './types';

interface CapacityViewProps {
  orders?: AdminOrder[];
  blackoutDates?: BlackoutDate[];
  onAddBlackoutDate?: (date: string, reason: string) => void;
  onRemoveBlackoutDate?: (id: string) => void;
  onViewOrderDetails?: (orderId: string) => void;
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export const CapacityView: React.FC<CapacityViewProps> = ({
  orders = [],
  blackoutDates = [],
  onAddBlackoutDate,
  onRemoveBlackoutDate,
  onViewOrderDetails,
  onUpdateOrderStatus,
  onDeleteOrder
}) => {
  // Mode Switch: 'calendar' (Calendar Selector) | 'pipeline' (Master Schedule Pipeline)
  const [activeViewMode, setActiveViewMode] = useState<'calendar' | 'pipeline'>('calendar');

  // Filter State: 'ALL' | 'PICKUP' | 'DELIVERY' | 'COMPLETED' | 'BLOCKED'
  const [filterState, setFilterState] = useState<'ALL' | 'PICKUP' | 'DELIVERY' | 'COMPLETED' | 'BLOCKED'>('ALL');

  // Calendar View State: currently displayed year and month (Default August 2026)
  const [viewDate, setViewDate] = useState<Date>(new Date(2026, 7, 1));
  
  // Selected date string in YYYY-MM-DD format
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-08-20');

  // Pipeline search
  const [pipelineSearch, setPipelineSearch] = useState<string>('');

  // Modal State for Blocking Date / Capacity
  const [showBlockModal, setShowBlockModal] = useState<boolean>(false);
  const [blockModalDate, setBlockModalDate] = useState<string>('2026-08-20');
  const [blockModalReason, setBlockModalReason] = useState<string>('Kitchen Capacity Reached');

  // Helper: Format Date object to YYYY-MM-DD string
  const formatDateKey = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Helper to extract or normalize YYYY-MM-DD from an order's deliveryDate string
  const extractDateFromOrder = (order: AdminOrder): string => {
    if (order.targetDate && /^\d{4}-\d{2}-\d{2}$/.test(order.targetDate)) {
      return order.targetDate;
    }
    const text = order.deliveryDate || '';
    const match = text.match(/(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];

    if (text.toLowerCase().includes('today')) return '2026-08-20';
    if (text.toLowerCase().includes('yesterday')) return '2026-08-19';
    if (text.toLowerCase().includes('tomorrow')) return '2026-08-21';

    return '2026-08-20';
  };

  // Map orders by YYYY-MM-DD date key
  const ordersByDate = useMemo(() => {
    const map: Record<string, AdminOrder[]> = {};
    orders.forEach((ord) => {
      const dateKey = extractDateFromOrder(ord);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(ord);
    });
    return map;
  }, [orders]);

  // Set of blackout dates for O(1) lookup
  const blackoutDatesMap = useMemo(() => {
    const map: Record<string, BlackoutDate> = {};
    blackoutDates.forEach((b) => {
      map[b.date] = b;
    });
    return map;
  }, [blackoutDates]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    setViewDate(new Date(2026, 7, 1));
    setSelectedDateStr('2026-08-20');
  };

  // Calendar grid computation
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

    const days: {
      date: Date;
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      orders: AdminOrder[];
      pickupOrders: AdminOrder[];
      deliveryOrders: AdminOrder[];
      blackout?: BlackoutDate;
    }[] = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dateKey = formatDateKey(d);
      const dayOrders = ordersByDate[dateKey] || [];
      days.push({
        date: d,
        dateKey,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: dateKey === '2026-08-20',
        isSelected: dateKey === selectedDateStr,
        orders: dayOrders,
        pickupOrders: dayOrders.filter((o) => o.type === 'Store Pickup'),
        deliveryOrders: dayOrders.filter((o) => o.type === 'Doorstep Delivery'),
        blackout: blackoutDatesMap[dateKey]
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateKey = formatDateKey(d);
      const dayOrders = ordersByDate[dateKey] || [];
      days.push({
        date: d,
        dateKey,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateKey === '2026-08-20',
        isSelected: dateKey === selectedDateStr,
        orders: dayOrders,
        pickupOrders: dayOrders.filter((o) => o.type === 'Store Pickup'),
        deliveryOrders: dayOrders.filter((o) => o.type === 'Doorstep Delivery'),
        blackout: blackoutDatesMap[dateKey]
      });
    }

    // Next month filler days (to complete 7-day rows)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateKey = formatDateKey(d);
      const dayOrders = ordersByDate[dateKey] || [];
      days.push({
        date: d,
        dateKey,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateKey === '2026-08-20',
        isSelected: dateKey === selectedDateStr,
        orders: dayOrders,
        pickupOrders: dayOrders.filter((o) => o.type === 'Store Pickup'),
        deliveryOrders: dayOrders.filter((o) => o.type === 'Doorstep Delivery'),
        blackout: blackoutDatesMap[dateKey]
      });
    }

    return days;
  }, [viewDate, selectedDateStr, ordersByDate, blackoutDatesMap]);

  // Selected date orders filtered by state
  const selectedDateOrders = useMemo(() => {
    let list = ordersByDate[selectedDateStr] || [];
    if (filterState === 'PICKUP') {
      list = list.filter((o) => o.type === 'Store Pickup');
    } else if (filterState === 'DELIVERY') {
      list = list.filter((o) => o.type === 'Doorstep Delivery');
    } else if (filterState === 'COMPLETED') {
      list = list.filter((o) => o.status === 'Completed');
    }
    return list;
  }, [ordersByDate, selectedDateStr, filterState]);

  const selectedDateBlackout = blackoutDatesMap[selectedDateStr];

  // Formatted display string for selected date
  const selectedDateFormatted = useMemo(() => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }).toUpperCase();
    } catch {
      return selectedDateStr.toUpperCase();
    }
  }, [selectedDateStr]);

  // Month title formatter
  const currentMonthTitle = viewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  // All chronological pipeline items
  const pipelineOrders = useMemo(() => {
    let list = [...orders];

    // Search query
    if (pipelineSearch.trim()) {
      const q = pipelineSearch.toLowerCase();
      list = list.filter((o) => 
        o.customerName.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.pickupHub && o.pickupHub.toLowerCase().includes(q)) ||
        o.items.some((it) => it.name.toLowerCase().includes(q))
      );
    }

    // Filter state
    if (filterState === 'PICKUP') {
      list = list.filter((o) => o.type === 'Store Pickup');
    } else if (filterState === 'DELIVERY') {
      list = list.filter((o) => o.type === 'Doorstep Delivery');
    } else if (filterState === 'COMPLETED') {
      list = list.filter((o) => o.status === 'Completed');
    }

    // Sort chronologically ascending by delivery date
    list.sort((a, b) => {
      const dateA = extractDateFromOrder(a);
      const dateB = extractDateFromOrder(b);
      return dateA.localeCompare(dateB);
    });

    return list;
  }, [orders, pipelineSearch, filterState]);

  const handleSaveBlockDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddBlackoutDate && blockModalDate) {
      onAddBlackoutDate(blockModalDate, blockModalReason || 'Kitchen Closed');
      setSelectedDateStr(blockModalDate);
      setShowBlockModal(false);
    }
  };

  const handleQuickUnblock = (blackoutId: string) => {
    if (onRemoveBlackoutDate) {
      onRemoveBlackoutDate(blackoutId);
    }
  };

  return (
    <div className="space-y-6">

      {/* ======================================================== */}
      {/* 1. SECTION HEADER (Matching Rest of Admin Page Design)   */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#4a170a] tracking-tight uppercase">
            Production & Pickup Calendar
          </h1>
          <p className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase text-stone-500 mt-1">
            Daily pickup dispatch, oven capacity schedules, and customer collection dates.
          </p>
        </div>

        {/* Right: View Mode Pill Switch */}
        <div className="inline-flex p-1 bg-stone-100 rounded-2xl border border-stone-200 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveViewMode('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
              activeViewMode === 'calendar'
                ? 'bg-[#4a170a] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
            id="btn-switch-calendar-selector"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar Selector</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewMode('pipeline')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
              activeViewMode === 'pipeline'
                ? 'bg-[#4a170a] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
            id="btn-switch-master-pipeline"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Master Schedule Pipeline</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT: MODE 1 (CALENDAR SELECTOR)              */}
      {/* ======================================================== */}
      {activeViewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT 7 COLS: Month Calendar Grid */}
          <div className="lg:col-span-7 space-y-3">
            
            {/* Month Header with Navigation */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-stone-800">
                <CalendarIcon className="w-4 h-4 text-[#d94d2f]" />
                <h2 className="font-mono font-black text-sm sm:text-base tracking-wider uppercase text-[#381207]">
                  {currentMonthTitle}
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-2.5 py-1 bg-white hover:bg-stone-100 text-[#4a170a] border border-stone-300 rounded-md text-[11px] font-mono font-bold uppercase transition-colors cursor-pointer mr-1"
                  title="Jump to today"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded-md bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 flex items-center justify-center transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-7 h-7 rounded-md bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 flex items-center justify-center transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Table Container */}
            <div className="bg-stone-100 rounded-2xl p-2 sm:p-2.5 border border-stone-200 shadow-xs">
              
              {/* Day-of-Week Column Headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center mb-1.5">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((dayName, idx) => (
                  <div 
                    key={dayName} 
                    className={`py-1.5 text-[10px] sm:text-[11px] font-mono font-black tracking-wider uppercase rounded-lg ${
                      idx === 0 ? 'text-red-700 bg-red-50/50' : 'text-stone-600 bg-white/70'
                    }`}
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* 7-Column Day Tiles Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((dayItem) => {
                  const isBlocked = !!dayItem.blackout;
                  const totalOrders = dayItem.orders.length;
                  const pickupCount = dayItem.pickupOrders.length;
                  const deliveryCount = dayItem.deliveryOrders.length;
                  const isSelected = dayItem.isSelected;

                  // Highlighting active day like screenshot (Solid dark espresso card)
                  if (isSelected) {
                    return (
                      <button
                        key={dayItem.dateKey}
                        type="button"
                        onClick={() => setSelectedDateStr(dayItem.dateKey)}
                        className="h-16 sm:h-20 p-2 rounded-xl bg-[#381207] text-white flex flex-col justify-between text-left transition-all cursor-pointer shadow-md ring-2 ring-amber-500/40 relative select-none"
                      >
                        <span className="font-mono font-black text-xs sm:text-sm text-white">
                          {dayItem.dayNumber}
                        </span>

                        <div className="flex items-center justify-between w-full">
                          {isBlocked ? (
                            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" title="Kitchen Blocked" />
                          ) : (
                            <div className="flex items-center gap-1">
                              {pickupCount > 0 && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400" title={`${pickupCount} Store Pickup / Counter`} />
                              )}
                              {deliveryCount > 0 && (
                                <span className="w-2 h-2 rounded-full bg-blue-400" title={`${deliveryCount} Doorstep Delivery`} />
                              )}
                              {pickupCount === 0 && deliveryCount === 0 && totalOrders > 0 && (
                                <span className="w-2 h-2 rounded-full bg-[#f4a261]" title={`${totalOrders} Orders`} />
                              )}
                              {totalOrders === 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                              )}
                            </div>
                          )}

                          {totalOrders > 0 && (
                            <span className="text-[10px] font-mono font-bold text-amber-200">
                              {totalOrders} ord
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  }

                  // Non-selected day cards
                  return (
                    <button
                      key={dayItem.dateKey}
                      type="button"
                      onClick={() => setSelectedDateStr(dayItem.dateKey)}
                      className={`h-16 sm:h-20 p-2 rounded-xl flex flex-col justify-between text-left transition-all cursor-pointer border ${
                        !dayItem.isCurrentMonth
                          ? 'bg-stone-50/40 text-stone-300 border-transparent hover:bg-stone-50'
                          : isBlocked
                          ? 'bg-red-50/70 text-red-950 border-red-200/80 hover:bg-red-100/70'
                          : totalOrders > 0
                          ? 'bg-white text-stone-900 border-amber-200/60 hover:border-amber-300 shadow-2xs'
                          : 'bg-white text-stone-800 border-stone-200/70 hover:bg-stone-50 shadow-2xs'
                      }`}
                    >
                      <span className={`font-mono font-bold text-xs ${
                        dayItem.isToday
                          ? 'text-[#d01617] font-black'
                          : dayItem.isCurrentMonth
                          ? 'text-stone-800'
                          : 'text-stone-400'
                      }`}>
                        {dayItem.dayNumber}
                      </span>

                      <div className="flex items-center justify-between w-full">
                        {isBlocked ? (
                          <span className="text-[9px] font-mono font-bold text-red-700 bg-red-100 px-1 py-0.2 rounded">
                            BLOCKED
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            {pickupCount > 0 && (
                              <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded flex items-center gap-0.5" title={`${pickupCount} Store Pickup / Counter`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {pickupCount}
                              </span>
                            )}
                            {deliveryCount > 0 && (
                              <span className="text-[9px] font-mono font-bold text-blue-800 bg-blue-100 px-1 py-0.2 rounded flex items-center gap-0.5" title={`${deliveryCount} Doorstep Delivery`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                {deliveryCount}
                              </span>
                            )}
                            {pickupCount === 0 && deliveryCount === 0 && totalOrders > 0 && (
                              <span className="text-[9px] font-mono font-bold text-amber-900 bg-amber-100 px-1 py-0.2 rounded">
                                {totalOrders} ord
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Calendar Legend - Matching Daily Schedule Logs Tags */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-stone-500 px-1">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Store Pickup / Counter</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Doorstep Delivery</span>
                </div>
              </div>

              <div>
                Selected Date: <span className="font-bold text-[#381207]">{selectedDateStr}</span>
              </div>
            </div>

          </div>

          {/* RIGHT 5 COLS: Daily Schedule Logs Panel (Matching Screenshot 1) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            
            {/* Header: Daily Schedule Logs */}
            <div className="flex items-center justify-between px-1">
              <div className="space-y-0.5">
                <p className="text-[10px] font-mono font-bold tracking-widest text-stone-500 uppercase">
                  Daily Schedule Logs
                </p>
                <h3 className="font-mono font-black text-sm sm:text-base text-[#381207] uppercase">
                  {selectedDateFormatted}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-[11px] font-mono font-bold shrink-0">
                {selectedDateOrders.length} {selectedDateOrders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>

            {/* Blocked Date Warning if active */}
            {selectedDateBlackout && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-red-800 uppercase flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Kitchen Capacity Blocked
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickUnblock(selectedDateBlackout.id)}
                    className="text-[11px] font-mono font-bold text-red-700 hover:text-red-900 underline uppercase cursor-pointer"
                  >
                    Unblock Date
                  </button>
                </div>
                <p className="text-xs text-red-700 font-medium">
                  Reason: {selectedDateBlackout.reason}
                </p>
              </div>
            )}

            {/* Scheduled Orders Roster for Selected Date - Dedicated Scroll Area */}
            <div className="overflow-y-auto max-h-[530px] lg:max-h-[550px] pr-1.5 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-stone-100/50">
              {selectedDateOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3 shadow-2xs">
                  <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase text-stone-700">
                      No Scheduled Pickups / Orders
                    </h4>
                    <p className="text-xs text-stone-500 mt-1">
                      No orders scheduled for dispatch or customer pickup on this date.
                    </p>
                  </div>
                </div>
              ) : (
                selectedDateOrders.map((order) => {
                  const isPickup = order.type === 'Store Pickup';
                  const primaryItem = order.items[0]?.name || 'Bakery Items';
                  const moreItemsCount = order.items.length > 1 ? order.items.length - 1 : 0;

                  return (
                    <div 
                      key={order.id}
                      className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs space-y-3 transition-all hover:border-stone-300"
                    >
                      {/* Top Chips Row */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase tracking-wider ${
                            isPickup 
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300/80' 
                              : 'bg-blue-100 text-blue-900 border border-blue-300/80'
                          }`}>
                            {isPickup ? 'STORE PICKUP / COUNTER' : 'DOORSTEP DELIVERY'}
                          </span>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${getOrderStatusBadgeClass(
                            order.status
                          )}`}>
                            {normalizeOrderStatus(order.status).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {onViewOrderDetails && (
                            <button
                              type="button"
                              onClick={() => onViewOrderDetails(order.id)}
                              className="text-stone-400 hover:text-stone-700 hover:bg-stone-100 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="View full order details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteOrder && (
                            <button
                              type="button"
                              onClick={() => onDeleteOrder(order.id)}
                              className="text-stone-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Delete / Archive Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Order Title */}
                      <div>
                        <h4 className="font-mono font-black text-xs sm:text-sm text-stone-900 uppercase">
                          {order.orderNumber} – {primaryItem}
                          {moreItemsCount > 0 && ` (+${moreItemsCount} more)`}
                        </h4>
                      </div>

                      {/* Client & Logistics Details */}
                      <div className="text-xs space-y-1 font-sans text-stone-600">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-stone-400 font-bold">Client Partner:</span>
                          <span className="font-bold text-stone-800">{order.customerName}</span>
                          <span className="text-stone-400">({order.customerPhone})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-stone-400 font-bold">Hub Location:</span>
                          <span className="font-medium text-stone-800">
                            {order.pickupHub || 'Main Bakery Counter, Davao City'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="font-mono text-stone-400 font-bold">Order Total:</span>
                          <span className="font-mono font-bold text-[#4a170a]">
                            ₱{order.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Bottom State Control Row */}
                      <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
                          Update State:
                        </span>
                        
                        <div className="relative">
                          <select
                            value={normalizeOrderStatus(order.status)}
                            onChange={(e) => {
                              if (onUpdateOrderStatus) {
                                onUpdateOrderStatus(order.id, e.target.value as OrderStatus);
                              }
                            }}
                            className={`appearance-none pl-3 pr-7 py-1 rounded-xl border text-xs font-mono font-bold focus:outline-none cursor-pointer ${getOrderStatusBadgeClass(
                              order.status
                            )}`}
                          >
                            <option value="New" className="bg-white text-blue-800">New</option>
                            <option value="Completed" className="bg-white text-emerald-800">Completed</option>
                            <option value="Cancelled" className="bg-white text-red-700">Cancelled</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MAIN CONTENT: MODE 2 (MASTER SCHEDULE PIPELINE)       */}
      {/* ======================================================== */}
      {activeViewMode === 'pipeline' && (
        <div className="space-y-4">
          
          {/* Pipeline Header Banner (Matching Screenshot 2) */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#d94d2f] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-mono font-black text-sm sm:text-base text-[#381207] uppercase">
                  Master Scheduling Pipeline
                </h3>
                <p className="text-[10px] sm:text-[11px] font-mono font-bold text-stone-500 uppercase tracking-wider">
                  Sorted chronologically by date ascending
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-mono font-bold">
                {pipelineOrders.length} {pipelineOrders.length === 1 ? 'Item Total' : 'Items Total'}
              </span>
            </div>
          </div>

          {/* Search bar inside pipeline */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search schedule pipeline by customer, order #, or cake flavor..."
              value={pipelineSearch}
              onChange={(e) => setPipelineSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-stone-300 text-xs font-medium focus:outline-none focus:border-[#381207] shadow-2xs"
            />
          </div>

          {/* Pipeline Cards List */}
          <div className="space-y-3">
            {pipelineOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
                <p className="text-xs font-mono font-bold uppercase text-stone-500">
                  No orders found in schedule pipeline
                </p>
              </div>
            ) : (
              pipelineOrders.map((order) => {
                const dateKey = extractDateFromOrder(order);
                const isPickup = order.type === 'Store Pickup';
                const primaryItem = order.items[0]?.name || 'Bakery Selection';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs space-y-3 hover:border-stone-300 transition-all"
                  >
                    {/* Top Chips Row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase tracking-wider ${
                          isPickup 
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300/80' 
                            : 'bg-blue-100 text-blue-900 border border-blue-300/80'
                        }`}>
                          {isPickup ? 'STORE PICKUP / COUNTER' : 'DOORSTEP DELIVERY'}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${getOrderStatusBadgeClass(
                          order.status
                        )}`}>
                          {normalizeOrderStatus(order.status).toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-50 text-[#4a170a] border border-amber-200">
                          SCHEDULED: {dateKey}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {onViewOrderDetails && (
                          <button
                            type="button"
                            onClick={() => onViewOrderDetails(order.id)}
                            className="text-stone-400 hover:text-stone-700 hover:bg-stone-100 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="View order details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteOrder && (
                          <button
                            type="button"
                            onClick={() => onDeleteOrder(order.id)}
                            className="text-stone-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Delete / Archive Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Title */}
                    <div>
                      <h4 className="font-mono font-black text-sm text-stone-900 uppercase">
                        {order.orderNumber} – {primaryItem} ({order.customerName})
                      </h4>
                    </div>

                    {/* Metadata Line */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-stone-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-mono text-stone-400 font-bold">Client:</span>
                        <span className="font-bold text-stone-800">{order.customerName}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-mono text-stone-400 font-bold">Hub Location:</span>
                        <span className="font-medium text-stone-800">{order.pickupHub || 'Main Bakery Counter, Davao'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-stone-400 font-bold">Total:</span>
                        <span className="font-mono font-bold text-[#4a170a]">₱{order.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Bottom Status Changer Row */}
                    <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
                        Status:
                      </span>

                      <div className="relative">
                        <select
                          value={normalizeOrderStatus(order.status)}
                          onChange={(e) => {
                            if (onUpdateOrderStatus) {
                              onUpdateOrderStatus(order.id, e.target.value as OrderStatus);
                            }
                          }}
                          className={`appearance-none pl-3 pr-7 py-1 rounded-xl border text-xs font-mono font-bold focus:outline-none cursor-pointer ${getOrderStatusBadgeClass(
                            order.status
                          )}`}
                        >
                          <option value="New" className="bg-white text-blue-800">New</option>
                          <option value="Completed" className="bg-white text-emerald-800">Completed</option>
                          <option value="Cancelled" className="bg-white text-red-700">Cancelled</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 5. SYSTEM FOOTER BAR (Matching Screenshot Style)          */}
      {/* ======================================================== */}
      <div className="pt-4 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono tracking-wider text-stone-400 uppercase">
        <div>
          © 2026 SHEY'S BAKERY PRODUCTION & DISPATCH CONTROL
        </div>
        <div>
          ALL UPDATES ROUTE STATUS FLAGS TO MAIN DISPATCH CHANNELS DYNAMICALLY.
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. MODAL: BLOCK DATE / SET CAPACITY                      */}
      {/* ======================================================== */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-mono font-black text-sm text-[#381207] uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#d94d2f]" />
                Block Kitchen Production Date
              </h3>
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlockDate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-stone-600 mb-1">
                  Target Date (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={blockModalDate}
                  onChange={(e) => setBlockModalDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono font-bold focus:outline-none focus:border-[#381207]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-stone-600 mb-1">
                  Reason for Closure / Capacity Block
                </label>
                <input
                  type="text"
                  value={blockModalReason}
                  onChange={(e) => setBlockModalReason(e.target.value)}
                  placeholder="e.g., Oven Capacity Reached, Holiday, Deep Cleaning"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:border-[#381207]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-mono font-bold uppercase hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#381207] hover:bg-[#4a170a] text-white text-xs font-mono font-bold uppercase cursor-pointer shadow-xs"
                >
                  Save Block Date
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
