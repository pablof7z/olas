import { NDKEvent } from "@nostr-dev-kit/ndk";
import { Dimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { View, Text } from "react-native";

export default function ImageCard({ event }: { event: NDKEvent }) {
    const url = event.tagValue('url');
    
    return <View className="flex-1">
        <Image source={{ uri: url }} style={styles.image} />
        <Text>{url}</Text>
    </View>
}

const styles = StyleSheet.create({
    image: {
        width: Dimensions.get('window').width,
        height: 240,
        objectFit: 'cover',
    }
})