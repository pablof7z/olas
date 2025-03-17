import Svg, { SvgProps, Path } from 'react-native-svg';
const SvgComponent = ({ size = 48, ...props }) => (
    <Svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 48 48" fill="none" {...props}>
        <Path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M41.004 35.922c1.97-.05 3.242-.151 4.06-.256.932-.12 1.473-.874 1.297-1.797-.541-2.84-2.619-5.152-5.357-6.078a5.912 5.912 0 0 0-4.014-11.033M6.996 35.922c-1.97-.05-3.242-.151-4.06-.256-.932-.12-1.473-.874-1.297-1.797.541-2.84 2.619-5.152 5.357-6.078a5.912 5.912 0 0 1 4.015-11.033M28.065 26.3a8.995 8.995 0 1 0-8.133.001c-4.165 1.412-7.324 4.928-8.147 9.248-.268 1.405.555 2.553 1.973 2.735 1.735.222 4.813.435 10.242.435 5.429 0 8.507-.213 10.241-.435 1.419-.182 2.241-1.33 1.974-2.735-.824-4.321-3.984-7.838-8.15-9.248Z"
        />
    </Svg>
);
export default SvgComponent;
