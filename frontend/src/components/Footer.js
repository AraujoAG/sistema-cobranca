// frontend/src/components/Footer.js
import React from 'react';

function Footer() {
  return (
    <footer className="footer"> {/* Mudado para tag semântica footer */}
      <p>&copy; {new Date().getFullYear()} Alta Linha Móveis - Sistema de Cobranças v1.0.1</p>
    </footer>
  );
}

export default Footer;