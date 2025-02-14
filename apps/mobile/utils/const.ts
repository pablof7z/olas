import { NDKKind } from "@nostr-dev-kit/ndk-mobile";

export const blacklistPubkeys = new Set([
    "0403c86a1bb4cfbc34c8a493fbd1f0d158d42dd06d03eaa3720882a066d3a378"
])

export const videoKinds = new Set([NDKKind.HorizontalVideo, NDKKind.VerticalVideo]);
export const mainKinds = new Set([NDKKind.Image, ...Array.from(videoKinds)]);

export const DEV_BUILD = false;

export const PUBLISH_ENABLED = !DEV_BUILD || true;

export const COMMUNITIES_ENABLED = DEV_BUILD && false;

export const NET_DEBUG = DEV_BUILD && true;