import type { FC } from "react";
import React, { useCallback } from "react";
import type { SkRect, SkSize } from "@shopify/react-native-skia";
import {
  Canvas,
  Group,
  Skia,
  fitbox,
  rect,
  processTransform2d,
} from "@shopify/react-native-skia";
import { Dimensions, Pressable, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { makeMutable } from "react-native-reanimated";

import { stickers } from "./stickers";
import { useStickerContext } from "./StickerContext";
import type { StickerProps } from "./stickers/Sticker";
import { router } from "expo-router";

const window = Dimensions.get("window");
const COLS = 2;
const tileWidth = window.width / COLS;
const tileHeight = 125;

export const deflate = (rct: SkRect, amount: number) =>
  rect(
    rct.x + amount,
    rct.y + amount,
    rct.width - amount * 2,
    rct.height - amount * 2
  );


export const StickerModal = () => {
  const { addSticker } = useStickerContext();
  const onPress = useCallback(
    (Sticker: FC<StickerProps>, size: SkSize) => {
      const src = rect(0, 0, size.width, size.height);
      const dst = deflate(rect(0, 0, window.width, window.height), 24);
      const m3 = processTransform2d(fitbox("contain", src, dst));
      const matrix = makeMutable(m3);
      addSticker({
        Sticker,
        size,
        matrix,
      });
      router.back();
    },
    [addSticker]
  );
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgb(34, 33, 33)",
        flexDirection: "row",
        flexWrap: "wrap",
      }}
    >
      {stickers.map(({ Sticker, size }, index) => {
        const { width, height } = size;
        const src = rect(0, 0, width, height);
        const dst = deflate(rect(0, 0, tileWidth, tileHeight), 12);
        const transform = fitbox("contain", src, dst);
        return (
          <Pressable key={index} onPress={onPress.bind(null, Sticker, size)}>
            <Canvas style={{ width: tileWidth, height: tileHeight }}>
              <Group transform={transform}>
                <Sticker matrix={Skia.Matrix()} />
              </Group>
            </Canvas>
          </Pressable>
        );
      })}
    </View>
  );
};
