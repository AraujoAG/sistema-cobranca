// frontend/src/components/StatusCard.js
import React from 'react';

// Certifique-se que os ícones (ex: className={icon}) sejam classes válidas do Font Awesome
// e que o Font Awesome esteja carregado no projeto.

function StatusCard({ title, value, icon, color = '#d32f2f' }) { // Cor padrão
  return (
    <div className="summary-card">
      <div
        className="summary-card-icon" // Adicionada classe para estilização do ícone se necessário
        style={{
          fontSize: '32px', // Ajustado tamanho do ícone
          color: color,
          marginBottom: '10px'
        }}
      >
        <i className={icon}></i> {/* Ex: "fas fa-users" */}
      </div>
      <h3>{title}</h3>
      <div className="summary-value" style={{ color: color }}>
        {value !== undefined && value !== null ? value : '-'} {/* Mostra '-' se o valor for indefinido */}
      </div>
    </div>
  );
}

export default StatusCard;