import { RelayMock } from '@nostr-dev-kit/ndk-test-utils';
import NDK, { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk-mobile';

import { generateEvent } from '../event';
import type { PostMedia, PostMetadata, VisibilityType } from '../../types';

// Helper function to create base metadata for tests
function createBaseMetadata(visibility: VisibilityType = 'text-apps'): PostMetadata {
    return {
        caption: 'Test caption',
        visibility,
        location: undefined,
        tags: [],
    };
}

// Helper function to create test media
function createTestMedia(type: 'image' | 'video'): PostMedia[] {
    return [{
        id: '1',
        mediaType: type,
        uris: ['test-uri'],
        uploadedUri: 'https://example.com/test.jpg',
        contentMode: 'square',
        duration: type === 'video' ? 10 : undefined,
    }];
}

describe('generateEvent', () => {
    let ndk: NDK;
    let relayMock: RelayMock;

    beforeEach(() => {
        ndk = new NDK();
        relayMock = new RelayMock('wss://test.relay', {
            simulateDisconnect: false,
            connectionDelay: 100,
            autoConnect: true
        });
    });

    it('generates kind 1 event for text-apps visibility', async () => {
        const metadata = createBaseMetadata('text-apps');
        const media = createTestMedia('image');

        const result = await generateEvent(ndk, metadata, media);
        expect(result?.event.kind).toBe(NDKKind.Text);
    });

    it('generates kind 1 event for videos with text-apps visibility', async () => {
        const metadata = createBaseMetadata('text-apps');
        const media = createTestMedia('video');
        
        const result = await generateEvent(ndk, metadata, media);
        expect(result?.event.kind).toBe(NDKKind.Text);
        expect(result?.event.tags.some(tag => tag[0] === 'k' && tag[1] === NDKKind.ShortVideo.toString())).toBe(true);
    });

    it('includes shared URLs in content for text-apps visibility', async () => {
        const metadata = createBaseMetadata();
        const media = createTestMedia('image');

        const result = await generateEvent(ndk, metadata, media);
        expect(result?.event.content).toContain(metadata.caption);
        expect(result?.event.content).toContain(media[0].uploadedUri);
    });

    it('generates NDKImage event for images with media-apps visibility', async () => {
        const metadata = createBaseMetadata('media-apps');
        const media = createTestMedia('image');

        const result = await generateEvent(ndk, metadata, media);
        expect(result?.event.kind).toBe(NDKKind.Image);
    });

    it('generates NDKVideo event for videos with media-apps visibility', async () => {
        const metadata = createBaseMetadata('media-apps');
        const media = createTestMedia('video');

        const result = await generateEvent(ndk, metadata, media);
        expect(result?.event.kind).toBe(NDKKind.ShortVideo);
    });

    it('sets expiration tag correctly', async () => {
        const expiration = 3600; // 1 hour
        const metadata = { ...createBaseMetadata(), expiration };
        const media = createTestMedia('image');

        const result = await generateEvent(ndk, metadata, media);
        const now = Math.floor(Date.now() / 1000);
        const expirationTag = result?.event.tags.find(tag => tag[0] === 'expiration');
        expect(expirationTag).toBeDefined();
        expect(Number(expirationTag?.[1])).toBeCloseTo(now + expiration, -1); // Allow 1 second difference
    });
});
