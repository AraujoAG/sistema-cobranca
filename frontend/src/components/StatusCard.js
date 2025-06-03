// frontend/src/components/StatusCard.js
import React from 'react';

// Certifique-se que os ícones (ex: className={icon}) sejam classes válidas do Font Awesome
// e que o Font Awesome esteja carregado no projeto.

function StatusCard({ title, value, icon, color = '#d32f2f' }) { // Cor padrão
  return (
    <div className="summary-card"> {/* summary-card já tem estilos em App.css */}
      <div
        className="summary-card-icon" // Estilo para o ícone em App.css
        style={{
          // fontSize: '32px', // Removido para usar o estilo de .summary-card-icon do App.css
          color: color,
          // marginBottom: '10px' // Removido para usar o estilo de .summary-card-icon do App.css
        }}
      >
        <i className={icon}></i> {/* Ex: "fas fa-users" */}
      </div>
      <h3>{title}</h3> {/* h3 será estilizado por .summary-card h3 em App.css */}
      <div className="summary-value" style={{ color: color }}> {/* .summary-value estilizado em App.css */}
        {value !== undefined && value !== null ? value : '-'}
      </div>
    </div>
  );
}

export default StatusCard;