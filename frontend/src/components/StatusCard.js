// frontend/src/components/StatusCard.js
import React from 'react';

function StatusCard({ title, value, icon, color = '#d32f2f' }) {
  return (
    <div className="summary-card">
      <div 
        style={{ 
          fontSize: '36px', 
          color: color, 
          marginBottom: '10px' 
        }}
      >
        <i className={icon}></i>
      </div>
      <h3>{title}</h3>
      <div className="summary-value" style={{ color: color }}>
        {value}
      </div>
    </div>
  );
}

export default StatusCard;