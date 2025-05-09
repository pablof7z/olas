import * as React from 'react';
import Svg, { SvgProps, G, Path } from 'react-native-svg';
const SvgComponent = ({ size = 48, color1 = '#8fbffa', color2 = '#2859c5', ...props }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" {...props}>
        <G fillRule="evenodd" clipRule="evenodd">
            <Path
                fill={color1}
                d="M5 13C5 6.373 10.372 1 17 1c6.627 0 12 5.373 12 12 0 3.944-1.903 7.443-4.839 9.63a16.241 16.241 0 0 1 4.202 2.927 9.384 9.384 0 0 0-.155 1.356l-.083 1.982c-2.076 1.323-3.39 3.585-3.532 6.177-.054.983-.09 2.223-.093 3.786-1.976.087-4.435.142-7.496.142-6.66 0-10.471-.26-12.652-.54-1.114-.143-2.059-.679-2.664-1.52-.605-.84-.813-1.905-.604-3.004.95-4.982 4.27-9.133 8.758-11.304A11.983 11.983 0 0 1 5 13Z"
            />
            <Path
                fill={color1}
                fillRule="evenodd"
                d="M37.5 21a6.3 6.3 0 0 0-6.295 6.038l-.159 3.81c-1.99.545-3.339 2.234-3.457 4.388A69.196 69.196 0 0 0 27.5 39c0 1.736.05 3.048.121 4.034.168 2.347 1.867 4.063 4.205 4.267 1.274.111 3.095.199 5.674.199s4.4-.088 5.674-.199c2.338-.204 4.037-1.92 4.205-4.267.07-.986.121-2.298.121-4.034s-.05-3.048-.121-4.034c-.149-2.077-1.497-3.661-3.426-4.139l-.158-3.789A6.3 6.3 0 0 0 37.5 21Zm2.437 9.53-.139-3.325a2.3 2.3 0 0 0-4.596 0l-.139 3.324c.727-.018 1.536-.029 2.437-.029.902 0 1.711.01 2.437.03Z"
                clipRule="evenodd"
            />
            <Path
                fill={color1}
                fillRule="evenodd"
                d="M37.5 36a2 2 0 0 1 2 2v2a2 2 0 1 1-4 0v-2a2 2 0 0 1 2-2Z"
                clipRule="evenodd"
            />
        </G>
    </Svg>
);
export default SvgComponent;
