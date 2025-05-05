import { Post } from '@/services/types';

export async function getPosts(): Promise<Post[]> {
    try {
        const baseUrl = process.env.API_BASE_URL;
        const response = await fetch(`${baseUrl}/api/v1/posts/`, {
            cache: 'no-store',
        });

        const posts = await response.json();
        return posts;

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch posts.');
    }
}