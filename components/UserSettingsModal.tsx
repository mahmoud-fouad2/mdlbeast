import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Camera, Lock, Eye, EyeOff, Check, AlertCircle, User } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import type { User as UserType } from '../types';

interface UserSettingsModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedUser: UserType) => void;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAvatarPreview(user?.avatar_url || null);
      setAvatarFile(null);
      setUploadSuccess(false);
      setUploadError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
      setPasswordSuccess(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setUploadError('يرجى اختيار ملف صورة فقط');
        return;
      }
      
      setAvatarFile(file);
      setUploadError(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const response = await apiClient.uploadAvatar(formData);
      
      setUploadSuccess(true);
      setAvatarFile(null);
      
      if (onUpdate && response?.avatar_url) {
        onUpdate({ ...user, avatar_url: response.avatar_url });
      }
      
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error: any) {
      setUploadError(error?.message || 'فشل رفع الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('يرجى ملء جميع الحقول');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      await apiClient.changePassword({ currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      setPasswordError(error?.message || 'فشل تغيير كلمة المرور');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'مدير نظام';
      case 'manager': return 'مدير تنفيذي';
      case 'supervisor': return 'مدير مباشر';
      default: return 'مستخدم';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-l from-slate-900 to-slate-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="text-center pt-2">
            <h2 className="text-xl font-black mb-1">إعدادات الحساب</h2>
            <p className="text-slate-400 text-xs">{user.full_name || user.username}</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-4 text-sm font-bold transition-all ${
              activeTab === 'profile' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <User size={16} className="inline ml-2" />
            الملف الشخصي
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-4 text-sm font-bold transition-all ${
              activeTab === 'security' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Lock size={16} className="inline ml-2" />
            الأمان
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl mx-auto">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-black text-slate-500">
                        {user.full_name?.substring(0, 1) || 'U'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 left-0 p-2.5 bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-700 transition-colors"
                  >
                    <Camera size={16} />
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <p className="text-xs text-slate-400 mt-3">انقر على الكاميرا لتغيير الصورة</p>
              </div>
              
              {/* Upload Error/Success Messages */}
              {uploadError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                  <AlertCircle size={16} />
                  {uploadError}
                </div>
              )}
              
              {uploadSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 rounded-xl text-sm">
                  <Check size={16} />
                  تم رفع الصورة بنجاح
                </div>
              )}
              
              {/* Upload Button */}
              {avatarFile && (
                <button
                  onClick={handleUploadAvatar}
                  disabled={isUploading}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      حفظ الصورة
                    </>
                  )}
                </button>
              )}
              
              {/* User Info */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 text-sm">اسم المستخدم</span>
                  <span className="font-bold text-slate-900">{user.username}</span>
                </div>
                {user.email && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400 text-sm">البريد الإلكتروني</span>
                    <span className="font-bold text-slate-900 text-sm">{user.email}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 text-sm">الصلاحية</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-amber-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={14} />
                  لأمان حسابك، يرجى عدم مشاركة كلمة المرور مع أي شخص
                </p>
              </div>
              
              {/* Current Password */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور الحالية</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="أدخل كلمة المرور الحالية"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {/* New Password */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="أدخل كلمة المرور الجديدة"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">تأكيد كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {/* Password Error/Success Messages */}
              {passwordError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                  <AlertCircle size={16} />
                  {passwordError}
                </div>
              )}
              
              {passwordSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 rounded-xl text-sm">
                  <Check size={16} />
                  تم تغيير كلمة المرور بنجاح
                </div>
              )}
              
              {/* Change Password Button */}
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري التغيير...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    تغيير كلمة المرور
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSettingsModal;
