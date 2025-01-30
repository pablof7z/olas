import * as React from "react"
import Svg, {
  G,
  Path,
  Circle,
  Ellipse,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
} from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: filter */
const SvgComponent = ({ size, ...props }: { size: number }) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 300 300"
    fill="none"
    {...props}
  >
    <G clipPath="url(#a)">
      <Path fill="#000" d="M0 0h300v300H0z" />
      <G filter="url(#b)">
        <Circle
          cx={340}
          cy={127.5}
          r={112.5}
          fill="#BD1971"
          fillOpacity={0.85}
        />
      </G>
      <G filter="url(#c)">
        <Circle
          cx={102.5}
          cy={322.5}
          r={112.5}
          fill="#610AAA"
          fillOpacity={0.9}
        />
      </G>
      <G filter="url(#d)">
        <Ellipse
          cx={50}
          cy={-32.5}
          fill="#FFA02F"
          fillOpacity={0.8}
          rx={100}
          ry={87.5}
        />
      </G>
      <G filter="url(#e)">
        <Path
          fill="url(#f)"
          d="M172.777 253.551a106.4 106.4 0 0 1-22.782 2.454c-21.465 0-41.441-6.381-58.133-17.348-4.143-5.927-6.002-9.19-7.358-11.57-.672-1.179-1.22-2.141-1.863-3.104-6.323-10.169-9.631-23.231-10.353-38.579-2.234-47.554 26.666-77.921 56.19-82.906 18.715-3.16 33.588.04 44.996 6.141-10.086-2.806-22.108-2.974-35.814.949-33.224 10.709-44.3 43.272-39.553 79.333 8.285 45.184 52.588 61.379 74.67 64.63Z"
        />
        <Path
          fill="url(#g)"
          d="M78.152 227.946c-6.18-10.973-11.777-27.347-12.476-42.225-2.372-50.484 28.48-84.14 61.705-89.75 45.29-7.645 70.469 19.167 79.149 39.067a.921.921 0 0 0 .319-1.146c-14.272-31.033-43.79-52.344-77.887-52.344-38.716 0-73.263 27.772-84.962 69.048.166 30.586 13.286 58.105 34.152 77.35Z"
        />
        <Path
          fill="url(#h)"
          d="M209.621 237.658a105.616 105.616 0 0 1-24.911 12.533c-4.274-.744-9.01-1.671-12.344-2.324-1.58-.309-2.846-.557-3.598-.695-20.165-3.683-56.218-16.676-64.116-59.281-2.232-17.132-.633-32.902 5.027-45.411 5.576-12.323 15.199-21.77 29.874-26.54 17.058-4.647 31.193-2.344 41.692 3.295a38.686 38.686 0 0 0-7.99-.831c-22.718 0-41.135 19.733-41.135 44.074 0 9.719 2.936 18.704 7.911 25.991 0 0 14.239 26.897 53.001 24.493 34.562-2.144 52.511-33.146 54.65-44.597a99.895 99.895 0 0 0 1.693-18.362c0-54.885-44.493-99.378-99.378-99.378-41.531 0-77.112 25.477-91.968 61.654-5.017 6.537-9.338 13.784-12.82 21.62C52.968 82.998 96.93 44 149.998 44 208.541 44 256 91.46 256 150.003c0 36.436-18.382 68.576-46.379 87.655Z"
        />
      </G>
    </G>
    <Defs>
      <LinearGradient
        id="f"
        x1={110.193}
        x2={110.032}
        y1={131.819}
        y2={226.03}
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset={0.03} stopColor="#FA3C3C" />
        <Stop offset={1} stopColor="#BC1870" />
      </LinearGradient>
      <LinearGradient
        id="g"
        x1={95.768}
        x2={90.519}
        y1={87.083}
        y2={181.321}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#FF9F2F" />
        <Stop offset={1} stopColor="#FA3C3C" />
      </LinearGradient>
      <LinearGradient
        id="h"
        x1={169.872}
        x2={170.163}
        y1={253.798}
        y2={144.483}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#5B09AD" />
        <Stop offset={1} stopColor="#BC1870" />
      </LinearGradient>
      <ClipPath id="a">
        <Path fill="#fff" d="M0 0h300v300H0z" />
      </ClipPath>
    </Defs>
  </Svg>
)
export default SvgComponent
