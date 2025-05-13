import { Post } from '@/services/types';
import {fetchWithToken} from './jwt'

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getPosts(): Promise<Post[]> {
    try {
        const response = await fetchWithToken(`${baseUrl}/api/v1/posts/`, {
            cache: 'no-store',
        });

        const posts = await response.json();
        return posts;

    } catch (error) {
        throw new Error('Failed to fetch posts.');
    }
};

export async function votePost(slug: string, value:number) {
    try {
        const response = await fetchWithToken(`${baseUrl}/api/v1/posts/${slug}/ratings/`, {
            method: 'POST',
            body: JSON.stringify({ value }),
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        throw new Error('Failed to vote post.');
    }
};

export async function deleteVotePost(slug: string) {
    try {
        const response = await fetchWithToken(`${baseUrl}/api/v1/posts/${slug}/ratings/`, {
            method: 'DELETE',
        });
        return true;
    }
    catch (error) {
        throw new Error('Failed to delete vote.');
    }
};