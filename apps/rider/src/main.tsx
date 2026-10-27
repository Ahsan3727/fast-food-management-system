import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/tokens.css';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15_000 } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-center" toastOptions={{
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-fg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font)',
            fontSize: '14px',
            boxShadow: 'var(--shadow-2)',
          },
        }} />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
