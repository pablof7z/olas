import { useState, useRef } from 'react';
import { Button, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SegmentedControl } from '~/components/nativewindui/SegmentedControl';
import ReceiveLn from '~/components/cashu/receive/ln';
import ReceiveEcash from '~/components/cashu/receive/ecash';
import { router } from 'expo-router';

function ReceiveView() {
    const [view, setView] = useState<'ecash' | 'ln'>('ln');

    const onReceived = () => {
        router.back();
    }

    return (
        <View style={{ flex: 1 }}>
            <SegmentedControl
                values={['Lightning', 'Ecash']}
                selectedIndex={view === 'ln' ? 0 : 1}
                onIndexChange={(index) => {
                    setView(index === 0 ? 'ln' : 'ecash');
                }}
            />
            
            {view === 'ln' ? (
                <ReceiveLn onReceived={onReceived} />
             ) : (
                <ReceiveEcash onReceived={onReceived} />
             )}
        </View>
    );
}

export default ReceiveView;