/**
 * Format date in human-readable format
 * @param dateString - ISO date string
 * @param includeTime - Whether to include time in the format
 * @returns Formatted date string (e.g., "Nov 22, 2025" or "Nov 22, 2025 12:54 AM")
 */
export const formatDate = (dateString: string, includeTime: boolean = false): string => {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  if (includeTime) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${month} ${day}, ${year} ${hours}:${minutesStr} ${ampm}`;
  }
  
  return `${month} ${day}, ${year}`;
};

/**
 * Format time in 12-hour format with AM/PM
 * @param dateString - ISO date string
 * @returns Formatted time string (e.g., "3:45 PM" or "11:30 AM")
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12; // Convert to 12-hour format, 0 becomes 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

