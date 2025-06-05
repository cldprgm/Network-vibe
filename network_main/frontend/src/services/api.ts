import { api } from './auth'

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

