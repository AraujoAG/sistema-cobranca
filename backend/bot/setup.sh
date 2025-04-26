#!/bin/bash
# Script de configuração do bot de cobrança

echo "=== Configurando Sistema de Cobranças Alta Linha Móveis ==="
echo "Instalando dependências..."

# Instala as dependências
npm install express ejs body-parser @wppconnect-team/wppconnect xlsx node-cron

# Cria a pasta de views
mkdir -p views
mkdir -p public

echo "Criando diretórios necessários..."

# Verifica se o sistema está rodando como serviço
if [ "$1" == "--service" ]; then
  echo "Configurando serviço para execução 24/7..."
  
  # Substitui o caminho no arquivo de serviço
  sed -i "s|/caminho/para/pasta/do/bot|$(pwd)|g" cobranca-bot.service
  sed -i "s|seu_usuario|$(whoami)|g" cobranca-bot.service
  
  # Copia o arquivo de serviço para o diretório do systemd
  sudo cp cobranca-bot.service /etc/systemd/system/
  
  # Recarrega o systemd
  sudo systemctl daemon-reload
  
  # Habilita e inicia o serviço
  sudo systemctl enable cobranca-bot
  sudo systemctl start cobranca-bot
  
  echo "Serviço configurado e iniciado!"
  echo "Para verificar o status: sudo systemctl status cobranca-bot"
else
  echo "Iniciando o servidor..."
  node server.js
fi

echo "Configuração concluída!"