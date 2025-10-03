import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './App.jsx'; 
import StudentProfile from './StudentProfile.jsx'; 
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} /> 
        <Route path="/student/:id" element={<StudentProfile />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);