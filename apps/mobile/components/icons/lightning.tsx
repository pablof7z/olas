import React from "react";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface LightningProps {
    fill?: string;
    size?: number;
    strokeWidth?: number;
    animatedSize?: Animated.SharedValue<number>;
    [x: string]: any;
}

const Lightning = ({
    fill = "none",
    size = 24,
    strokeWidth = 1.5,
    animatedSize,
    ...props
}: LightningProps) => {
    const animatedProps = useAnimatedProps(() => {
        const aSize = animatedSize?.value;
        return {
            width: aSize ?? size,
            height: aSize ?? size,
        };
    });
    return (
        <AnimatedSvg
            xmlns="http://www.w3.org/2000/svg"
            animatedProps={animatedProps}
            viewBox="0 0 24 24"
            preserveAspectRatio="xMidYMid meet"
            {...props}
        >
            <Path
                fill={fill}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
                d="M17.848 11.306a1.023 1.023 0 0 0-.871-1.559H13.5v-9L6.152 12.689a1.022 1.022 0 0 0 .871 1.558H10.5v9Z"
            />
        </AnimatedSvg>
    );
};

export default Lightning;