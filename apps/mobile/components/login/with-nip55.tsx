// import { useCallback, useEffect, useState } from "react";
// import * as Nip55 from "nostr-nip55-signer";
// import { getInstalledSignerApps, setPackageName, type SignerAppInfo } from "nostr-nip55-signer";
// import { Button } from "../nativewindui/Button";
// import { Text } from "../nativewindui/Text";
// import { View } from "react-native";
// import { StyleSheet } from "react-native";
// import { NDKEncryptionScheme, NDKSigner, NDKUser, NostrEvent, useNDK } from "@nostr-dev-kit/ndk-mobile";

// export class Nip55Signer implements NDKSigner {
//     private _pubkey: string;
//     private _user?: NDKUser;
//     private _packageName: string;

//     constructor(packageName: string) {
//         this._packageName = packageName;
//         console.log('NIP-55 SIGNER STARTING', packageName)
//     }
    
//     /**
//      * Blocks until the signer is ready and returns the associated NDKUser.
//      * @returns A promise that resolves to the NDKUser instance.
//      */
//     async blockUntilReady(): Promise<NDKUser> {
//         if (this._user) return this._user;
        
//         const data = await Nip55.getPublicKey();
//         if (!data) throw new Error('No signer available found');

//         console.log('NIP-55 SIGNER READY', JSON.stringify(data, null, 2))

//         this._user = new NDKUser({ npub: data.npub });
//         this._pubkey = this._user.pubkey;
//         return this._user;
//     }
//     /**
//      * Getter for the user property.
//      * @returns A promise that resolves to the NDKUser instance.
//      */
//     async user(): Promise<NDKUser> {
//         return this.blockUntilReady();
//     }
//     /**
//      * Signs the given Nostr event.
//      * @param event - The Nostr event to be signed.
//      * @returns A promise that resolves to the signature of the signed event.
//      */
//     async sign(event: NostrEvent): Promise<string> {
//         console.log('NIP-55 SIGNER SIGNING', event)
//         const result = await Nip55.signEvent(
//             this._packageName,
//             JSON.stringify(event),
//             event.id,
//             this._pubkey
//         )
//         console.log('NIP-55 SIGNER SIGNED', result)
//         return result.signature;
//     }
    
//     /**
//      * Determine the types of encryption (by nip) that this signer can perform.
//      * Implementing classes SHOULD return a value even for legacy (only nip04) third party signers.
//      * @nip Optionally returns an array with single supported nip or empty, to check for truthy or falsy.
//      * @return A promised list of any (or none) of these strings  ['nip04', 'nip44']
//      */
//     async encryptionEnabled?(scheme?: NDKEncryptionScheme): Promise<NDKEncryptionScheme[]> {
//         return [];
//     }

//     /**
//      * Encrypts the given Nostr event for the given recipient.
//      * Implementing classes SHOULD equate legacy (only nip04) to nip == `nip04` || undefined
//      * @param recipient - The recipient (pubkey or conversationKey) of the encrypted value.
//      * @param value - The value to be encrypted.
//      * @param nip - which NIP is being implemented ('nip04', 'nip44')
//      */
//     async encrypt(recipient: NDKUser, value: string, scheme?: NDKEncryptionScheme): Promise<string> {
//         return "";
//     }
//     /**
//      * Decrypts the given value.
//      * Implementing classes SHOULD equate legacy (only nip04) to nip == `nip04` || undefined
//      * @param sender - The sender (pubkey or conversationKey) of the encrypted value
//      * @param value - The value to be decrypted
//      * @param scheme - which NIP is being implemented ('nip04', 'nip44', 'nip49')
//      */
//     async decrypt(sender: NDKUser, value: string, scheme?: NDKEncryptionScheme): Promise<string> {
//         return "";
//     }
// }

// export default function LoginWithNip55Button() {
//     const [signerApps, setSignerApps] = useState<SignerAppInfo[]>([]);
//     const { ndk, login } = useNDK();
    
//     useEffect(() => {
//         getInstalledSignerApps().then(setSignerApps);
//     }, [])

//     const loginWith = useCallback(async (packageName: string) => {
//         setPackageName(packageName);
//         const signer = new Nip55Signer(packageName);
//         const user = await signer.blockUntilReady();
//         console.log('LOGIN WITH NIP-55', !!user)
//         if (user) {
//             console.log('LOGIN WITH NIP-55', user)
//             login(signer)
//         }
//     }, [])
    
//     if (signerApps.length === 0) return null;

//     return <View style={styles.container}>
//     {signerApps.map((app, index) => (
//             <Button key={index} variant="primary" onPress={() => loginWith(app.packageName)}>
//                 <Text>Login with {app.name}</Text>
//             </Button>
//         ))}
//     </View>
// }

// const styles = StyleSheet.create({
//     container: {
//         flexDirection: 'column',
//         gap: 8,
//     }
// })