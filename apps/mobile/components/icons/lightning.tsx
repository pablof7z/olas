import * as React from "react"
import Svg, { Path } from "react-native-svg"
const SvgComponent = ({ fill = 'none', size = 24, strokeWidth = 1.5, ...props }) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    {...props}
    >
    <Path
        fill={fill}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M17.848 11.306a1.023 1.023 0 0 0-.871-1.559H13.5v-9L6.152 12.689a1.022 1.022 0 0 0 .871 1.558H10.5v9Z"
    />
  </Svg>
)
export default SvgComponent
