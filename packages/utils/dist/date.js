"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeAgo = exports.formatDateTime = exports.formatDate = void 0;
/** Format a date to "Oct 20, 2026" */
const formatDate = (date) => new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});
exports.formatDate = formatDate;
/** Format a date to "Oct 20, 2026 at 1:45 AM" */
const formatDateTime = (date) => new Date(date).toLocaleString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});
exports.formatDateTime = formatDateTime;
/** Time ago: "2 minutes ago", "1 hour ago" */
const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)
        return 'just now';
    if (mins < 60)
        return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)
        return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};
exports.timeAgo = timeAgo;
//# sourceMappingURL=date.js.map