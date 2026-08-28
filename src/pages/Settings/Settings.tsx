import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Sparkles, Save, Camera, Loader2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { coachService } from '../../services/coach.service';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '' });
  const [originalFormData, setOriginalFormData] = useState(formData);
  const [phoneError, setPhoneError] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const loaded = {
        fullName: user.name || user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
      };
      setFormData(loaded);
      setOriginalFormData(loaded);

      const coachProfile = await coachService.getProfile();
      if (coachProfile.profilePhoto) setProfilePicture(coachProfile.profilePhoto);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const sanitized = value.replace(/[^\d\s+\-()]/g, '');
      setFormData({ ...formData, phone: sanitized });
      setPhoneError(sanitized && !/^[+\d\s\-()]{7,20}$/.test(sanitized) ? 'Enter a valid phone number (7–20 digits).' : '');
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleCancel = () => {
    setFormData(originalFormData);
    setPhoneError('');
  };

  const handleSaveChanges = async () => {
    if (phoneError || (formData.phone && !/^[+\d\s\-()]{7,20}$/.test(formData.phone.trim()))) {
      setPhoneError('Enter a valid phone number (7–20 digits).');
      showToast('Please fix the phone number before saving.', 'error');
      return;
    }
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('fullName', formData.fullName.trim());
      fd.append('phone', formData.phone);
      await coachService.updateProfile(fd);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...user,
        name: formData.fullName.trim(),
        phone: formData.phone,
      }));

      setOriginalFormData(formData);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Only JPG, PNG or WebP images are allowed.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5 MB.', 'error');
      return;
    }
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const updated = await coachService.updateProfile(fd) as any;
      const photoUrl = updated?.profile?.profilePhoto ?? updated?.profilePhoto ?? null;
      setProfilePicture(photoUrl);
      showToast('Profile photo updated!', 'success');
    } catch {
      showToast('Failed to upload photo.', 'error');
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const initial = (formData.fullName.trim()[0] || 'C').toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-heading">Settings</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Manage your personal information and account preferences.</p>
      </header>

      {/* Profile Section */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-[var(--color-border-primary)] flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <div className="w-24 h-24 rounded-full bg-[var(--color-primary)] text-[var(--color-text-inverse)] flex items-center justify-center text-3xl font-bold overflow-hidden border-4 border-[var(--color-bg-card)] shadow-lg">
              {photoUploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              ) : profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <button
              type="button"
              disabled={photoUploading}
              onClick={() => photoInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-full shadow-md text-[var(--color-primary)] hover:scale-110 transition-all disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{formData.fullName || 'Coach'}</h2>
            <p className="text-[var(--color-text-secondary)]">{formData.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-[var(--color-success-bg)] text-[var(--color-success-darkest)] text-xs font-bold rounded-full border border-[var(--color-success)]">Verified Coach</span>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--color-text-primary)]">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--color-text-primary)]">Email Address</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-xl text-[var(--color-text-secondary)] cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--color-text-primary)]">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+91 98765 43210"
              maxLength={20}
              className={`w-full px-4 py-2.5 bg-[var(--color-bg-secondary)] border rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all ${phoneError ? 'border-[var(--color-error)]' : 'border-[var(--color-border-primary)]'}`}
            />
            {phoneError && <p className="text-xs text-[var(--color-error)] mt-1">{phoneError}</p>}
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2.5 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-bold rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-2.5 bg-[var(--color-primary)] text-[var(--color-text-inverse)] font-bold rounded-xl hover:opacity-90 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] shadow-sm p-6 md:p-8 space-y-6">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-heading flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[var(--color-primary)]" />
          Preferences & Appearance
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-black/5">
            <div>
              <p className="font-bold text-[var(--color-text-primary)]">Theme Mode</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Switch between light and dark themes</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-secondary)]'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-start gap-3 p-4 bg-[var(--color-info-bg)] rounded-xl border border-[var(--color-primary-light)]">
            <Info className="w-5 h-5 text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-[var(--color-text-primary)]">Timezone</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                All sessions and availability are in <strong>IST (Asia/Kolkata)</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-[var(--color-error-light)] rounded-2xl border border-[var(--color-error)]/20 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-error)] font-heading">Account Actions</h2>
          <p className="text-sm text-[var(--color-error)]">Logging out will end your current session on this device.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-8 py-3 bg-[var(--color-error)] text-white font-bold rounded-xl hover:opacity-90 shadow-lg shadow-[var(--color-error)]/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </section>
    </div>
  );
};
