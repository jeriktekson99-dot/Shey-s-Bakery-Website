import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  CalendarClock, 
  Archive,
  Settings, 
  LogOut
} from 'lucide-react';
import { AdminViewTab } from './types';
import { ADMIN_BRAND_LOGO } from '../../data/bakeryData';

interface AdminSidebarProps {
  currentTab: AdminViewTab;
  onSelectTab: (tab: AdminViewTab) => void;
  onLogout: () => void;
  onReturnToStore: () => void;
  newOrdersCount: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  onReturnToStore,
  newOrdersCount
}) => {
  const navItems: { id: AdminViewTab; label: string; icon: React.FC<{ className?: string }>; badge?: number | string }[] = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Live Orders', icon: ShoppingBag, badge: newOrdersCount > 0 ? newOrdersCount : undefined },
    { id: 'products', label: 'Menu & Products', icon: UtensilsCrossed },
    { id: 'capacity', label: 'Calendar & Pickup Dates', icon: CalendarClock },
    { id: 'archive', label: 'Archive Vault', icon: Archive }
  ];

  return (
    <aside className="w-full lg:w-72 xl:w-80 bg-[#361007] text-amber-50 flex flex-col justify-between p-5 sm:p-6 shrink-0 border-r border-amber-900/60 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      
      {/* 1. Header: Bakery Logo & "Admin Portal" */}
      <div className="space-y-6">
        
        {/* Bakery Logo & Portal Tag */}
        <button
          onClick={() => onSelectTab('overview')}
          id="admin-sidebar-brand-btn"
          className="w-full flex items-center gap-3 pb-5 border-b border-amber-900/40 text-left cursor-pointer group transition-transform hover:opacity-95 active:scale-[0.99] focus:outline-none"
          title="Return to Dashboard Overview"
          aria-label="Return to Dashboard Overview"
        >
          <img
            src={ADMIN_BRAND_LOGO.src}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src !== ADMIN_BRAND_LOGO.fallbackSrc) {
                target.src = ADMIN_BRAND_LOGO.fallbackSrc;
              }
            }}
            alt={ADMIN_BRAND_LOGO.alt}
            referrerPolicy="no-referrer"
            className="w-12 h-12 object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
          />
          <div>
            <div className="font-serif font-black text-base tracking-tight text-amber-100 leading-tight group-hover:text-white transition-colors">
              Shey's Bakery
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#d94d2f] group-hover:text-[#ff6b4a] transition-colors">
              Admin Portal
            </div>
          </div>
        </button>

        {/* 2. Navigation Links */}
        <div className="space-y-1.5 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                id={`admin-nav-${item.id}-btn`}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-[16px] transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-amber-100/10 border border-amber-200/40 text-amber-100 shadow-sm'
                    : 'border border-transparent text-amber-100/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-amber-200' : 'text-amber-300/60'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-amber-200/20 text-amber-100 border border-amber-200/40'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* 3. Footer Actions: System Settings & Logout Portal */}
      <div className="pt-4 mt-6 border-t border-amber-900/40 space-y-1.5">
        <button
          onClick={() => onSelectTab('settings')}
          id="admin-nav-settings-btn"
          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-[16px] transition-all cursor-pointer text-left ${
            currentTab === 'settings'
              ? 'bg-amber-100/10 border border-amber-200/40 text-amber-100 shadow-sm'
              : 'border border-transparent text-amber-100/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Settings className={`w-5 h-5 ${currentTab === 'settings' ? 'text-amber-200' : 'text-amber-300/60'}`} />
          <span>System Settings</span>
        </button>

        <button
          onClick={onLogout}
          id="admin-sidebar-logout-btn"
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-[16px] text-amber-100/80 hover:bg-white/5 hover:text-white transition-all cursor-pointer text-left"
        >
          <LogOut className="w-5 h-5 text-amber-300/70" />
          <span>Logout Portal</span>
        </button>
      </div>

    </aside>
  );
};
