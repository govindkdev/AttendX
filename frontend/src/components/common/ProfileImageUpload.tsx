import React, { useState, useRef } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/features/authentication/AuthContext';
import { Camera, Trash2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ProfileImageUploadProps {
  avatarUrl?: string | null;
  fullName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  avatarUrl,
  fullName = 'User',
  size = 'md',
}) => {
  const { refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-3xl',
  }[size];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size must be 2 MB or smaller.');
      return;
    }

    setUploading(true);
    try {
      await api.uploadProfileImage(file);
      await refreshUser();
      setSuccessMsg('Profile picture updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setUploading(true);
    try {
      await api.deleteProfileImage();
      await refreshUser();
      setSuccessMsg('Profile picture removed.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove profile picture.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Avatar Container */}
      <div className="relative group">
        <div
          className={`${sizeClasses} rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center font-bold text-slate-700 shadow-xs relative`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initials if broken image
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span>{fullName.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* Quick Camera Overlay button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-full bg-slate-900/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
          title="Change profile picture"
        >
          <Camera className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Upload</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <Upload className="w-3.5 h-3.5 mr-1 text-slate-500" />
          {uploading ? 'Uploading...' : 'Change Photo'}
        </button>

        {avatarUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs"
            title="Remove Photo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="text-[11px] text-rose-600 flex items-center space-x-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="text-[11px] text-emerald-600 flex items-center space-x-1 mt-1">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
