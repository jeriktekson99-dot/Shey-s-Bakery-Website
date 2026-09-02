import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { BakeryHubLocation, AdminProduct } from './types';
import { 
  getSocialLinks, 
  saveSocialLinks,
  DEFAULT_BAKERY_HUBS
} from '../../data/bakeryStore';
import { getSupabaseClient } from '../../lib/supabase';
import { Product } from '../../types';

interface SettingsViewProps {
  hubs?: BakeryHubLocation[];
  onAddHub?: (hub: BakeryHubLocation) => void;
  onRemoveHub?: (id: string) => void;
  onToggleHubActive?: (id: string) => void;
  onRefreshProducts?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = () => {
  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Social media state
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [socialSuccess, setSocialSuccess] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);

  useEffect(() => {
    const savedLinks = getSocialLinks();
    setInstagramUrl(savedLinks.instagram);
    setFacebookUrl(savedLinks.facebook);
    setTiktokUrl(savedLinks.tiktok);
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!oldPassword.trim()) {
      setPasswordError('Please enter your current/old password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not connected.');
      }

      // Check current user session to verify old password if applicable
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.email) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: userData.user.email,
          password: oldPassword.trim()
        });

        if (signInErr) {
          throw new Error('Current/old password does not match our records.');
        }
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword.trim()
      });

      if (updateErr) {
        throw updateErr;
      }

      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      console.error('Password update error:', err);
      setPasswordError(err?.message || 'Failed to update password with Supabase.');
    }
  };

  const handleSocialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSocialError(null);
    setSocialSuccess(false);

    const formattedInstagram = instagramUrl.trim() || 'https://instagram.com/sheysbakery.ph';
    const formattedFacebook = facebookUrl.trim() || 'https://facebook.com/sheysbakeryofficial';
    const formattedTiktok = tiktokUrl.trim() || 'https://tiktok.com/@sheysbakery';

    saveSocialLinks({
      instagram: formattedInstagram,
      facebook: formattedFacebook,
      tiktok: formattedTiktok
    });

    setSocialSuccess(true);
    setTimeout(() => setSocialSuccess(false), 4000);
  };

  return (
    <div className="space-y-8">
      
      {/* Section Header */}
      <div className="pb-5 border-b border-stone-200">
        <h1 className="text-2xl sm:text-3xl font-black text-[#4a170a] tracking-tight uppercase">
          System Settings & Integrations
        </h1>
        <p className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase text-stone-500 mt-1">
          Manage administrative credentials and connected channels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Panel 1: Security & Password Change */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-stone-100">
            <h3 className="font-serif font-black text-lg text-[#4a170a]">
              Admin Security & Credentials
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Update master password for the Shey's Bakery portal
            </p>
          </div>

          {passwordError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Admin password updated successfully!</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Old Password *
              </label>
              <input
                type="password"
                required
                placeholder="Enter current/old password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d94d2f]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d94d2f]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d94d2f]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#d94d2f] hover:bg-[#c03d21] text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer text-center"
            >
              Update Supabase Admin Password
            </button>
          </form>
        </div>

        {/* Panel 2: Social Media Integration Panel */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-stone-100">
            <h3 className="font-serif font-black text-lg text-[#4a170a]">
              Social Media & Gallery Feeds
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Connected brand accounts shown in header, footer, & Instagram bakes gallery
            </p>
          </div>

          {socialSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Social media endpoints updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSocialSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Instagram Profile URL
              </label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d01617]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Facebook Page URL
              </label>
              <input
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d01617]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                TikTok / Video Feed URL
              </label>
              <input
                type="url"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d01617]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#4a170a] hover:bg-[#361007] text-amber-50 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer text-center"
            >
              Update Social Integration Links
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
