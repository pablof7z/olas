import { Platform, View, type ViewStyle } from 'react-native';

import { useNDKWallet } from '@/ndk-expo/providers/wallet';

const ROOT_STYLE: ViewStyle = { flex: 1 };

export default function WelcomeConsentScreen() {
    return (
        <View style={ROOT_STYLE}>
        </View>
    );
}

const FEATURES = [
  {
    title: '#reckless',
    description: 'This is very experimental. Expect bugs, annoyances aaaaand money gone.',
    icon: 'brain'
  },
  {
    title: 'Powered by Cashu',
    description: 'Interact with your NIP-60 cashu tokens',
    icon: 'message-processing',
  },
] as const;
