import { Text } from '@/components/nativewindui/Text';
import { useSubscribe } from '@/ndk-expo';
import { NDKArticle } from '@nostr-dev-kit/ndk';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Dimensions, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Markdown from 'react-native-markdown-display';
import * as User from '@/ndk-expo/components/user';
import { Button } from '../nativewindui/Button';
import { LinearGradient } from 'expo-linear-gradient';

interface ArticleProps {
    article: NDKArticle;
}

export default function Article({ article }: ArticleProps) {
    return (
        <ScrollView className="w-full flex-1 border-b border-gray-200">
            <View className="relative">
                <Image
                    source={article.image}
                    className="h-full w-full flex-1"
                    style={{ contentFit: 'cover', aspectRatio: 16 / 9, maxHeight: Dimensions.get('window').height / 2, width: '100%' }}
                />

                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,1)']}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%' }}
                />

                <View style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
                    <Text variant="heading" className="text-3xl font-bold text-white">
                        {article.title}
                    </Text>
                </View>
            </View>

            <View className="flex-row items-center gap-4 border-y border-gray-200 px-4 py-2">
                <User.Profile pubkey={article.pubkey}>
                    <User.Avatar className="h-12 w-12" />

                    <View className="flex-1 flex-col items-start">
                        <Text variant="subhead" className="text-lg font-bold">
                            <User.Name />
                        </Text>
                    </View>

                    <Button variant="primary">
                        <Text>Follow</Text>
                    </Button>
                </User.Profile>
            </View>

            <View className="bg-card p-4 font-serif">
                <Markdown className="font-serif">{article.content}</Markdown>
            </View>
        </ScrollView>
    );
}
