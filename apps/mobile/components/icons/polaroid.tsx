import * as React from 'react';
import Svg, { G, Path, SvgProps } from 'react-native-svg';
const SvgComponent = ({ size = 48, ...props }: SvgProps) => (
    <Svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 48 48" fill="none" {...props}>
        <G strokeLinecap="round" strokeWidth={3}>
            <Path
                strokeLinejoin="round"
                d="M3.539 39.743c.208 2.555 2.163 4.51 4.718 4.718C11.485 44.723 16.636 45 24 45c7.364 0 12.515-.277 15.743-.539 2.555-.208 4.51-2.163 4.718-4.718C44.723 36.515 45 31.364 45 24c0-7.364-.277-12.515-.539-15.743-.208-2.555-2.163-4.51-4.718-4.718C36.515 3.277 31.364 3 24 3c-7.364 0-12.515.277-15.743.539-2.555.208-4.51 2.163-4.718 4.718C3.277 11.485 3 16.636 3 24c0 7.364.277 12.515.539 15.743Z"
            />
            <Path
                strokeLinejoin="round"
                d="M3.043 28.95c4.909-4.656 8.227-7.127 10.221-8.41 1.452-.933 3.212-.771 4.554.315 1.687 1.364 4.474 3.787 8.77 7.96 2.992-2.612 5.167-4.192 6.63-5.132 1.451-.934 3.211-.771 4.553.314 1.465 1.185 3.76 3.168 7.152 6.403M39 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
            />
            <Path d="M3.5 36h41" />
        </G>
    </Svg>
);
export default SvgComponent;
