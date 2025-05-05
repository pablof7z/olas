import type React from 'react';
import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

type ScrollYContextType = SharedValue<number> | null;

const ScrollYContext = createContext<ScrollYContextType>(null);

export const ScrollYProvider = ({
    value,
    children,
}: {
    value: SharedValue<number>;
    children: React.ReactNode;
}) => <ScrollYContext.Provider value={value}>{children}</ScrollYContext.Provider>;

export const useScrollY = (): SharedValue<number> => {
    const context = useContext(ScrollYContext);
    if (!context) {
        throw new Error('useScrollY must be used within a ScrollYProvider');
    }
    return context;
};
