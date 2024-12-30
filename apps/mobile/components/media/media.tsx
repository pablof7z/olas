import { urlIsVideo } from "@/utils/media";
import ImageComponent from "./image";
import VideoComponent from "./video";
import { StyleProp, ViewStyle } from "react-native";

export default function MediaComponent({
    url,
    type,
    className,
    maxWidth,
    maxHeight,
    onPress,
    style,
    ...props
}: { url: string, blurhash?: string, type?: 'image' | 'video', maxWidth?: number, maxHeight?: number, onPress?: () => void, className?: string, style?: StyleProp<ViewStyle> }) {
    if (type === 'video' || urlIsVideo(url)) {
        return <VideoComponent url={url} maxWidth={maxWidth} maxHeight={maxHeight} onPress={onPress} className={className} style={style} {...props} />
    }

    return <ImageComponent url={url} maxWidth={maxWidth} maxHeight={maxHeight} onPress={onPress} className={className} style={style} {...props} />
}