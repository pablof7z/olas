import * as React from 'react';
import Svg, { type SvgProps, Path } from 'react-native-svg';
/* SVGR has dropped some elements not supported by react-native-svg: title */
const SvgComponent = ({ size = 24, strokeWidth = 2, ...props }: SvgProps) => (
    <Svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        aria-label="Reels"
        className="x1lliihq x1n2onr6 x5n08af"
        {...props}
    >
        <Path fill="none" strokeLinejoin="round" strokeWidth={strokeWidth} d="M2.049 7.002H21.95" />
        <Path
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
            d="m13.504 2.001 2.858 5.001M7.207 2.11l2.795 4.892M2 12.001v3.449c0 2.849.698 4.006 1.606 4.945.94.908 2.098 1.607 4.946 1.607h6.896c2.848 0 4.006-.699 4.946-1.607.908-.939 1.606-2.096 1.606-4.945V8.552c0-2.848-.698-4.006-1.606-4.945C19.454 2.699 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.546 2 5.704 2 8.552Z"
        />
        <Path
            fillRule="evenodd"
            d="M9.763 17.664a.908.908 0 0 1-.454-.787V11.63a.909.909 0 0 1 1.364-.788l4.545 2.624a.909.909 0 0 1 0 1.575l-4.545 2.624a.91.91 0 0 1-.91 0Z"
        />
    </Svg>
);
export default SvgComponent;
