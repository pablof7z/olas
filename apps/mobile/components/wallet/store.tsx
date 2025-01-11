import { NDKEvent, NDKPaymentConfirmation, NDKZapper, NDKZapSplit } from '@nostr-dev-kit/ndk-mobile';
import { create, useStore } from 'zustand';

type ActiveEventStoreState = {
    activeEvent: NDKEvent | null;
    setActiveEvent: (event?: NDKEvent) => void;
};

/** Store */
export const activeEventStore = create<ActiveEventStoreState>((set) => ({
    activeEvent: null,
    setActiveEvent(event?: NDKEvent): void {
        set(() => ({ activeEvent: event }));
    },
}));

export const useActiveEventStore = () => {
    return useStore(activeEventStore);
}

export type ZapperWithId = { zapper: NDKZapper, internalId: string }

type AppStateStoreState = {
    pendingPayments: ZapperWithId[]
    addPendingPayment: (zap: NDKZapper) => void
    removePendingPayment: (internalId: string) => void
}

export const appStateStore = create<AppStateStoreState>((set) => ({
    pendingPayments: [],
    addPendingPayment(zapper: NDKZapper): void {
        const zapperWithId: ZapperWithId = {
            zapper,
            internalId: Math.random().toString(),
        }
        
        zapper.once('complete', (results: Map<NDKZapSplit, NDKPaymentConfirmation | Error | undefined>) => {
            // only remove when the payment didn't error; when it errors we leave it for the user to remove
            // manually or remove after a timeout
            if (Array.from(results.values()).some((result) => result instanceof Error)) {
                setTimeout(() => {
                    set((state) => ({ pendingPayments: state.pendingPayments.filter((z) => z.internalId !== zapperWithId.internalId) }));
                }, 20000);
                return;
            }
            
            set((state) => ({ pendingPayments: state.pendingPayments.filter((z) => z.internalId !== zapperWithId.internalId) }));
        });
        set((state) => ({ pendingPayments: [...state.pendingPayments, zapperWithId] }));
    },

    removePendingPayment(internalId: string): void {
        set((state) => ({ pendingPayments: state.pendingPayments.filter((z) => z.internalId !== internalId) }));
    },

}));

export const useAppStateStore = () => {
    return useStore(appStateStore);
}