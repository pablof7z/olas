import { toast } from "@backpackapp-io/react-native-toast";
import { useNDKNutzapMonitor, useNDKCurrentUser, NDKNutzap } from "@nostr-dev-kit/ndk-mobile";
import { useState, useRef, useEffect } from "react";

export default function NutzapMonitor() {
    const [start, setStart] = useState(false);
    const { nutzapMonitor } = useNDKNutzapMonitor(start);
    const connected = useRef(false);
    const currentUser = useNDKCurrentUser();

    useEffect(() => {
        // don't start until there's a user
        if (!currentUser?.pubkey) return;

        // don't start if already started
        if (start) return;

        setTimeout(() => setStart(true), 15000);
    }, [currentUser?.pubkey, start])

    if (!nutzapMonitor) return null;
    if (connected.current) {
        return null;
    }

    connected.current = true;

    // nutzapMonitor.on("seen", (event) => {
    //     console.log("seen", JSON.stringify(event.rawEvent(), null, 4));
    //     console.log(`https://njump.me/${event.encode()}`)
    //     // toast.success("Received a nutzap for " + event.amount + " " + event.unit);
    // });
    nutzapMonitor.on("redeem", (event) => {
        const nutzap = NDKNutzap.from(event);
        toast.success("Redeemed a nutzap for " + nutzap.amount + " " + nutzap.unit);
    });
}
