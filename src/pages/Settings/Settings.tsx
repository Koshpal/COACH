import React, { useState, useEffect } from 'react';
import { User, LogOut, Clock, Save, Trash2, Camera } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Split name into first and last name if possible
      const nameParts = (user.name || user.fullName || '').split(' ');
      setFormData({
        firstName: user.firstName || nameParts[0] || '',
        lastName: user.lastName || nameParts.slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
      });

      // Try to get coach profile for timezone
      const coachProfile = await coachService.getProfile();
      setTimezone(coachProfile.timezone || 'Asia/Kolkata');
      if (coachProfile.profilePhoto) setProfilePicture(coachProfile.profilePhoto);
      
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const fd = new FormData();
      fd.append('fullName', fullName);
      fd.append('phone', formData.phone);
      
      await Promise.all([
        coachService.updateProfile(fd),
        coachService.updateTimezone(timezone),
      ]);
      
      // Update local storage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...user,
        name: fullName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        timezone,
      }));
      
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update profile.', 'error');
    } finally {
      setSaving(false);
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
            <div className="w-24 h-24 rounded-full bg-[var(--color-primary)] text-[var(--color-text-inverse)] flex items-center justify-center text-3xl font-bold overflow-hidden border-4 border-[var(--color-bg-card)] shadow-lg">
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{(formData.firstName[0] || 'C').toUpperCase()}</span>
              )}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-full shadow-md text-[var(--color-primary)] hover:scale-110 transition-all">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{formData.firstName} {formData.lastName}</h2>
            <p className="text-[var(--color-text-secondary)]">{formData.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-[var(--color-success-bg)] text-[var(--color-success-darkest)] text-xs font-bold rounded-full border border-[var(--color-success)]">Verified Coach</span>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--color-text-primary)]">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--color-text-primary)]">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
              />
            </div>
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
              className="w-full px-4 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button className="px-6 py-2.5 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-bold rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-all">Cancel</button>
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
          <Clock className="w-6 h-6 text-[var(--color-primary)]" />
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
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-black/5">
            <div className="flex-1">
              <p className="font-bold text-[var(--color-text-primary)]">Default Timezone</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Your availability slots will be based on this timezone</p>
            </div>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="Europe/London">Greenwich Mean Time (GMT)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-red-50 rounded-2xl border border-red-100 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-red-700 font-heading">Account Actions</h2>
          <p className="text-sm text-red-600">Logging out will end your current session on this device.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </section>
    </div>
  );
};
