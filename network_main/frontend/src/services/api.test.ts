import { URL } from 'url';
import axios from 'axios';
import { api as authApi } from './auth';
import * as apiModule from './api';

jest.mock('axios');
jest.mock('./auth', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn(),
        patch: jest.fn(),
    },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAuthApi = authApi as unknown as {
    get: jest.Mock;
    post: jest.Mock;
    delete: jest.Mock;
    patch: jest.Mock;
};

describe('api.ts', () => {
    const OLD_ENV = process.env;
    const testApiBaseUrl = 'https://api.example.com';

    beforeAll(() => {
        process.env = { ...OLD_ENV, NEXT_PUBLIC_API_BASE_URL: testApiBaseUrl };
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchPosts', () => {
        it('returns results and nextPage when next is present', async () => {
            const response = {
                data: {
                    results: [{ id: 1, title: 'a' }],
                    next: `${testApiBaseUrl}/posts/?page=3`,
                },
            };
            mockedAuthApi.get.mockResolvedValueOnce(response);

            const res = await apiModule.fetchPosts(2);
            expect(mockedAuthApi.get).toHaveBeenCalledWith('/posts/', { params: { page: 2 } });
            expect(res.results).toEqual(response.data.results);
            expect(res.nextPage).toBe(3);
        });

        it('returns null nextPage when next is null', async () => {
            const response = { data: { results: [], next: null } };
            mockedAuthApi.get.mockResolvedValueOnce(response);

            const res = await apiModule.fetchPosts(1);
            expect(res.results).toEqual([]);
            expect(res.nextPage).toBeNull();
        });

        it('throws wrapped error message on failure', async () => {
            mockedAuthApi.get.mockRejectedValueOnce({ response: { data: { message: 'boom' } } });
            await expect(apiModule.fetchPosts(1)).rejects.toThrow('boom');
        });

        it('throws generic message if response lacks message', async () => {
            mockedAuthApi.get.mockRejectedValueOnce({});
            await expect(apiModule.fetchPosts(1)).rejects.toThrow('Failed to fetch posts in client.');
        });
    });

    describe('apiCreatePost', () => {
        it('throws error message from server', async () => {
            mockedAuthApi.post.mockRejectedValueOnce({ response: { data: { message: 'nope' } } });
            await expect(apiModule.apiCreatePost({} as any)).rejects.toThrow('nope');
        });

        it('throws generic message if no message', async () => {
            mockedAuthApi.post.mockRejectedValueOnce({});
            await expect(apiModule.apiCreatePost({} as any)).rejects.toThrow('Failed to create post.');
        });
    });

    describe('votePost / deleteVotePost', () => {
        it('votePost returns VoteResult', async () => {
            const resp = { data: { sum_rating: 10, user_vote: 1 } };
            mockedAuthApi.post.mockResolvedValueOnce(resp);
            const res = await apiModule.votePost('slug-1', 1);
            expect(mockedAuthApi.post).toHaveBeenCalledWith('/posts/slug-1/ratings/', { value: 1 });
            expect(res).toEqual({ sum_rating: 10, user_vote: 1 });
        });

        it('votePost throws with server message', async () => {
            mockedAuthApi.post.mockRejectedValueOnce({ response: { data: { message: 'vote fail' } } });
            await expect(apiModule.votePost('s', 1)).rejects.toThrow('vote fail');
        });

        it('deleteVotePost returns VoteResult', async () => {
            const resp = { data: { sum_rating: 0, user_vote: 0 } };
            mockedAuthApi.delete.mockResolvedValueOnce(resp);
            const res = await apiModule.deleteVotePost('slug-2');
            expect(mockedAuthApi.delete).toHaveBeenCalledWith('/posts/slug-2/ratings/');
            expect(res).toEqual({ sum_rating: 0, user_vote: 0 });
        });

        it('deleteVotePost throws generic message if no message', async () => {
            mockedAuthApi.delete.mockRejectedValueOnce({});
            await expect(apiModule.deleteVotePost('s')).rejects.toThrow('Failed to delete vote.');
        });
    });

    describe('comments related', () => {
        it('fetchComments returns results and next', async () => {
            const resp = { data: { results: [{ id: 1 }], next: 'https://x?page=2' } };
            mockedAuthApi.get.mockResolvedValueOnce(resp);
            const r = await apiModule.fetchComments('slug', 1, 5);
            expect(mockedAuthApi.get).toHaveBeenCalledWith('/posts/slug/comments/', { params: { page: 1, page_size: 5 } });
            expect(r.results).toEqual(resp.data.results);
            expect(r.next).toEqual(resp.data.next);
        });

        it('fetchReplies returns list', async () => {
            const resp = { data: { results: [{ id: 11 }] } };
            mockedAuthApi.get.mockResolvedValueOnce(resp);
            const r = await apiModule.fetchReplies('s', 11);
            expect(mockedAuthApi.get).toHaveBeenCalledWith('/posts/s/comments/11/replies/');
            expect(r).toEqual(resp.data.results);
        });

        it('createComment without parentId posts correct payload', async () => {
            const resp = { data: { id: 7, content: 'hi' } };
            mockedAuthApi.post.mockResolvedValueOnce(resp);
            const r = await apiModule.createComment('slug', 'hi', null);
            expect(mockedAuthApi.post).toHaveBeenCalledWith('/posts/slug/comments/', { content: 'hi' });
            expect(r).toEqual(resp.data);
        });

        it('createComment with parentId posts payload with parent_id', async () => {
            const resp = { data: { id: 8, content: 'reply' } };
            mockedAuthApi.post.mockResolvedValueOnce(resp);
            const r = await apiModule.createComment('slug', 'reply', 5);
            expect(mockedAuthApi.post).toHaveBeenCalledWith('/posts/slug/comments/', { content: 'reply', parent_id: 5 });
            expect(r).toEqual(resp.data);
        });

        it('voteComment and deleteVoteComment behave similarly', async () => {
            mockedAuthApi.post.mockResolvedValueOnce({ data: { sum_rating: 2, user_vote: -1 } });
            const v = await apiModule.voteComment('s', 2, -1);
            expect(mockedAuthApi.post).toHaveBeenCalledWith('/posts/s/comments/2/ratings/', { value: -1 });
            expect(v).toEqual({ sum_rating: 2, user_vote: -1 });

            mockedAuthApi.delete.mockResolvedValueOnce({ data: { sum_rating: 0, user_vote: 0 } });
            const d = await apiModule.deleteVoteComment('s', 2);
            expect(mockedAuthApi.delete).toHaveBeenCalledWith('/posts/s/comments/2/ratings/');
            expect(d).toEqual({ sum_rating: 0, user_vote: 0 });
        });

        it('createComment throws server message', async () => {
            mockedAuthApi.post.mockRejectedValueOnce({ response: { data: { message: 'no create' } } });
            await expect(apiModule.createComment('s', 'x', null)).rejects.toThrow('no create');
        });
    });

    describe('communities and categories', () => {
        it('getCategoriesTree throws message when axios fails', async () => {
            mockedAxios.get.mockRejectedValueOnce({ response: { data: { message: 'bad' } } });
            await expect(apiModule.getCategoriesTree()).rejects.toThrow('bad');
        });

        it('getCommunities throws generic message if no message', async () => {
            mockedAxios.get.mockRejectedValueOnce({});
            await expect(apiModule.getCommunities(1)).rejects.toThrow('Failed to get communities.');
        });

        it('fetchPostsForCommunity works like fetchPosts', async () => {
            const resp = { data: { results: [{ id: 1 }], next: null } };
            mockedAuthApi.get.mockResolvedValueOnce(resp);
            const r = await apiModule.fetchPostsForCommunity('com', 1);
            expect(mockedAuthApi.get).toHaveBeenCalledWith('communities/com/posts/', { params: { page: 1 } });
            expect(r.nextPage).toBeNull();
        });

        it('getCommunityBySlug encodes slug and returns data', async () => {
            const resp = { data: { id: 99, slug: 'a/b' } };
            mockedAuthApi.get.mockResolvedValueOnce(resp);
            const r = await apiModule.getCommunityBySlug('a/b');
            expect(mockedAuthApi.get).toHaveBeenCalledWith('/communities/a%2Fb/');
            expect(r).toEqual(resp.data);
        });

        it('joinCommunity posts and returns data', async () => {
            const resp = { data: { success: true } };
            mockedAuthApi.post.mockResolvedValueOnce(resp);
            const r = await apiModule.joinCommunity(12);
            expect(mockedAuthApi.post).toHaveBeenCalledWith('/communities/12/memberships/');
            expect(r).toEqual(resp.data);
        });

        it('leaveCommunity calls delete and returns data', async () => {
            const resp = { data: { ok: true } };
            mockedAuthApi.delete.mockResolvedValueOnce(resp);
            const r = await apiModule.leaveCommunity(12);
            expect(mockedAuthApi.delete).toHaveBeenCalledWith('/communities/12/memberships/leave/');
            expect(r).toEqual(resp.data);
        });

        it('updateCommunity sends patch with multipart headers and returns data', async () => {
            const form = {} as unknown as FormData;
            const resp = { data: { id: 1, name: 'x' } };
            mockedAuthApi.patch.mockResolvedValueOnce(resp);
            const r = await apiModule.updateCommunity('slug-test', form);
            expect(mockedAuthApi.patch).toHaveBeenCalledWith(
                '/communities/slug-test/',
                form,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            expect(r).toEqual(resp.data);
        });

        it('updateCommunity rethrows original error (and logs) on failure', async () => {
            const err = new Error('net');
            mockedAuthApi.patch.mockRejectedValueOnce(err);

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            await expect(apiModule.updateCommunity('s', {} as any)).rejects.toThrow(err);

            consoleErrorSpy.mockRestore();
        });

        it('deleteCommunity calls api.delete and returns data', async () => {
            const resp = { data: { deleted: true } };
            mockedAuthApi.delete.mockResolvedValueOnce(resp);
            const r = await apiModule.deleteCommunity('5');
            expect(mockedAuthApi.delete).toHaveBeenCalledWith('/communities/5/');
            expect(r).toEqual(resp.data);
        });

        it('deleteCommunity throws server message on failure', async () => {
            mockedAuthApi.delete.mockRejectedValueOnce({ response: { data: { message: 'cant' } } });
            await expect(apiModule.deleteCommunity('5')).rejects.toThrow('cant');
        });
    });
});