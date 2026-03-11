import React, { createContext, useContext, useState, useEffect } from 'react';
import { MODES } from '../constants/modes';

const ModeContext = createContext();

export const ModeProvider = ({ children }) => {
    const [activeMode, setActiveMode] = useState(MODES.HOME);

    const switchMode = (mode) => {
        if (Object.values(MODES).includes(mode)) {
            console.log(`Switching to mode: ${mode}`);
            setActiveMode(mode);
        } else {
            console.error(`Invalid mode: ${mode}`);
        }
    };

    const value = {
        activeMode,
        switchMode,
        isHome: activeMode === MODES.HOME,
        isDeaf: activeMode === MODES.DEAF,
        isBlind: activeMode === MODES.BLIND,
        isMotor: activeMode === MODES.MOTOR,
    };

    return (
        <ModeContext.Provider value={value}>
            {children}
        </ModeContext.Provider>
    );
};

export const useMode = () => {
    const context = useContext(ModeContext);
    if (!context) {
        throw new Error('useMode must be used within a ModeProvider');
    }
    return context;
};
