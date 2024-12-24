import { useNDKSession } from '@nostr-dev-kit/ndk-mobile';
import { Text } from 'react-native';

export default function App() {
    const { follows, randomId } = useNDKSession();
    return (
        <>
            <Text>follows = {follows?.length}</Text>
            <Text>randomId = {randomId}</Text>
        </>
    );
}
