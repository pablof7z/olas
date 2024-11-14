import { NDKArticle, NDKList, NDKSimpleGroupMetadata } from '@nostr-dev-kit/ndk';
import ThreadItem, { type Thread } from './thread';
import GroupItem from './group';
import ListItem from './list';
import { ListRenderItemInfo } from '@/components/nativewindui/List';
import { Article } from './article';

export type ListItem = Thread | NDKSimpleGroupMetadata;

export {
    ThreadItem,
    GroupItem,
    ListItem,
}

interface RenderItemProps {
    onThreadPress?: (thread: Thread) => void,
    onArticlePress?: (article: NDKArticle) => void,
    onGroupPress?: (group: NDKSimpleGroupMetadata) => void,
    onListPress?: (list: NDKList) => void,
}

export function renderItem({
    onThreadPress, onArticlePress, onGroupPress, onListPress
}: RenderItemProps) {
    return (info: ListRenderItemInfo<ListItem>) => {
        const { item } = info;
        
        if (item instanceof NDKSimpleGroupMetadata) {
            return (
                <GroupItem {...info} groupMetadata={item} onPress={() => onGroupPress?.(item)} />
            );
        }

        if (item instanceof NDKList) {
            return (
                <ListItem {...info} list={item} onPress={() => onListPress?.(item)} />
            );
        }

        if (item instanceof NDKArticle) {
            return (
                <Article {...info} article={item} onPress={() => onArticlePress?.(item)} />
            )
        }

        return (
            <ThreadItem {...info} thread={item} onPress={() => onThreadPress?.(item)} />
        );
    };
    
//     return useCallback((info: ListRenderItemInfo<ListItem>) => {
//         console.log('render item', info);
        
//         if (item instanceof NDKSimpleGroupMetadata) {
//             return <GroupItem groupMetadata={item} />;
//         }

//         return <ThreadItem thread={item} onPress={() => onThreadPress(item)} />;
//     }, [onThreadPress]);
// }
}
