import * as React from "react"
import Svg, { SvgProps, Path, G } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: title */
const SvgComponent = ({ size = 24, strokeWidth = 2, ...props }: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    stroke="currentColor"
    className="x1lliihq x1n2onr6 x5n08af"
    {...props}
  >
    <G strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10.127 9.666a3.222 3.222 0 0 0-6.254 0" />
      <Path d="M7 7.22c1.225 0 1.915-.69 1.915-1.916C8.915 4.08 8.225 3.39 7 3.39c-1.226 0-1.916.69-1.916 1.915 0 1.226.69 1.916 1.916 1.916Z" />
      <Path d="M1.762 11.312C2.854 12.74 4.632 13.5 7 13.5c4.16 0 6.5-2.351 6.5-6.53 0-3.643-1.777-5.897-4.988-6.416M1.779 2.605C1.327 3.188.99 3.883.777 4.684M3.716 1.08C4.35.788 5.076.593 5.883.5M.5 6.97c0 .768.079 1.474.234 2.115" />
    </G>
  </Svg>
)
export default SvgComponent
