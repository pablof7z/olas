import { View, StyleSheet, TextInput } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { useCallback, useState } from "react";
import { Ruler } from "@/components/Ruler";
import Lightning from "@/components/icons/lightning";
import { NDKEvent, useNDKWallet, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { NDKUser } from "@nostr-dev-kit/ndk-mobile";
import { atom, useAtomValue } from "jotai";
import { Button } from "@/components/nativewindui/Button";
import { formatMoney } from "@/utils/bitcoin";
import { useSharedValue } from "react-native-reanimated";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useColorScheme } from "../useColorScheme";
import { useZap } from "@/hooks/zap";
import * as User from "@/components/ui/user";

type ZapperModalTarget = NDKEvent | NDKUser;
export const zapperModalTargetAtom = atom<ZapperModalTarget | null, [ZapperModalTarget | null], void>(null, (get, set, value) => {
    set(zapperModalTargetAtom, value);
});

export default function Zapper({ onClose }: { onClose: () => void }) {
    const [comment, setComment] = useState<string>('');
    const [amount, setAmount] = useState<number>(21);
    const target = useAtomValue(zapperModalTargetAtom);
    const { userProfile } = useUserProfile(target?.pubkey);
    const amountValue = useSharedValue(amount);

    const sendZap = useZap();

    const handlePress = useCallback(() => {
        if (!target) return;

        sendZap(comment, amount, target);
        onClose();
    }, [target, comment, amount, onClose]);

    const { colors } = useColorScheme();

    if (!target) return null;

    return (
        <View style={styles.container}>
            <View style={styles.titleContainer}>
                <User.Avatar userProfile={userProfile} pubkey={target.pubkey} imageSize={64} />
                <User.Name userProfile={userProfile} pubkey={target.pubkey} className="font-bold text-foreground" />
                <View style={{flex: 1}} />
            </View>
            
            <BottomSheetTextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Comment"
                style={[styles.commentInput, { borderColor: colors.grey4, color: colors.foreground, backgroundColor: colors.card, fontSize: 16 }]}
            />

            <BottomSheetTextInput
                value={amount.toString()}
                onChangeText={(v) => setAmount(Number(v))}
                placeholder="Amount"
                keyboardType="numeric"
                style={[styles.commentInput, { borderColor: colors.grey4, color: colors.foreground, backgroundColor: colors.card, fontSize: 16 }]}
            />

            <Button variant="primary" onPress={handlePress} style={{ width: '100%' }}>
                <Text>
                    Zap{' '}
                    <Text className="font-black">{formatMoney({ amount, unit: 'sats' })}</Text>
                </Text>
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 24,
    },

    titleContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    rulerContainer: {
      flex: 1,
      justifyContent: "center",
      gap: 24,
    },
    commentInput: {
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
    }
  });