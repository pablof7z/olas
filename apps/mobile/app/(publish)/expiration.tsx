import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Button, View } from 'react-native';
import { Button as ButtonComponent } from '@/components/nativewindui/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '@/components/nativewindui/Text';
import { useAtom } from 'jotai';
import { metadataAtom } from '@/components/NewPost/store';

export default function Caption() {
    const [metadata, setMetadata] = useAtom(metadataAtom);
    const [date, setDate] = useState(new Date(metadata?.expiration ?? new Date().getTime() + 1000 * 60 * 60 * 24));

    const setExpiration = (expiration?: number) => {
        setMetadata({ ...metadata, expiration });
    };

    const onChange = (event, selectedDate) => {
        // if it's in the past, set it to now
        const currentDate = selectedDate;
        console.log('selectedDate', selectedDate);
        setDate(currentDate);
        setExpiration(currentDate.getTime());
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Expiration',
                    headerRight: () => (
                        <Button
                            title="OK"
                            onPress={() => {
                                setExpiration(date.getTime());
                                router.back();
                            }}
                        />
                    ),
                }}
            />
            <View className="w-full flex-col items-center justify-between gap-10 p-4">
                <Text className="text-sm">
                    You can set an expiration date for your post; relays will be instructed to delete the post after this date.
                </Text>

                <DateTimePicker testID="dateTimePicker" value={date} mode={'date'} onChange={onChange} />

                <ButtonComponent
                    variant="tonal"
                    onPress={() => {
                        setExpiration(0);
                        router.back();
                    }}>
                    <Text>Remove expiration</Text>
                </ButtonComponent>
            </View>
        </>
    );
}
