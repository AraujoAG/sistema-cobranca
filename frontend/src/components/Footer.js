// frontend/src/components/Footer.js
import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        Copyright &copy;{new Date().getFullYear()} Alta Linha Móveis. All rights reserved.
      </div>
      <div className="footer-center">
        Sistema de Cobranças - Alta Linha Móveis v1.0
      </div>
      <div className="footer-right">
        Desenvolvido por Anderson Gabriel.
      </div>
    </footer>
  );
}

export default Footer;