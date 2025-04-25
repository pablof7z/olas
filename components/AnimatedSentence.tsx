import { memo, useMemo } from 'react';
import { type TextProps, View } from 'react-native';
import Animated, { FadeOut, runOnJS, SlideInDown } from 'react-native-reanimated';

type AnimatedSentenceProps = TextProps & {
    onExitFinish?: () => void;
    onEnterFinish?: (wordsCount: number) => void;
    stagger?: number;
};
export const AnimatedSentence = memo(
    ({ children, onExitFinish, onEnterFinish, stagger = 100, ...rest }: AnimatedSentenceProps) => {
        if (typeof children !== 'string') {
            throw new Error('AnimatedSentence only accepts string');
        }

        const words = useMemo(() => children.split(' '), [children]);
        return (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }} key={children}>
                {words.map((word, index) => (
                    <View style={{ overflow: 'hidden' }} key={`word-${index}`}>
                        <Animated.Text
                            entering={SlideInDown.springify()
                                .damping(80)
                                .stiffness(200)
                                .delay(index * 100)
                                .withInitialValues({
                                    originY: ((rest.style?.fontSize ?? 50) + 10) * 2,
                                })
                                .withCallback((finished) => {
                                    if (
                                        finished &&
                                        index === words.length - 1 &&
                                        onEnterFinish &&
                                        children !== ''
                                    ) {
                                        runOnJS(onEnterFinish)(words.length);
                                    }
                                })}
                            exiting={FadeOut.springify()
                                .damping(80)
                                .stiffness(200)
                                .withCallback((finished) => {
                                    if (
                                        finished &&
                                        index === words.length - 1 &&
                                        onExitFinish &&
                                        children !== ''
                                    ) {
                                        runOnJS(onExitFinish)();
                                    }
                                })}
                            {...rest}
                        >
                            {/* {index !== 0 && " "} */}
                            {word}
                        </Animated.Text>
                    </View>
                ))}
            </View>
        );
    }
);
