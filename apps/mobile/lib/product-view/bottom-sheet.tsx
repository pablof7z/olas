import { type BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { Dimensions } from 'react-native';

import ProductView from './index';
import { productEventAtom, productViewSheetRefAtom } from './store';

import { Sheet } from '@/components/nativewindui/Sheet';

export function ProductViewBottomSheet() {
    const productEvent = useAtomValue(productEventAtom);
    const sheetRef = useRef<BottomSheetModal>(null);
    const setSheetRef = useSetAtom(productViewSheetRefAtom);

    useEffect(() => {
        setSheetRef(sheetRef);
    }, []);

    return (
        <Sheet ref={sheetRef}>
            <BottomSheetView
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 10,
                    height: Dimensions.get('window').height * 0.9,
                }}
            >
                {productEvent && <ProductView event={productEvent} />}
            </BottomSheetView>
        </Sheet>
    );
}
