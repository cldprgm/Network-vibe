import { Post } from '@/services/types';
import { api } from './auth'
import { refreshAccessToken } from './auth';
import axios from 'axios';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export function createServerApi(cookies: string) {
    return axios.create({
        baseURL: baseUrl,
        headers: {
            Cookie: cookies,
        },
        withCredentials: true,
    });
}

export async function getPosts(cookies?: string): Promise<Post[]> {
    const apiServ = createServerApi(cookies || '');
    try {
        const res = await apiServ.get('/posts/');
        return res.data;
    } catch (err: any) {
        if (err.response?.status === 401 && cookies) {
            const newAccessTokenCookie = await refreshAccessToken(cookies);
            if (newAccessTokenCookie) {
                const retryApi = createServerApi(cookies + '; ' + newAccessTokenCookie);
                const retryRes = await retryApi.get('/posts/');
                return retryRes.data;
            }
        }

        console.error('getPosts failed:', {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
        });

        throw new Error('Failed to load posts.');
    }
};

export async function getPostDetail(slug: string, cookies?: string): Promise<Post | null> {
    const apiServ = createServerApi(cookies || '');
    try {
        const res = await apiServ.get(`/posts/${slug}/`);
        return res.data;
    } catch (err: any) {
        if (err.response?.status === 401 && cookies) {
            const newAccessTokenCookie = await refreshAccessToken(cookies);
            if (newAccessTokenCookie) {
                const retryApi = createServerApi(cookies + '; ' + newAccessTokenCookie);
                const retryRes = await retryApi.get(`/posts/${slug}/`);
                return retryRes.data;
            }
        }

        console.error('getPostDetail failed:', {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
        });

        throw new Error('Failed to load post.');
    }
};

export async function votePost(slug: string, value: number): Promise<{ rating_sum: number; user_vote: number }> {
    try {
        const response = await api.post(`/posts/${slug}/ratings/`, { value });
        return {
            rating_sum: response.data.sum_rating,
            user_vote: response.data.value,
        };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to vote on post.');
    }
};

export async function deleteVotePost(slug: string): Promise<void> {
    try {
        await api.delete(`/posts/${slug}/ratings/`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to delete vote.');
    }
};

