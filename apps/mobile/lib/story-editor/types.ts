// Because the NDKStoryStickerType is imported from ndk-mobile but we need to extend it,
// we'll define our own version here that includes all the original types plus our new ones

export enum NDKStoryStickerType {
    Text = 'text',
    Pubkey = 'pubkey',
    Event = 'nostrEvent',
    Countdown = 'countdown',
    NostrFilter = 'nostrFilter',
    Prompt = 'prompt',
    Mention = 'mention'
} 

// Interface for sticker styles
export interface StickerStyle {
    id: string;
    name: string;
    backgroundColor?: string;
    backgroundOpacity?: number;
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted';
    color?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    fontStyle?: 'normal' | 'italic';
    textShadowColor?: string;
    textShadowOffset?: { width: number; height: number };
    textShadowRadius?: number;
    elevation?: number;
    shadowColor?: string;
    shadowOffset?: { width: number; height: number };
    shadowOpacity?: number;
    shadowRadius?: number;
    iconColor?: string;
    transform?: { rotateX?: string; rotateY?: string; rotateZ?: string; };
} 