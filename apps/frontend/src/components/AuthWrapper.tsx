import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparing your welcome...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        {isLoginMode ? (
          <LoginForm onSwitchToSignup={() => setIsLoginMode(false)} />
        ) : (
          <SignupForm onSwitchToLogin={() => setIsLoginMode(true)} />
        )}
      </div>
    );
  }

  return <>{children}</>;
};
