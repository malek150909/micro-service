import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import reportWebVitals from './admin/evenement/reportWebVitals.jsx';
import './css_files/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

reportWebVitals();