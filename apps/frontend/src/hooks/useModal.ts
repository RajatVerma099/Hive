import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface UseModalOptions {
  lockBodyScroll?: boolean;
}

export const useModal = (isOpen: boolean, options: UseModalOptions = {}) => {
  const { lockBodyScroll = true } = options;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen && lockBodyScroll) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, lockBodyScroll]);

  const renderPortal = (content: React.ReactNode) => {
    if (!isOpen || !mounted) return null;
    return createPortal(content, document.body);
  };

  return { mounted, renderPortal };
};

