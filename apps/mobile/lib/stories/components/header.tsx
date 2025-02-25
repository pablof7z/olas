import { NDKImage } from "@nostr-dev-kit/ndk-mobile";
import { View, TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import * as User from '@/components/ui/user';
import { useUserProfile } from "@/hooks/user-profile";

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

    return (
      <View style={[styles.container, style]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
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
        </View>
        
        <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
          <Text style={{ color: 'white', fontSize: 24 }}>✕</Text>
        </TouchableOpacity>
      </View>
      </View>
    );
}
  
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    top: 0,
    left: 0,
    right: 0,
  }
});
