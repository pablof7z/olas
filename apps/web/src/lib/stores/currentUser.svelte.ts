import { browser } from "$app/environment";
import ndk from "$lib/stores/ndk.svelte";
import {
    type Hexpubkey,
    type NDKEvent,
    NDKKind,
    NDKNip07Signer,
    type NDKRelay,
    type NDKUser,
} from "@nostr-dev-kit/ndk";

let currentUser: CurrentUser | null = $state(null);

class CurrentUser {
    /** The NDKUser instance representing the current logged in user */
    user: NDKUser | null = $state(null);

    /** Array of pubkeys that the current user follows */
    follows: Set<Hexpubkey> = $state(new Set<Hexpubkey>());

    /** User settings and preferences for the Listr app */
    // settings: App.UserSettings | null = $state(null);

    constructor(user: NDKUser) {
        this.user = user;
        if (this.user) {
            this.fetchUserFollows().then(f => this.follows = f)
            // this.fetchUserSettings();
        }
    }

    async fetchUserFollows(): Promise<Set<Hexpubkey>> {
        if (this.user) {
            return await this.user.followSet();
        }
        return Promise.resolve(new Set<Hexpubkey>());
    }

    // async fetchUserSettings(): Promise<App.UserSettings> {
    //     if (!this.user || !this.user.ndk) throw new Error("No logged in user or NDK instance");
    //     if (!browser) return Promise.resolve({ devMode: false });
    //     const ndk = this.user.ndk;
    //     const settingsEvents = await ndk.fetchEvents({
    //         kinds: [NDKKind.AppSpecificData],
    //         authors: [this.user.pubkey],
    //         "#d": ["listr/settings/v1"],
    //     });
    //     const eventsArray = Array.from(settingsEvents);

    //     let settings: App.UserSettings = { devMode: false };

    //     if (eventsArray.length === 1) {
    //         const event: NDKEvent = eventsArray[0] as NDKEvent;
    //         let signer: NDKNip07Signer;
    //         if (!ndk.signer) {
    //             signer = new NDKNip07Signer();
    //             ndk.signer = signer;
    //         }
    //         await event.decrypt(this.user);
    //         settings = JSON.parse(event.content);
    //     } else if (eventsArray.length > 1) {
    //         console.error("Many settings events", eventsArray);
    //     }
    //     return settings;
    // }

    async follow(user: NDKUser): Promise<boolean> {
        if (!this.user) return false;
        const result = await this.user.follow(user);
        if (result) {
            this.follows = [...this.follows, user.pubkey];
        }
        return result;
    }

    async unfollow(user: NDKUser): Promise<boolean | Set<NDKRelay>> {
        if (!this.user) return false;
        const result = await this.user.unfollow(user);
        if (result) {
            this.follows = this.follows.filter((pubkey) => pubkey !== user.pubkey);
        }
        return result;
    }
}

export function getCurrentUser(): CurrentUser | null {
    return currentUser;
}

export function setCurrentUser(user: NDKUser | null): CurrentUser | null {
    currentUser = user ? new CurrentUser(user) : null;
    return currentUser;
}
