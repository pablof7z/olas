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
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 48 48" id="Flash-1--Streamline-Plump"><desc>Flash 1 Streamline Icon: https://streamlinehq.com</desc><g id="Line/Image Photography/Flash/flash-1--flash-power-connect-charge-electricity-lightning"><path id="Union" stroke="#000000" stroke-linejoin="round" d="M34.0714 5.67931c0.3241 -1.71657 -0.9401 -3.32107 -2.7354 -3.42226 -3.9131 -0.22056 -10.72 -0.45648 -17.3851 0.02165 -1.4939 0.10716 -2.787 1.04127 -3.3259 2.39752C7.27443 13.1087 5.69576 20.9015 5.0362 24.9494c-0.26232 1.6099 0.9309 3.0435 2.60651 3.1562 2.61779 0.1761 6.73269 0.3655 11.51319 0.2721 -0.4976 3.4077 -1.0314 8.6827 -1.563 14.4657 -0.2502 2.723 3.0462 4.2354 4.9831 2.2503 8.2038 -8.4075 15.7594 -17.861 19.8234 -23.1443 1.4107 -1.8339 0.1934 -4.343 -2.1639 -4.4056 -2.2292 -0.0593 -5.1429 -0.0891 -8.7027 -0.0275 0.9428 -3.6351 1.778 -7.80888 2.5386 -11.83699Z" stroke-width="3"></path></g></svg>