import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';
import { 
  User as UserIcon, 
  LogOut,
  Edit3,
  Save,
  X,
  Camera,
  Bell,
  Shield,
  Globe
} from 'lucide-react';

export const ProfileTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: state.user?.name || '',
    displayName: state.user?.displayName || '',
    email: state.user?.email || '',
  });

  const handleSave = () => {
    if (state.user) {
      const updatedUser: User = {
        ...state.user,
        ...editForm,
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'SET_USER', payload: updatedUser });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: state.user?.name || '',
      displayName: state.user?.displayName || '',
      email: state.user?.email || '',
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
  };

  if (!state.user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <UserIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Not logged in
          </h3>
          <p className="text-gray-500">
            Please log in to view your profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-full transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Profile Header - Instagram style - spans full width */}
          <div className="flex items-start space-x-6">
            {/* Profile Picture */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
                <img
                  src={state.user.avatar || `https://ui-avatars.com/api/?name=${state.user.name}&background=0ea5e9&color=fff&size=96`}
                  alt={state.user.name}
                  className="w-24 h-24 rounded-full"
                />
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors">
                  <Camera size={16} />
                </button>
              )}
            </div>

            {/* Profile Info & Activity */}
            <div className="flex-1">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {state.user.name}
                </h3>
                <p className="text-gray-500">@{state.user.displayName || state.user.name.toLowerCase().replace(/\s+/g, '')}</p>
              </div>

              {/* Activity Stats */}
              <div className="flex space-x-6">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {state.conversations.length}
                  </p>
                  <p className="text-sm text-gray-500">Conversations</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {state.notebook.length}
                  </p>
                  <p className="text-sm text-gray-500">Saved Messages</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information and Settings - Side by side with 1:2 ratio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Profile Information - 2 columns */}
            <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-medium text-gray-900">Personal Information</h4>
                <div className="flex items-center space-x-1.5">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="flex items-center space-x-1 px-2.5 py-1 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors text-xs"
                      >
                        <Save size={12} />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-xs"
                      >
                        <X size={12} />
                        <span>Cancel</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-xs"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{state.user.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{state.user.displayName || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{state.user.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Member Since
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(state.user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Settings - 1 column */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="text-base font-medium text-gray-900 mb-3">Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell size={18} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Notifications</p>
                      <p className="text-xs text-gray-500">Manage your notification preferences</p>
                    </div>
                  </div>
                  <button className="text-primary-600 hover:text-primary-700 text-xs font-medium flex-shrink-0 ml-2">
                    Configure
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield size={18} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Privacy</p>
                      <p className="text-xs text-gray-500">Control your privacy settings</p>
                    </div>
                  </div>
                  <button className="text-primary-600 hover:text-primary-700 text-xs font-medium flex-shrink-0 ml-2">
                    Manage
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe size={18} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Language</p>
                      <p className="text-xs text-gray-500">Set your preferred language</p>
                    </div>
                  </div>
                  <button className="text-primary-600 hover:text-primary-700 text-xs font-medium flex-shrink-0 ml-2">
                    Change
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
