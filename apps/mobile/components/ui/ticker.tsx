import { useColorScheme } from '@/lib/useColorScheme';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Text, TextProps, TextStyle, View } from 'react-native';

const numbersToNine = [...Array(10).keys()]; // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

type TickerListProps = {
    number: number;
    fontSize: number;
    index: number;
    staggerDuration: number;
    style?: TextStyle;
};

type TickerProps = {
    value: number | string;
    fontSize?: number;
    staggerDuration?: number;
    style?: TextStyle;
};

function Tick({ children, fontSize, style, ...rest }: TextProps & { fontSize: number }) {
    const { colors } = useColorScheme();
    return (
        <Text
            {...rest}
            style={[
                style,
                {
                    fontSize: fontSize,
                    lineHeight: fontSize * 1.1,
                    fontWeight: '900',
                    height: fontSize,
                    color: colors.foreground,
                    fontVariant: ['tabular-nums'],
                },
            ]}>
            {children}
        </Text>
    );
}

function TickerList({ number, fontSize, index, staggerDuration, style }: TickerListProps) {
    return (
        <View
            style={{
                height: fontSize,
                overflow: 'hidden',
            }}>
            <MotiView
                animate={{
                    translateY: -fontSize * number,
                }}
                transition={{
                    delay: index * staggerDuration,
                    damping: 80,
                    stiffness: 200,
                }}>
                {numbersToNine.map((num, index) => {
                    return (
                        <Tick key={`number-${num}-${index}`} fontSize={fontSize} style={style}>
                            {num}
                        </Tick>
                    );
                })}
            </MotiView>
        </View>
    );
}

export default function Ticker({ value = 12325, fontSize = 50, staggerDuration = 50, style }: TickerProps) {
    const splitValue = String(value).split('');
    const [newFontSize, setNewFontSize] = useState(fontSize);
    return (
        <View className="relative flex-1">
            <Tick
                fontSize={fontSize}
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                    style,
                    {
                        position: 'absolute',
                        left: 1000000,
                        top: 1000000,
                    },
                ]}
                onTextLayout={(e) => {
                    const newFontSize = Math.floor(e.nativeEvent.lines[0].ascender - e.nativeEvent.lines[0].descender);
                    if (newFontSize === fontSize) return;
                    setNewFontSize(newFontSize);
                }}>
                {value}
            </Tick>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {splitValue.map((number, index) => {
                    if (!isNaN(parseInt(number))) {
                        return (
                            <TickerList
                                fontSize={newFontSize}
                                number={parseInt(number)}
                                index={index}
                                staggerDuration={staggerDuration}
                                style={style}
                                key={index}
                            />
                        );
                    }
                    return (
                        <Tick key={index} fontSize={newFontSize} style={[style, { opacity: 0.2 }]}>
                            {number}
                        </Tick>
                    );
                })}
            </View>
        </View>
    );
}
