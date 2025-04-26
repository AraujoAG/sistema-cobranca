#!/bin/bash

# Iniciar backend
echo "Iniciando o backend..."
cd backend
npm install
gnome-terminal -- npm run dev &
cd ..

# Iniciar frontend
echo "Iniciando o frontend..."
cd frontend
npm install
gnome-terminal -- npm start &
cd ..

echo "Aplicação iniciada. Acesse http://localhost:3000 no navegador."
