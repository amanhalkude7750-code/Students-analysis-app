import React from 'react';
import { useMode } from './context/ModeContext';
import { MODES } from './constants/modes';
import HomeMode from './components/modes/HomeMode';
import DeafMode from './components/modes/DeafMode';
import BlindMode from './components/modes/BlindMode';
import MotorMode from './components/modes/MotorMode';
import DeafLearnMode from './components/modes/DeafLearnMode';
import SignLanguageMenu from './components/modes/SignLanguageMenu';
import DeafAnalysis from './components/modes/DeafAnalysis';
import DeafMeeting from './components/modes/DeafMeeting';

import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Routes>
        <Route path="/" element={<HomeMode />} />
        <Route path="/index.html" element={<HomeMode />} />
        <Route path="/deaf" element={<DeafMode />} />
        <Route path="/deaf/menu" element={<SignLanguageMenu />} />
        <Route path="/deaf/analysis" element={<DeafAnalysis />} />
        <Route path="/deaf/learn" element={<DeafLearnMode />} />
        <Route path="/deaf/meeting" element={<DeafMeeting />} />
        <Route path="/blind" element={<BlindMode />} />
        <Route path="/motor" element={<MotorMode />} />
      </Routes>
    </div>
  );
}

export default App;
