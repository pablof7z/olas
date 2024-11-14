import { useState, useRef } from 'react';
import { Button, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SegmentedControl } from '~/components/nativewindui/SegmentedControl';
import ReceiveLn from '@/components/cashu/send/ln';
import { router } from 'expo-router';
import SendLn from '@/components/cashu/send/ln';
import SendZap from '@/components/cashu/send/zap';

function ReceiveView() {
    const [view, setView] = useState<'ecash' | 'ln'>('ecash');

    const onReceived = () => {
        router.back();
    }

    return (
        <View style={{ flex: 1 }}>
            <SegmentedControl
                values={['Lightning', 'Zap']}
                selectedIndex={view === 'ln' ? 0 : 1}
                onIndexChange={(index) => {
                    setView(index === 0 ? 'ln' : 'ecash');
                }}
            />
            
            {view === 'ln' ? (
                <SendLn />
             ) : (
                <SendZap />
             )}
        </View>
    );
}

export default ReceiveView;