import { api } from './auth';
import axios from 'axios';
import { Post } from './types';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;


export interface VoteResult {
    sum_rating: number;
    user_vote: number;
}

export async function votePost(slug: string, value: number): Promise<VoteResult> {
    try {
        const response = await api.post(`/posts/${slug}/ratings/`, { value });
        const { sum_rating, user_vote } = response.data;
        return { sum_rating, user_vote };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to vote on post.');
    }
};

export async function deleteVotePost(slug: string): Promise<VoteResult> {
    try {
        const response = await api.delete(`/posts/${slug}/ratings/`);
        const { sum_rating, user_vote } = response.data;
        return { sum_rating, user_vote };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to delete vote.');
    }
};

export async function getCommunities() {
    try {
        const response = await axios.get(`${baseUrl}/communities/`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to get communities.');
    }
}

export async function apiCreatePost(postData: FormData): Promise<Post> {
    try {
        const response = await api.post(`${baseUrl}/posts/`, postData);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to create post.');
    }
}

