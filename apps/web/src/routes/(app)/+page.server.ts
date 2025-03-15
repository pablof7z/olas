import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    createPost: async ({ request, locals }) => {
        try {
            // This is now handled client-side by the PostEditor component
            // This server-side action is kept for compatibility with form submissions
            return { success: true };
        } catch (error) {
            console.error('Error creating post:', error);
            return fail(500, { error: 'Failed to create post' });
        }
    }
}; 