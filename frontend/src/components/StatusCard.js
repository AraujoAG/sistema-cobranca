// frontend/src/components/StatusCard.js
import React from 'react';

function StatusCard({ title, value, icon, color }) {
  return (
    <div className="summary-card">
      <h3>{title}</h3>
      <div className="summary-value" style={{ color: color || 'var(--primary-color)' }}>
        {icon && <i className={icon}></i>} {value}
      </div>
    </div>
  );
}

export default StatusCard;