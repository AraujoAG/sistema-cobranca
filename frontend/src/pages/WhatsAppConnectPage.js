// frontend/src/pages/WhatsAppConnectPage.js
import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode.react';
import api from '../services/api';
import './WhatsAppConnectPage.css'; // Vamos criar este arquivo para estilos

function WhatsAppConnectPage() {
  const [qrCodeString, setQrCodeString] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Verificando...');
  const [statusMessage, setStatusMessage] = useState('Aguarde enquanto verificamos a conexão.');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get('/whatsapp/status');
      const newStatus = response.data.status || 'Desconhecido';
      setConnectionStatus(newStatus);
      setStatusMessage(response.data.message || 'Status recebido do servidor.');

      if (newStatus === 'AGUARDANDO_QR') {
        const qrRes = await api.get('/whatsapp/qr');
        setQrCodeString(qrRes.data.qr || '');
      } else {
        setQrCodeString(''); // Limpa o QR se não for mais necessário
      }

    } catch (err) {
      const errorMsg = err.response?.data?.erro || err.message;
      console.error('Erro ao buscar status do WhatsApp:', errorMsg);
      setError('Falha na comunicação com o servidor do WhatsApp. Verifique os logs do backend.');
      setConnectionStatus('Erro');
    }
  }, []); // useCallback para estabilizar a função

  useEffect(() => {
    fetchStatus(); // Busca inicial
    const intervalId = setInterval(fetchStatus, 7000); // Verifica o status a cada 7 segundos
    return () => clearInterval(intervalId); // Limpa o intervalo ao sair da página
  }, [fetchStatus]);

  const handleLogout = async () => {
    setIsLoading(true);
    setError('');
    try {
      await api.post('/whatsapp/logout');
      setStatusMessage('Sessão encerrada com sucesso. A página será atualizada.');
      setTimeout(() => fetchStatus(), 1500); // Dá um tempo e busca o novo status
    } catch (err) {
      setError('Falha ao tentar desconectar a sessão do WhatsApp.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusContent = () => {
    switch (connectionStatus) {
      case 'AGUARDANDO_QR':
        return qrCodeString ? (
          <div className="qr-container">
            <h3>Escaneie para Conectar</h3>
            <p>Abra o WhatsApp no seu celular, vá em "Aparelhos Conectados" e aponte para o código abaixo.</p>
            <QRCode value={qrCodeString} size={256} level="H" renderAs="svg" />
          </div>
        ) : (
          <div className="loader"></div>
        );
      case 'PRONTO':
      case 'CONECTADO':
        return (
          <div className="alert alert-success">
            <i className="fas fa-check-circle"></i> WhatsApp Conectado com Sucesso!
            <p>{statusMessage}</p>
            <button onClick={handleLogout} disabled={isLoading} className="btn btn-warning btn-sm">
              {isLoading ? 'Desconectando...' : 'Desconectar Sessão'}
            </button>
          </div>
        );
      case 'INICIALIZANDO':
        return (
          <>
            <div className="loader"></div>
            <p>Inicializando o serviço do WhatsApp no servidor... Aguarde.</p>
          </>
        );
      default:
        return (
          <div className="alert alert-info">
            <i className="fas fa-info-circle"></i> Status: {connectionStatus}
            <p>{statusMessage}</p>
          </div>
        );
    }
  };

  return (
    <div>
      <div className="card-header">
        <h1>Conectar WhatsApp</h1>
        <button onClick={fetchStatus} disabled={isLoading} className="btn btn-secondary">
          <i className="fas fa-sync-alt"></i> Atualizar Status
        </button>
      </div>
      <div className="card">
        <div className="whatsapp-status-container">
          {error && <div className="alert alert-danger">{error}</div>}
          {renderStatusContent()}
        </div>
      </div>
    </div>
  );
}

export default WhatsAppConnectPage;