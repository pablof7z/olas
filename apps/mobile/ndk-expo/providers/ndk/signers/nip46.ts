import NDK, { NDKPrivateKeySigner, NDKNip46Signer } from "@nostr-dev-kit/ndk";
import { Linking } from "react-native";

export async function withNip46(ndk: NDK, token: string, sk?: string) {
    let localSigner = NDKPrivateKeySigner.generate();
    if (sk) {
        localSigner = new NDKPrivateKeySigner(sk);
    }

    return new NDKNip46Signer(ndk, token, localSigner);
}
