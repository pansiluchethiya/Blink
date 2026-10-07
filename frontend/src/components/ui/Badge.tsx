import React from 'react';

const Badge = ({ count = 0, className = '' }) => {
  if (!count || count <= 0) return null;
  const display = count > 99 ? '99+' : String(count);
  return (
    <span className={['badge badge-primary badge-sm font-bold', className].join(' ')} aria-label={`${display} unread`}>{display}</span>
  );
};

export default Badge;
