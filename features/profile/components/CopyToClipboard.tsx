import { useColorScheme } from '@/lib/useColorScheme';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy } from 'lucide-react-native';
import type React from 'react';
import { useCallback, useState } from 'react';
import { Pressable } from 'react-native';

type CopyToClipboardProps = {
    text: string;
    size?: number;
};

const CopyToClipboard: React.FC<CopyToClipboardProps> = ({ text, size = 16 }) => {
    const { colors } = useColorScheme();
    const [copied, setCopied] = useState(false);

    const copy = useCallback(() => {
        Clipboard.setStringAsync(text);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    }, [text]);

    return (
        <Pressable onPress={copy} style={{ marginLeft: 4 }} testID="copy-pressable">
            {copied ? (
                <Check size={size} color={colors.muted} testID="check-icon" />
            ) : (
                <Copy size={size} color={colors.muted} testID="copy-icon" />
            )}
        </Pressable>
    );
};

export default CopyToClipboard;
