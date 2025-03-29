# Metadata Component Pattern Guide

This document outlines the pattern used for implementing metadata components in the composer. Each metadata component follows a two-file structure with shared styling.

## File Structure

1. Main Component File (e.g., `visibility.tsx`, `expiration.tsx`, `location.tsx`)
2. Bottom Sheet Component File (e.g., `VisibilityBottomSheet.tsx`, `ExpirationBottomSheet.tsx`, `LocationBottomSheet.tsx`)
3. Shared Styles (`style.ts`)

## Styling

All components should import styles from `style.ts`, which provides:

```typescript
import { styles, valueSheetStyles, infoSheetStyles, iconSize } from './style';
```

- `styles`: Base component styles (container, row layouts, text styles)
- `valueSheetStyles`: Bottom sheet specific styles
- `infoSheetStyles`: Information/explanation sheet styles
- `iconSize`: Standard icon size constant

## Main Component Pattern

1. **File Naming**: Use PascalCase for the component name (e.g., `Visibility.tsx`)

2. **Basic Structure**:
```typescript
export default function ComponentName() {
    const { colors } = useColorScheme();
    const bottomSheetRef = useRef<ComponentBottomSheetRef>(null);
    
    // State from store or atoms
    const value = useAtomValue(componentValueAtom);
    
    const handlePress = () => {
        bottomSheetRef.current?.present();
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.rowContainer} onPress={handlePress}>
                <Icon size={iconSize} color={colors.primary} />
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.foreground }]}>Title</Text>
                    <Text style={[styles.subtitle, { color: colors.muted }]}>Description</Text>
                </View>
                <Value />
            </TouchableOpacity>

            <ComponentBottomSheet ref={bottomSheetRef} />
        </View>
    );
}
```

## Bottom Sheet Pattern

1. **File Naming**: PascalCase with "BottomSheet" suffix (e.g., `VisibilityBottomSheet.tsx`)

2. **Required Exports**:
```typescript
// Types
export interface ComponentBottomSheetRef {
    present: () => void;
    dismiss: () => void;
}

// State atoms
export const componentValueAtom = atom<ValueType>(defaultValue);
export const componentBottomSheetRefAtom = atom<RefObject<BottomSheetModal> | null>(null);
```

3. **Component Structure**:
```typescript
const ComponentBottomSheet = forwardRef<ComponentBottomSheetRef, ComponentBottomSheetProps>(
    ({ initialValue, onValueChange }, ref) => {
        const sheetRef = useSheetRef();
        const setBottomSheetRef = useSetAtom(componentBottomSheetRefAtom);
        const [currentValue, setCurrentValue] = useAtom(componentValueAtom);

        useImperativeHandle(ref, () => ({
            present: () => sheetRef.current?.present(),
            dismiss: () => sheetRef.current?.dismiss(),
        }), [sheetRef]);

        useEffect(() => {
            setBottomSheetRef(sheetRef);
            return () => setBottomSheetRef(null);
        }, [setBottomSheetRef]);

        return (
            <Sheet ref={sheetRef} maxDynamicContentSize={MAX_HEIGHT} enablePanDownToClose>
                <BottomSheetView style={valueSheetStyles.container}>
                    <ComponentContent />
                </BottomSheetView>
            </Sheet>
        );
    }
);
```

## State Management

1. Use Jotai atoms for shared state:
```typescript
export const componentValueAtom = atom<ValueType>(defaultValue);
```

2. Use `useEditorStore` for editor-specific state:
```typescript
const value = useEditorStore((state) => state.value);
const setValue = useEditorStore((state) => state.setValue);
```

## Best Practices

1. **Refs**: Always use `useRef` with proper typing for bottom sheet references
2. **Colors**: Use `useColorScheme()` for consistent theming
3. **Styles**: Leverage shared styles from `style.ts`
4. **State**: Prefer atoms for simple state, editor store for complex state
5. **Props**: Include `initialValue` and `onValueChange` in bottom sheets when needed
6. **Types**: Export interfaces for refs and props
7. **Icons**: Use consistent icon size from `style.ts`

## Example Implementation Order

1. Define types and interfaces
2. Create state atoms
3. Implement bottom sheet component
4. Implement main component
5. Add to the composer's metadata section