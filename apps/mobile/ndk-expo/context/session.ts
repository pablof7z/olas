import { Hexpubkey } from "@nostr-dev-kit/ndk";
import { createContext } from "react";

interface NDKSessionContext {
    follows?: Array<Hexpubkey>;
}

const NDKSessionContext = createContext<NDKSessionContext>({
    follows: [],
});

export default NDKSessionContext;
