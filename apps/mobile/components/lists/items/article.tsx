import { Text } from "@/components/nativewindui/Text";
import { NDKArticle } from "@nostr-dev-kit/ndk";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { View, Dimensions, StyleSheet } from "react-native";
import { ListItem } from '~/components/nativewindui/List';
import * as User from "@/ndk-expo/components/user";
import { cn } from "@/lib/cn";

type ArticleItemProps = {
    article: NDKArticle;
    onPress: () => void;
    index: number;
};

export function FeaturedArticle({ article }: ArticleItemProps) {
    return (
        
        <View className="relative" style={{ height: Dimensions.get('window').height*0.5 }}>
            <Image source={article.image} className="w-full h-full flex-1" style={{ objectFit: 'cover', height: '100%', maxWidth: '100%' }} />
                
            <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,1)']}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%' }}
            />
            
            <View style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
                <Text numberOfLines={2} variant="heading" className="text-3xl font-bold text-white font-serif">{article.title}</Text>

                <View className="flex-row items-center gap-4 py-2">
                    <User.Profile pubkey={article.pubkey}>
                        <User.Avatar alt="" className="w-8 h-8" />

                        <View className="flex-1 flex-col items-start">
                            <Text variant="subhead" className="text-white"><User.Name /></Text>
                        </View>
                    </User.Profile>
                </View>
            </View>
        </View>
    );
}

const TEXT_STYLE = {
    paddingRight: 96,
};

export function Article({ article, onPress, index }: ArticleItemProps) {
    let titleLines = 1;
    let size = 80;
    if (article.title) {
        size += 20;
    }
    if (article.summary) {
        size += 10;
    } else {
        titleLines = 2;
        size += 10;
    }
    
    return (
        <ListItem
            item={article}
            textNumberOfLines={1}
            subTitleNumberOfLines={1}
            onLongPress={noop}
            onPress={onPress}
            skipTitle={true}
            style={{ height: size }}
            className={cn(
                index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
            )}
        >
            <View style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title} numberOfLines={titleLines}>{article.title}</Text>
                    <Text style={styles.summary} numberOfLines={2}>{article.summary}</Text>
                    <Text style={styles.meta}>
                        <User.Profile pubkey={article.pubkey}>
                            <User.Name />
                        </User.Profile>
                        • 4 min read
                    </Text>
                </View>

                <Image source={article.image} style={styles.image} />
                
            </View>
        </ListItem>
    );
    
    return (
        <ListItem
            item={article}
            textNumberOfLines={1}
            subTitleNumberOfLines={1}
            onLongPress={noop}
            onPress={onPress}
            className={cn(
                'h-[88px]',
                index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
            )}
            titleStyle={TEXT_STYLE}
            titleClassName="font-medium text-lg"
            rightView={
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <Image source={article.image} style={styles.image} />
                </View>
            }
        >
        </ListItem>
    );

}

const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      padding: 10,
      paddingVertical: 20,
      gap: 20,
    },
    content: { flex: 1, paddingRight: 10 },
    image: { width: 90, height: 90, borderRadius: 8 },
    title: { fontSize: 18, fontWeight: 'bold' },
    meta: { fontSize: 12, marginVertical: 4 },
    summary: { fontSize: 14 },
  });

  function noop() {}