import * as React from "react"
import Svg, { Path } from "react-native-svg"
const SvgComponent = ({ size = 48, ...props }) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    {...props}
  >
    <Path
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M18 2.873a9.539 9.539 0 0 0-12 0M8.5 6.488a5.566 5.566 0 0 1 7 0M.75 13.875a2.625 2.625 0 1 0 5.25 0 2.625 2.625 0 1 0-5.25 0ZM7.514 19.983A4.5 4.5 0 0 0 .75 18.1M18 13.875a2.625 2.625 0 1 0 5.25 0 2.625 2.625 0 1 0-5.25 0ZM16.486 19.983A4.5 4.5 0 0 1 23.25 18.1M8.625 13.125a3.375 3.375 0 1 0 6.75 0 3.375 3.375 0 1 0-6.75 0Z"
    />
    <Path
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M18 23.25a6.054 6.054 0 0 0-12 0"
    />
  </Svg>
)
export default SvgComponent
