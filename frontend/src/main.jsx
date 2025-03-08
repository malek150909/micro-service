import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css_files/index.css'
import App from './App.jsx'
import './css_files/evenement.css';
import reportWebVitals from './reportWebVitals';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

reportWebVitals();