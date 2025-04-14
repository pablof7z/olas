import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Button, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import ReceiveEcash from '~/components/cashu/receive/ecash';
import ReceiveLn from '~/components/cashu/receive/ln';
import { SegmentedControl } from '~/components/nativewindui/SegmentedControl';

function ReceiveView() {
    const [view, setView] = useState<'ecash' | 'ln'>('ln');

    const onReceived = () => {
        router.back();
    };

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
