import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Settings, 
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
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
                >
                  <Save size={16} />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-1 px-3 py-1 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1 px-3 py-1 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
              >
                <Edit3 size={16} />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Picture */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
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
            <h3 className="text-xl font-semibold text-gray-900">
              {state.user.displayName || state.user.name}
            </h3>
            <p className="text-gray-500">@{state.user.name.toLowerCase().replace(/\s+/g, '')}</p>
          </div>

          {/* Profile Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{state.user.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{state.user.displayName || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{state.user.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <p className="text-gray-900">
                  {new Date(state.user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Notifications</p>
                    <p className="text-sm text-gray-500">Manage your notification preferences</p>
                  </div>
                </div>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Configure
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Privacy</p>
                    <p className="text-sm text-gray-500">Control your privacy settings</p>
                  </div>
                </div>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Manage
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Language</p>
                    <p className="text-sm text-gray-500">Set your preferred language</p>
                  </div>
                </div>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Activity</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">
                  {state.conversations.length}
                </p>
                <p className="text-sm text-gray-500">Conversations</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">
                  {state.notebook.length}
                </p>
                <p className="text-sm text-gray-500">Saved Messages</p>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="text-center">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-full transition-colors mx-auto"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
