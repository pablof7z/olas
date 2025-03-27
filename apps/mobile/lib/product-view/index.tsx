import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import type NDK from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, type NostrEvent } from '@nostr-dev-kit/ndk-mobile';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { atom, useAtom } from 'jotai';
import { Scroll } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Linking,
    SafeAreaView,
    TextInput,
    View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import EventMediaContainer from '@/components/media/event';
import MultiStepButton from '@/components/multistep-button';
import { SegmentedControl } from '@/components/nativewindui/SegmentedControl';
import EventContent from '@/components/ui/event/content';
import { formatMoney } from '@/utils/bitcoin';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';

const sizeAtom = atom<string | undefined, [string], void>(undefined, (_get, set, size) => {
    set(sizeAtom, size);
});

const steps = new Map([
    [0, 'Buy'],
    [1, 'Shipping'],
    [2, 'Payment'],
    [3, 'Confirmation'],
]);

const shippingInformationAtom = atom<{
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}>({});

function ShippingInformationStep() {
    const [shippingInformation, setShippingInformation] = useAtom(shippingInformationAtom);

    return (
        <View style={{ gap: 10, flex: 1, padding: 10 }}>
            <Text>Shipping Information</Text>

            <BottomSheetTextInput
                value={shippingInformation.name}
                onChangeText={(text) =>
                    setShippingInformation({ ...shippingInformation, name: text })
                }
                style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 10, padding: 10 }}
                placeholder="Name"
            />

            <BottomSheetTextInput
                value={shippingInformation.address}
                onChangeText={(text) =>
                    setShippingInformation({ ...shippingInformation, address: text })
                }
                style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 10, padding: 10 }}
                placeholder="Address"
            />

            <BottomSheetTextInput
                value={shippingInformation.city}
                onChangeText={(text) =>
                    setShippingInformation({ ...shippingInformation, city: text })
                }
                style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 10, padding: 10 }}
                placeholder="City"
            />

            <BottomSheetTextInput
                value={shippingInformation.state}
                onChangeText={(text) =>
                    setShippingInformation({ ...shippingInformation, state: text })
                }
                style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 10, padding: 10 }}
                placeholder="State"
            />

            <BottomSheetTextInput
                value={shippingInformation.zip}
                onChangeText={(text) =>
                    setShippingInformation({ ...shippingInformation, zip: text })
                }
                style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 10, padding: 10 }}
                placeholder="Zip"
            />

            <BottomSheetTextInput
                value={shippingInformation.country}
                onChangeText={(text) =>
                    setShippingInformation({ ...shippingInformation, country: text })
                }
                style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 10, padding: 10 }}
                placeholder="Country"
            />
        </View>
    );
}

export default function ProductView({ event }: { event: NDKEvent }) {
    const product = NDKClassifiedListing.from(event);

    // hodlbod is an attack on nostr
    const summary = product.summary.replace(/ npub1/, ' nostr:npub1');

    const [step, setStep] = useState(0);

    return (
        <Animated.View style={{ flex: 1, paddingBottom: 20, gap: 10, width: '100%' }}>
            <Text variant="title1">{product.title}</Text>

            <Text variant="body" style={{ fontWeight: '800', color: 'green' }}>
                {formatMoney({ amount: product.price?.amount, unit: product.price?.currency })}
            </Text>

            <ScrollView>
                {step === 0 && (
                    <>
                        <FlatList
                            horizontal
                            data={product.images}
                            style={{ marginBottom: 10 }}
                            renderItem={({ item }) => (
                                <Image
                                    source={{ uri: item }}
                                    style={{
                                        width: Dimensions.get('window').width - 20,
                                        height: 400,
                                        borderRadius: 16,
                                    }}
                                />
                            )}
                        />

                        <EventContent event={event} content={summary} />

                        <SizeSelector sizes={product.sizes} />
                    </>
                )}

                {step === 1 && <ShippingInformationStep />}
            </ScrollView>

            <MultiStepButton
                data={Array.from(steps.keys())}
                labels={Array.from(steps.values())}
                selectedIndex={step}
                onChange={(index) => {
                    setStep(index);
                }}
            />
        </Animated.View>
    );
}

function SizeSelector({ sizes }: { sizes: string[] | undefined }) {
    const [size, setSize] = useAtom(sizeAtom);

    if (!sizes || sizes.length === 0) return null;

    return (
        <View>
            <SegmentedControl
                values={sizes}
                selectedIndex={size ? sizes.indexOf(size) : undefined}
                onValueChange={(value) => {
                    setSize(value);
                }}
            />
        </View>
    );
}

export class NDKClassifiedListing extends NDKEvent {
    static kind = 30402;
    static kinds = [30402, 30403];

    constructor(ndk: NDK | undefined, rawEvent?: NostrEvent | NDKEvent) {
        super(ndk, rawEvent);
        this.kind ??= NDKClassifiedListing.kind;
    }

    static from(event: NDKEvent) {
        return new NDKClassifiedListing(event.ndk, event);
    }

    get title(): string | undefined {
        return this.tagValue('title');
    }

    set title(title: string | undefined) {
        this.removeTag('title');
        if (title) this.tags.push(['title', title]);
    }

    get sizes(): string[] | undefined {
        return this.getMatchingTags('size').map((t) => t[1]);
    }

    set sizes(sizes: string[] | undefined) {
        this.tags = this.tags.filter((t) => t[0] !== 'size');
        if (sizes) this.tags.push(...sizes.map((s) => ['size', s]));
    }
    get summary(): string | undefined {
        return this.tagValue('summary');
    }

    set summary(summary: string | undefined) {
        this.removeTag('summary');
        if (summary) this.tags.push(['summary', summary]);
    }

    get published_at(): number | undefined {
        const tag = this.tagValue('published_at');
        return tag ? Number.parseInt(tag) : undefined;
    }

    set published_at(timestamp: number | undefined) {
        this.removeTag('published_at');
        if (timestamp !== undefined) {
            this.tags.push(['published_at', timestamp.toString()]);
        }
    }

    get location(): string | undefined {
        return this.tagValue('location');
    }

    set location(location: string | undefined) {
        this.removeTag('location');
        if (location) this.tags.push(['location', location]);
    }

    get price(): { amount: number; currency: string; frequency?: string } | undefined {
        const priceTag = this.tags.find((t) => t[0] === 'price');
        if (!priceTag) return undefined;

        return {
            amount: Number.parseInt(priceTag[1]),
            currency: priceTag[2],
            frequency: priceTag[3],
        };
    }

    get images(): string[] | undefined {
        return this.getMatchingTags('image').map((t) => t[1]);
    }

    set images(images: string[] | undefined) {
        this.tags = this.tags.filter((t) => t[0] !== 'image');
        if (images) this.tags.push(...images.map((i) => ['image', i]));
    }

    set price(price: { amount: string; currency: string; frequency?: string } | undefined) {
        this.removeTag('price');
        if (price) {
            const tag = ['price', price.amount, price.currency];
            if (price.frequency) tag.push(price.frequency);
            this.tags.push(tag);
        }
    }

    get status(): 'active' | 'sold' | undefined {
        return this.tagValue('status') as 'active' | 'sold' | undefined;
    }

    set status(status: 'active' | 'sold' | undefined) {
        this.removeTag('status');
        if (status) this.tags.push(['status', status]);
    }
}
