import { useNDKNutzapMonitor } from "@nostr-dev-kit/ndk-mobile";
import Lightning from "../icons/lightning";
import { useEffect, useState } from "react";
import { Pressable } from "react-native";

export default function WalletButton({ focused, color }: { focused: boolean, color: string }) {
    const { nutzapMonitor } = useNDKNutzapMonitor(false);

    const [animate, setAnimate] = useState(false);

    const go = () => {
        setAnimate(true);
        setTimeout(() => setAnimate(false), 1000);
    }

    useEffect(go, []);

    useEffect(() => {
        if (!nutzapMonitor) return;

        nutzapMonitor.on("redeem", (event) => {
            setAnimate(true);
            setTimeout(() => setAnimate(false), 1000);
        });
    }, [nutzapMonitor])
    
    return (
            <Lightning 
                width={24} 
                height={24} 
                strokeWidth={focused ? 2.5 : 2} 
                fill={animate ? "orange" : (focused ? color : "transparent")}
                stroke={animate ? "orange" : color}
                style={{ transition: 'all 0.3s ease-in-out' }}
            />
    )
}
