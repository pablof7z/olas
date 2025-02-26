import { NDKImage } from "@nostr-dev-kit/ndk-mobile";
import { View, TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, Pressable } from "react-native";
import * as User from '@/components/ui/user';
import { useUserProfile } from "@/hooks/user-profile";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type StoryHeaderProps = {
    item: NDKImage,
    onClose: () => void,
    style?: StyleProp<ViewStyle>,
}

export function StoryHeader({
    item,
    style,
    onClose,
}: StoryHeaderProps) {
    const { userProfile, flare } = useUserProfile(item.pubkey);
    const insets = useSafeAreaInsets();

    return (
      <View style={[styles.container, style, { paddingTop: insets.top }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => router.push(`/profile?pubkey=${item.pubkey}`)}>
          <User.Avatar 
            pubkey={item.pubkey} 
            userProfile={userProfile} 
            imageSize={32} 
            flare={flare}
          />
          <User.Name
            userProfile={userProfile}
            pubkey={item.pubkey}
            style={{ color: 'white', marginLeft: 8, fontWeight: '600' }}
          />
        </Pressable>
        
        <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
          <Text style={{ color: 'white', fontSize: 24 }}>✕</Text>
        </TouchableOpacity>
      </View>
      </View>
    );
}
  
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: 10,
    left: 0,
    right: 0,
  }
});
