/** Format a date to "Oct 20, 2026" */
export const formatDate = (date: string | Date): string =>
  new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/** Format a date to "Oct 20, 2026 at 1:45 AM" */
export const formatDateTime = (date: string | Date): string =>
  new Date(date).toLocaleString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

/** Time ago: "2 minutes ago", "1 hour ago" */
export const timeAgo = (date: string | Date): string => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};
