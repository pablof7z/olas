// @ts-nocheck
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { isAuthenticated } from '$lib/stores/auth';
import type { LayoutLoad } from './$types';

export const load = () => {
    if (!get(isAuthenticated)) {
        throw redirect(302, '/login');
    }
    
    return {};
}; ;null as any as LayoutLoad;