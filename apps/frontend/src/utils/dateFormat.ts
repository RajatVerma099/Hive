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

