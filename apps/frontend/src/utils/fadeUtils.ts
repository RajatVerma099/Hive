export const getTimeRemaining = (expiresAt: string): string => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

export const getExpiryColor = (expiresAt: string): string => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  const hours = diff / (1000 * 60 * 60);
  
  if (hours < 1) return 'text-red-600 bg-red-100';
  if (hours < 6) return 'text-orange-600 bg-orange-100';
  if (hours < 24) return 'text-yellow-600 bg-yellow-100';
  return 'text-green-600 bg-green-100';
};

export const calculateDurationFromExpiry = (expiresAt: string): { hours: number; minutes: number } => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  
  if (diff <= 0) return { hours: 0, minutes: 0 };
  
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return { hours, minutes };
};

export const calculateExpiryFromDuration = (hours: number, minutes: number): Date => {
  const now = new Date();
  const totalMinutes = hours * 60 + minutes;
  const expiry = new Date(now.getTime() + totalMinutes * 60 * 1000);
  return expiry;
};

