import { api } from './auth';
import axios from 'axios';
import { Post, CommentType } from './types';

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

export async function createComment(slug: string, content: string, parentId?: number | null): Promise<CommentType> {
    try {
        const payload: { content: string; parent_id?: number | null } = { content };
        if (parentId != null) payload.parent_id = parentId;

        const response = await api.post<CommentType>(
            `/posts/${slug}/comments/`,
            payload
        );
        console.log(payload)
        console.log(response.data)
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to create comment.');
    }
};

export async function voteComment(slug: string, comment_id: number, value: number): Promise<VoteResult> {
    try {
        const response = await api.post(`/posts/${slug}/comments/${comment_id}/ratings/`, { value });
        const { sum_rating, user_vote } = response.data;
        return { sum_rating, user_vote };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to vote on comment.');
    }
};

export async function deleteVoteComment(slug: string, comment_id: number): Promise<VoteResult> {
    try {
        const response = await api.delete(`/posts/${slug}/comments/${comment_id}/ratings/`);
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

