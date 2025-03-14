import { SQLiteDatabase } from "expo-sqlite";
import { useEffect } from "react";
import NDK, { NDKSqliteProfileRecord, NDKUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { create } from "zustand";
import { getAllPubkeyFlares } from "@/stores/db/pubkeyFlare";
import { db } from "@/stores/db";

type UserEntry = {
    profile: NDKUserProfile,
    flare: string,
}

interface UserStoreProps {
    ndk: NDK,
    entries: Map<string, UserEntry>,
    used: Set<string>,
}

interface UserStoreActions {
    init: (ndk: NDK, db: SQLiteDatabase) => void,

    setUsed: (pubkey: string) => void,
    update: (pubkey: string, profile: NDKUserProfile) => void,
}

type UsersStore = UserStoreProps & UserStoreActions;

export const useUsersStore = create<UsersStore>((set, get) => ({
    entries: new Map(),
    ndk: null,
    used: new Set(),

    init: (ndk, db: SQLiteDatabase) => {
        const userFlare = getAllPubkeyFlares();
        
        const entries = db.getAllSync('SELECT * FROM profiles') as NDKSqliteProfileRecord[];
        const map = new Map<string, UserEntry>();
        for (const entry of entries) {
            map.set(entry.pubkey, {
                profile: {
                    name: entry.name,
                    about: entry.about,
                    picture: entry.picture,
                    banner: entry.banner,
                    nip05: entry.nip05,
                    lud16: entry.lud16,
                    lud06: entry.lud06,
                    displayName: entry.display_name,
                    website: entry.website,
                    created_at: entry.created_at,
                },
                flare: userFlare.get(entry.pubkey) ?? undefined,
            });
        }
        set({ entries: map, ndk });
    },

    setUsed: (pubkey: string) => {
        const { entries, used, ndk } = get();
        if (used.has(pubkey)) return;
        if (!ndk) {
            console.log('no ndk available for profile hook');
            return;
        }

        const entry = entries.get(pubkey);
        const hasIt = !!entry;
        let flare: string | undefined;

        if (entry?.flare === undefined) {
            const result = db.getFirstSync(`SELECT flare_type FROM pubkey_flares WHERE pubkey = ?`, [pubkey]) as { flare_type: string } | undefined;
            flare = result?.flare_type ?? null;
        }

        // let flare = entry?.flare;

        // if (flare === undefined) {
        //     // check if the user has an olas365 event

        // }

        
        if (!hasIt) {
            const user = ndk.getUser({ pubkey });
            user.fetchProfile().then(profile => {
                console.log('loading profile', pubkey);
                set(s => {
                    const _entries = new Map(s.entries);
                    const current = _entries.get(pubkey) ?? { profile: null, flare };
                    current.profile = profile;
                    current.flare = flare;
                    _entries.set(pubkey, current);
                    return { entries: _entries };
                })
            }).catch(e => {
                console.error('error fetching profile', e);
            });
        } else {
            set(s => {
                const _entries = new Map(s.entries);
                const current = _entries.get(pubkey) ?? { profile: null, flare };
                current.flare = flare;
                _entries.set(pubkey, current);
                return { entries: _entries };
            })
        }

        set(s => {
            const _s = new Set(s.used);
            _s.add(pubkey);
            return { used: _s };
        });
    },

    update: (pubkey: string, profile: NDKUserProfile) => {
        set(s => {
            const _entries = new Map(s.entries);
            const entry = _entries.get(pubkey) ?? { profile: null, flare: null };
            const current = { ...entry };
            current.profile = profile;
            if (current.profile) {
                _entries.set(pubkey, current);
            } else {
                _entries.delete(pubkey);
            }
            return { entries: _entries };
        });
    }
}));


export const useUserProfile = (pubkey?: string) => {
    const entry = useUsersStore(s => s.entries.get(pubkey));
    const setUsed = useUsersStore(s => s.setUsed);
    let flare: string | null = null;

    useEffect(() => {
        if (pubkey) setUsed(pubkey);
    }, [pubkey]);

    return { userProfile: entry?.profile, flare };
}