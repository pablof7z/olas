import * as React from "react";
import Svg, { SvgProps, G, Path } from "react-native-svg";

interface CustomSvgProps extends SvgProps {
  size?: number;
}

const SvgComponent = ({ size = 48, ...props }: CustomSvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    {...props}
  >
    <G strokeWidth={3}>
      <Path d="M5.48 15.289c.183-2.278 1.948-3.924 4.226-4.103 2.529-.2 6.188-.405 10.517-.405 4.33 0 7.989.206 10.518.405 2.277.18 4.042 1.825 4.225 4.103.19 2.366.364 6.076.364 11.715v14.617a3.152 3.152 0 0 1-5.033 2.53l-7.824-5.803a3.777 3.777 0 0 0-4.5 0l-7.824 5.804a3.154 3.154 0 0 1-5.033-2.531V27.004c0-5.639.175-9.349.365-11.716Z" />
      <Path
        strokeLinecap="round"
        d="M13.5 6.06c.697-1.377 2.09-2.296 3.76-2.428a135.55 135.55 0 0 1 10.517-.404c4.33 0 7.989.205 10.517.404 2.278.18 4.043 1.826 4.225 4.103.19 2.367.365 6.076.365 11.716v14.616a3.152 3.152 0 0 1-2.833 3.136"
      />
    </G>
  </Svg>
);

export default SvgComponent;
