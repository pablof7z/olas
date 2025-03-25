import React, { useCallback } from 'react';
import { 
    StyleSheet, 
    FlatList, 
    View, 
    Text, 
    TouchableOpacity, 
    Dimensions 
} from 'react-native';
import { FilterPreset, FILTER_PRESETS } from '../presets';
import { FilteredImage } from './FilteredImage';
import { useImage } from '@shopify/react-native-skia';

interface FilterListProps {
    selectedFilterId: string;
    onSelectFilter: (filterId: string) => void;
    previewImageUri?: string;
}

export function FilterList({ 
    selectedFilterId, 
    onSelectFilter,
    previewImageUri
}: FilterListProps) {
    const image = useImage(previewImageUri || '');
    
    const renderItem = useCallback(({ item }: { item: FilterPreset }) => {
        const isSelected = item.id === selectedFilterId;
        
        const handlePress = () => {
            onSelectFilter(item.id);
        };
        
        return (
            <TouchableOpacity 
                style={[
                    styles.filterItem,
                    isSelected && styles.selectedFilterItem
                ]} 
                onPress={handlePress}
            >
                <View style={styles.filterPreview}>
                    {image ? (
                        <FilteredImage
                            image={image}
                            filterParams={item.parameters}
                            style={styles.filterPreviewImage}
                            contentFit="cover"
                            width={FILTER_ITEM_WIDTH}
                            height={FILTER_ITEM_WIDTH}
                            filePath={previewImageUri}
                        />
                    ) : (
                        <View 
                            style={[
                                styles.filterPreviewPlaceholder,
                                { backgroundColor: item.thumbnailColor || '#333' }
                            ]} 
                        />
                    )}
                </View>
                <Text style={[
                    styles.filterName,
                    isSelected && styles.selectedFilterName,
                ]}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    }, [selectedFilterId, onSelectFilter, image, previewImageUri]);

    if (!image) return null;
    
    return (
        <View style={styles.container}>
            <FlatList
                data={FILTER_PRESETS}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const { width } = Dimensions.get('window');
const FILTER_ITEM_WIDTH = width / 4.5;

const styles = StyleSheet.create({
    container: {
        height: 130,
    },
    listContent: {
        paddingHorizontal: 10,
    },
    filterItem: {
        width: FILTER_ITEM_WIDTH,
        alignItems: 'center',
        marginHorizontal: 6,
        marginVertical: 10,
    },
    selectedFilterItem: {
        // Add selected styles
    },
    filterPreview: {
        width: FILTER_ITEM_WIDTH,
        height: FILTER_ITEM_WIDTH,
        borderRadius: 8,
        overflow: 'hidden',
    },
    filterPreviewImage: {
        width: '100%',
        height: '100%',
    },
    filterPreviewPlaceholder: {
        width: '100%',
        height: '100%',
    },
    filterName: {
        marginTop: 5,
        fontSize: 11,
        color: '#999',
        textAlign: 'center',
    },
    selectedFilterName: {
        color: '#fff',
        fontWeight: 'bold',
    },
}); 