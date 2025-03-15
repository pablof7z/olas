import type { SvelteComponent } from 'svelte';
import Root from './textarea.svelte';

type TextareaEvents = {
    blur: Event;
    change: Event;
    click: MouseEvent;
    focus: FocusEvent;
    focusin: FocusEvent;
    focusout: FocusEvent;
    keydown: KeyboardEvent;
    keypress: KeyboardEvent;
    keyup: KeyboardEvent;
    mouseover: MouseEvent;
    mouseenter: MouseEvent;
    mouseleave: MouseEvent;
    mousemove: MouseEvent;
    paste: ClipboardEvent;
    input: Event;
}

export {
    Root,
    type TextareaEvents,
    Root as Textarea
}; 