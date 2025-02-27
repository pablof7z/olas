// Inspiration: https://dribbble.com/shots/15057600-Wallpapers-App-Interactions
import { NDKEvent, NDKImage, NDKKind, useSubscribe, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { Stack, useLocalSearchParams } from "expo-router";
import { AnimatePresence } from "framer-motion";
import { MotiView } from "moti";
import * as React from "react";
import { useCallback, useMemo } from "react";
import {
  Animated,
  Dimensions,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import EventMediaContainer from "@/components/media/event";
import { FlashList } from "@shopify/flash-list";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("screen");

const IMAGE_WIDTH = width * 0.8;
const IMAGE_HEIGHT = height * 0.75;
const SPACING = 10;

const currentYear = new Date().getFullYear();

function getDayOfYear(timestamp: number) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const diffTime = Math.abs(date.getTime() - startOfYear.getTime());
    const difference_In_Days = Math.ceil(diffTime / (1000 * 3600 * 24)); 

    if (year !== currentYear) return;
    
    return difference_In_Days;
}

export default function Wallpapers() {
    const scrollX = React.useRef(new Animated.Value(0)).current;
    const { pubkey } = useLocalSearchParams();
    const { events } = useSubscribe<NDKImage>([
        { kinds: [NDKKind.Image], "#t": ["olas365", "#Olas365"], authors: [pubkey] },
    ], { wrap: true}, [pubkey])
    
    const [cardEntries, gridEntries] = useMemo(() => {
        const dayOfTodayInTheYear = getDayOfYear(new Date().getTime() / 1000);
        let days = Array.from({ length: dayOfTodayInTheYear }, (_, index) => (
            { day: index + 1, event: null, url: null }
        ));
    
        for (const event of events) {
            const url = event?.imetas?.[0]?.url;
            if (!url) continue;
            const day = getDayOfYear(event.created_at);
            if (!day) continue;
            days[day-1].event = event;
            days[day-1].url = url;
        }

        days = days.reverse();

        return [
            days.filter(e => !!e.event),
            days
        ]
    }, [events]);

    const { userProfile } = useUserProfile(pubkey);

    return (
      <>
            <Stack.Screen options={{
                headerTransparent: true,
                headerTitle: userProfile?.name ? `${userProfile?.name}'s #olas365` : '#olas365',
                headerBackTitle: 'Back',
                headerBackVisible: true,
                headerTintColor: 'white',
                
            }} />
    <ScrollView>
    <View
      style={{ flex: 1, backgroundColor: "#000", justifyContent: "flex-end", height: Dimensions.get("screen").height }}>
      <AnimatePresence>
        {cardEntries.length === 0 && (
          <MotiView
            key='loading'
            from={{ opacity: 0.8, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{
              type: "timing",
              duration: 1000,
            }}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              width,
              height,
            }}>
            <Text>Loading ...</Text>
          </MotiView>
        )}
      </AnimatePresence>
      <View style={[StyleSheet.absoluteFillObject]}>
        {cardEntries.map((item, index) => {
          // doing it faster instead of halfway through
          const inputRange = [index - 0.8, index, index + 0.8];
          const animated = Animated.divide(scrollX, IMAGE_WIDTH + SPACING * 2);

          const opacity = animated.interpolate({
            inputRange,
            outputRange: [0, 0.4, 0],
          });
          const textOpacity = animated.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
          });
          const textTranslate = animated.interpolate({
            inputRange,
            outputRange: [200, 0, -200],
          });
          return (
            <SafeAreaView
              key={`bg-item-${item.day}`}
              style={[StyleSheet.absoluteFillObject]}>
              <Animated.Image
                source={{ uri: item.url }}
                style={[StyleSheet.absoluteFillObject, { opacity }]}
                blurRadius={30}
              />
              <View
                style={[
                  {
                    flex: 0.25,
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: cardEntries.length + 1,
                  },
                ]}>
                <Animated.View
                  style={{
                    opacity: textOpacity,
                    transform: [{ translateX: textTranslate }],
                    marginBottom: SPACING * 2,
                    alignItems: "center",
                  }}>
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 28,
                      marginBottom: SPACING / 2,
                      fontWeight: "800",
                      textTransform: "capitalize",
                    }}>
                        Day #{getDayOfYear(item.event.created_at)}
                  </Text>
                  <Text
                    style={{ color: "#ffffffcc", fontSize: 16, fontWeight: "500", textAlign: "center", marginBottom: SPACING }}
                    numberOfLines={3}
                    adjustsFontSizeToFit>
                    {item.event.content}
                  </Text>
                          <Text style={{ color: "#ffffffaa", fontSize: 13, fontWeight: "500", textAlign: "center" }}>
                            {new Date(item.event.created_at * 1000).toLocaleDateString()}
                          </Text>
                </Animated.View>
              </View>
            </SafeAreaView>
          );
        })}
      </View>
      <Animated.FlatList
        data={cardEntries}
        extraData={cardEntries}
        keyExtractor={(item) => String(item.event.id)}
        scrollEventThrottle={16}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: (width - (IMAGE_WIDTH + SPACING * 2)) / 2,
        }}
        style={{ flexGrow: 0, backgroundColor: "transparent" }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          {
            useNativeDriver: true,
          }
        )}
        snapToInterval={IMAGE_WIDTH + SPACING * 2}
        decelerationRate='fast'
        renderItem={({ item, index }) => {
          const inputRange = [index - 1, index, index + 1];
          const animated = Animated.divide(scrollX, IMAGE_WIDTH + SPACING * 2);

          const translateY = animated.interpolate({
            inputRange,
            outputRange: [100, 40, 100],
            extrapolate: "clamp",
          });
          const scale = animated.interpolate({
            inputRange,
            outputRange: [1.5, 1, 1.5],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              style={{
                width: IMAGE_WIDTH,
                height: IMAGE_HEIGHT,
                transform: [
                  {
                    translateY,
                  },
                ],
                margin: SPACING,
                overflow: "hidden",
                borderRadius: 30,
              }}>
              <Animated.Image
                style={{
                  borderRadius: 20,
                  width: IMAGE_WIDTH,
                  height: IMAGE_HEIGHT,
                  resizeMode: "cover",
                  transform: [{ scale }],
                }}
                source={{ uri: item.url }}
              />
            </Animated.View>
          );
        }}
      />
    </View>
    <Olas365View entries={gridEntries} />
            </ScrollView>
            </>
  );
}
function EmptyDay() {
    return <View style={{ backgroundColor: '#ddd', flex: 1, width: '100%', height: '100%' }} />
}

export function Olas365View({ entries }: { entries: { day: number, event: NDKEvent }[] }) {
    const renderItem = useCallback(({ item: { day, event } }: { item: { day: number, event: NDKEvent } }) => {
        return <View style={{ width: Dimensions.get('window').width / 3, height: Dimensions.get('window').width / 3 }}>
            {event ? (
                <EventMediaContainer
                    event={event}
                    width={Dimensions.get('window').width / 3}
                    height={Dimensions.get('window').width / 3}
                    contentFit="cover"
                    maxWidth={Dimensions.get('window').width}
                    singleMode
                    maxHeight={Dimensions.get('window').width}
                />
            ) : (
                <EmptyDay />
            )}

            <Text style={{ padding: 4, fontSize: 12, color: 'gray', position: 'absolute', bottom: 0, left: 0, right: 0 }}>Day {day}</Text>
        </View>
    }, []);

    return (
        <FlashList
            data={entries}
            estimatedItemSize={500}
            keyExtractor={(e) => e.day.toString()}
            scrollEventThrottle={100}
            numColumns={3}
            renderItem={renderItem}
            disableIntervalMomentum={true}
        />
    )
}