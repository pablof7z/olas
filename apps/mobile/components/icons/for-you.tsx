import Svg, { SvgProps, Path } from "react-native-svg"
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
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      d="M2.996 15.619C6.146 8.286 12.446 2 23.063 2c13.766 0 21.933 11.294 21.933 22.823 0 11.53-9.8 21.177-21 21.177s-21-9.176-21-20c0-10.118 7.467-16.667 17.033-16.667 9.567 0 14.7 8.902 14.7 15.49 0 6.589-4.96 12.236-10.733 12.236-5.133 0-8.867-3.765-8.867-8.47s3.5-8.471 7.934-8.471c4.433 0 7.466 3.294 7.466 6.588m0 0c0 3.294-1.166 4.706-1.866 5.647m1.866-5.647c0-4.47-4.433-8.706-10.5-8.706-6.066 0-11.666 4.47-11.666 12 0 8.904 6.533 16 15.4 16"
    />
  </Svg>
)
export default SvgComponent
