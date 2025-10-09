import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import BridgePage from './BridgePage.tsx';
import './index.css';

const getCanonicalPath = () => {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return path === '' ? '/' : path;
};

const RootRouter = () => {
  const path = getCanonicalPath();
  if (path === '/bridge') {
    return <BridgePage />;
  }
  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootRouter />
  </StrictMode>
);
