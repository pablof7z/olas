import { 
    textStickerStyles, 
    getTextStickerStyleById,
    getNextTextStickerStyle,
    TextStickerStyle
} from './textStickerStyles';

import { 
    mentionStickerStyles, 
    getMentionStickerStyleById,
    getNextMentionStickerStyle,
    MentionStickerStyle
} from './mentionStickerStyles';

import { 
    nostrEventStickerStyles, 
    getNostrEventStickerStyleById,
    getNextNostrEventStickerStyle,
    NostrEventStickerStyle
} from './nostrEventStickerStyles';

import { 
    countdownStickerStyles, 
    getCountdownStickerStyleById,
    getNextCountdownStickerStyle,
    CountdownStickerStyle
} from './countdownStickerStyles';

import {
    nostrFilterStickerStyles,
    getNostrFilterStickerStyleById,
    getNextNostrFilterStickerStyle,
    NostrFilterStickerStyle
} from './nostrFilterStickerStyles';

import {
    promptStickerStyles,
    getPromptStickerStyleById,
    getNextPromptStickerStyle,
    PromptStickerStyle
} from './promptStickerStyles';

// Function to get the style by ID based on sticker type
export function getStickerStyleById(type: string, styleId: string): any {
    switch (type) {
        case 'text':
            return getTextStickerStyleById(styleId);
        case 'mention':
            return getMentionStickerStyleById(styleId);
        case 'nostrEvent':
            return getNostrEventStickerStyleById(styleId);
        case 'countdown':
            return getCountdownStickerStyleById(styleId);
        case 'nostrFilter':
            return getNostrFilterStickerStyleById(styleId);
        case 'prompt':
            return getPromptStickerStyleById(styleId);
        default:
            return getTextStickerStyleById(styleId);
    }
}

// Function to get the next style ID based on sticker type and current style ID
export function getNextStickerStyleId(type: string, currentStyleId: string): string {
    switch (type) {
        case 'text':
            return getNextTextStickerStyle(currentStyleId).id;
        case 'mention':
            return getNextMentionStickerStyle(currentStyleId).id;
        case 'nostrEvent':
            return getNextNostrEventStickerStyle(currentStyleId).id;
        case 'countdown':
            return getNextCountdownStickerStyle(currentStyleId).id;
        case 'nostrFilter':
            return getNextNostrFilterStickerStyle(currentStyleId).id;
        case 'prompt':
            return getNextPromptStickerStyle(currentStyleId).id;
        default:
            return getNextTextStickerStyle(currentStyleId).id;
    }
}

// Function to get a default style ID for a given sticker type
export function getDefaultStyleIdForStickerType(type: string): string {
    switch (type) {
        case 'text':
            return textStickerStyles[0].id;
        case 'mention':
            return mentionStickerStyles[0].id;
        case 'nostrEvent':
            return nostrEventStickerStyles[0].id;
        case 'countdown':
            return countdownStickerStyles[0].id;
        case 'nostrFilter':
            return nostrFilterStickerStyles[0].id;
        case 'prompt':
            return promptStickerStyles[0].id;
        default:
            return textStickerStyles[0].id;
    }
}

export {
    TextStickerStyle,
    MentionStickerStyle,
    NostrEventStickerStyle,
    CountdownStickerStyle,
    textStickerStyles,
    mentionStickerStyles,
    nostrEventStickerStyles,
    countdownStickerStyles,
    nostrFilterStickerStyles,
    promptStickerStyles
}; 