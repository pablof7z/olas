/*
    Inspiration: https://dribbble.com/shots/15066078-Add-button
*/
import { Feather } from '@expo/vector-icons';
import { AnimatePresence, MotiView } from 'moti';
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '../useColorScheme';

const Button = ({ icon = 'plus', onPress }) => {
    return (
        <TouchableOpacity onPress={onPress}>
            <MotiView
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                <Feather name={icon} size={32} color="black" />
            </MotiView>
        </TouchableOpacity>
    );
};

export default function MoreButton() {
    const [active, setActive] = useState(false);
    const { colors } = useColorScheme();
    return (
        <View
            style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.background,
            }}>
            <View style={{ alignItems: 'center' }}>
                <AnimatePresence>
                    {!!active && (
                        <MotiView
                            from={{ opacity: 0, translateY: 0, paddingBottom: 0 }}
                            animate={{ opacity: 1, translateY: 0, paddingBottom: 50 }}
                            exit={{ opacity: 0, translateY: 10, paddingBottom: 0 }}
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: 25,
                                width: 52,
                                alignItems: 'center',
                                paddingBottom: 50,
                                position: 'absolute',
                                bottom: 0,
                            }}>
                            <Button icon="bell" onPress={() => setActive(false)} />
                            <Button icon="bluetooth" onPress={() => setActive(false)} />
                            <Button icon="cast" onPress={() => setActive(false)} />
                            <Button icon="coffee" onPress={() => setActive(false)} />
                        </MotiView>
                    )}
                </AnimatePresence>
                <TouchableOpacity onPress={() => setActive((active) => !active)} activeOpacity={1}>
                    <MotiView
                        animate={{
                            backgroundColor: !active ? colors.muted : colors.foreground,
                            rotate: active ? '-45deg' : '0deg',
                        }}
                        style={{
                            width: 50,
                            height: 50,
                            borderRadius: 50,
                            backgroundColor: colors.background,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <Feather name="plus" size={24} color={colors.background} />
                    </MotiView>
                </TouchableOpacity>
            </View>
        </View>
    );
}
