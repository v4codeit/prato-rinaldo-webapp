'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
    isCommunityFullscreen: boolean;
    setCommunityFullscreen: (value: boolean) => void;
    isCondominioFullscreen: boolean;
    setCondominioFullscreen: (value: boolean) => void;
    // Combined check for any fullscreen mode (hides nav/header)
    isAnyFullscreen: boolean;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [isCommunityFullscreen, setCommunityFullscreen] = useState(false);
    const [isCondominioFullscreen, setCondominioFullscreen] = useState(false);

    const isAnyFullscreen = isCommunityFullscreen || isCondominioFullscreen;

    return (
        <UIContext.Provider value={{
            isCommunityFullscreen,
            setCommunityFullscreen,
            isCondominioFullscreen,
            setCondominioFullscreen,
            isAnyFullscreen,
        }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}
