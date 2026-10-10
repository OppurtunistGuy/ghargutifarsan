import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/mukta/devanagari-400.css';
import '@fontsource/mukta/devanagari-600.css';
import '@fontsource/mukta/latin-400.css';
import '@fontsource/mukta/latin-600.css';
import '@fontsource-variable/noto-serif';
import '@fontsource-variable/noto-serif-devanagari';
import '@fontsource/kalam/devanagari-400.css';
import './styles/index.css';
import { App } from './app/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
