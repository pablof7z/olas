import { createContext, useContext, useRef } from 'react';

const ScrollContext = createContext<any>(null);

export function ScrollProvider({ children }: { children: React.ReactNode }) {
    const scrollRef = useRef(null);
    return <ScrollContext.Provider value={scrollRef}>{children}</ScrollContext.Provider>;
}

export function useScroll() {
    return useContext(ScrollContext);
}
