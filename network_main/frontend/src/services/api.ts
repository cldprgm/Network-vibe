import { api } from './auth';
import axios from 'axios';
import { Post, CommentType, CommunityType } from './types';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;


export interface VoteResult {
    sum_rating: number;
    user_vote: number;
}

export interface PaginatedResponse<T> {
    results: T[];
    next: string | null;
    previous: string | null;
}

export async function fetchPosts(cursor: string | null): Promise<{ results: Post[]; nextCursor: string | null; previousCursor: string | null }> {
    try {
        const response = await api.get<PaginatedResponse<Post>>(
            `/posts/`,
            { params: { cursor } }
        );
        const { results, next, previous } = response.data;
        const nextCursor = next ? new URL(next).searchParams.get('cursor') : null;
        const previousCursor = previous ? new URL(previous).searchParams.get('cursor') : null;
        return { results, nextCursor, previousCursor };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch posts in client.');
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

export async function deletePost(slug: string): Promise<Post> {
    try {
        const response = await api.delete(`${baseUrl}/posts/${slug}/`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to delete post.');
    }
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

export async function fetchComments(
    slug: string,
    page: number = 1,
    pageSize: number = 10
): Promise<{ results: CommentType[]; next: string | null }> {
    try {
        const response = await api.get(`/posts/${slug}/comments/`, {
            params: { page, page_size: pageSize }
        });
        return {
            results: response.data.results,
            next: response.data.next,
        };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch comments.');
    }
}

export async function fetchReplies(
    slug: string,
    parentId: number
): Promise<CommentType[]> {
    try {
        const response = await api.get(`/posts/${slug}/comments/${parentId}/replies/`);
        return response.data.results;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch replies.');
    }
}

export async function createComment(slug: string, content: string, parentId?: number | null): Promise<CommentType> {
    try {
        const payload: { content: string; parent_id?: number | null } = { content };
        if (parentId != null) payload.parent_id = parentId;

        const response = await api.post<CommentType>(
            `/posts/${slug}/comments/`,
            payload
        );
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

export async function getCategoriesTree() {
    try {
        const response = await axios.get(`${baseUrl}/categories-tree/`); // fix later(communities dont needed here)
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to get categories-tree.');
    }
}

export async function getCommunities(page: number): Promise<{ results: CommunityType[]; nextPage: number | null }> {
    try {
        const response = await axios.get<PaginatedResponse<CommunityType>>(`${baseUrl}/communities/`);
        const { results, next } = response.data;
        const nextPage = next ? Number(new URL(next).searchParams.get('page')) : null;
        return { results, nextPage };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to get communities.');
    }
}

export async function fetchPostsForCommunity(communitySlug: string, page: number): Promise<{ results: Post[]; nextPage: number | null }> {
    try {
        const response = await api.get<PaginatedResponse<Post>>(
            `communities/${communitySlug}/posts/`,
            { params: { page } }
        );
        const { results, next } = response.data;
        const nextPage = next ? Number(new URL(next).searchParams.get('page')) : null;
        return { results, nextPage };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch community posts in client.');
    }
}

export async function getCommunityBySlug(slug: string): Promise<CommunityType> {
    try {
        const res = await api.get(`/communities/${encodeURIComponent(slug)}`);
        return res.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to get community.');
    }

}

export async function joinCommunity(community_id: number) {
    try {
        const response = await api.post(`/communities/${community_id}/memberships/`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to join community.');
    }
}

export async function leaveCommunity(community_id: number) {
    try {
        const response = await api.delete(`/communities/${community_id}/memberships/leave/`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to leave community.');
    }
}

export const updateCommunity = async (
    slug: string,
    data: FormData
): Promise<CommunityType> => {
    try {
        const response = await api.patch(`/communities/${slug}/`, data,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            },
        );
        return response.data;
    } catch (error) {
        console.error('Update community error:', error);
        throw error;
    }
};


export async function deleteCommunity(community_id: string) {
    try {
        const response = await api.delete(`/communities/${community_id}/`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to delete community.');
    }
}



