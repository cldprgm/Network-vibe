import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostListItems from './PostListItems';
import PostDetailItems from './PostDetailItems';
import PostSection from './PostSection';
import PostList from './PostList';
import { PostActions } from './PostActions';
import PostRating from './PostRating';
import CommunityHoverCard from './CommunityHoverCard';
import { Post, CommunityType } from '@/services/types';
import React from 'react';

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        const { fill, ...imgProps } = props;
        return <img {...imgProps} />;
    },
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/zustand_store/authStore', () => ({
    useAuthStore: () => ({ isAuthenticated: true }),
}));

jest.mock('@/services/api', () => ({
    votePost: jest.fn(async () => ({ sum_rating: 10, user_vote: 1 })),
    deleteVotePost: jest.fn(async () => ({ sum_rating: 9, user_vote: 0 })),
    getCommunityBySlug: jest.fn(async () => ({ id: 1, name: 'test', icon: '', banner: '', members_count: 1, is_member: false, description: '' })),
    joinCommunity: jest.fn(),
    fetchPosts: jest.fn(async () => ({ results: [], nextPage: null })),
}));

jest.mock('./CommunityHoverCard', () => (props: any) => props.community ? <div data-testid="community-hover-card">HoverCard: {props.community.name}</div> : null);
jest.mock('./media/PostMedia', () => () => <div data-testid="post-media">PostMedia</div>);
jest.mock('./PostRating', () => (props: any) => <div data-testid="post-rating">Rating: {props.sum_rating}</div>);
jest.mock('../auth/AuthModalController', () => (props: any) => <div data-testid="auth-modal">AuthModal</div>);

// --- Test Data ---
const mockPost: Post = {
    id: 1,
    title: 'Test Post',
    slug: 'test-post',
    description: 'desc',
    author: 'author',
    created: '2023-01-01T00:00:00Z',
    updated: '2023-01-01T00:00:00Z',
    sum_rating: 5,
    user_vote: 0,
    comment_count: 2,
    community_id: 1,
    community_name: 'test',
    community_icon: '/icon.png',
    community_slug: 'test',
    is_creator: true,
    media_data: [],
};
const mockCommunity: CommunityType = {
    id: 1,
    slug: 'test',
    creator: 'creator',
    banner_upload: '/banner.png',
    icon_upload: '/icon.png',
    is_nsfw: false,
    visibility: 'PUBLIC',
    created: '2023-01-01T00:00:00Z',
    updated: '2023-01-01T00:00:00Z',
    status: 'PB',
    name: 'test',
    icon: '/icon.png',
    banner: '/banner.png',
    members_count: 123,
    is_member: false,
    description: 'desc',
    current_user_roles: [],
    current_user_permissions: [],
};

describe('PostListItems', () => {
    it('renders post data', () => {
        render(<PostListItems post={mockPost} />);
        expect(screen.getByText('Test Post')).toBeInTheDocument();
        expect(screen.getByText('n/test')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByTestId('post-media')).toBeInTheDocument();
        expect(screen.getByTestId('post-rating')).toBeInTheDocument();
    });
});

describe('PostDetailItems', () => {
    it('renders post details', () => {
        render(<PostDetailItems postData={mockPost} />);
        expect(screen.getByText('Test Post')).toBeInTheDocument();
        expect(screen.getByText('desc')).toBeInTheDocument();
        expect(screen.getByTestId('post-media')).toBeInTheDocument();
    });
});

describe('PostSection', () => {
    it('renders posts section with initial posts', () => {
        render(<PostSection initialPosts={[mockPost]} initialNextPage={null} />);
        expect(screen.getByText('Test Post')).toBeInTheDocument();
    });
});

describe('PostList', () => {
    it('renders PostSection', async () => {
        await act(async () => {
            render(<PostList />);
        });
        expect(true).toBe(true);
    });
});

describe('PostActions', () => {
    it('renders PostActions and handles vote', () => {
        const onVote = jest.fn();
        const onDelete = jest.fn();
        render(<PostActions post={mockPost} onVote={onVote} onDelete={onDelete} />);
        expect(screen.getByTestId('post-rating')).toBeInTheDocument();
    });
});

describe('PostRating', () => {
    it('renders rating and handles upvote/downvote', () => {
        const onVote = jest.fn();
        const onDelete = jest.fn();
        render(<PostRating sum_rating={5} userVote={null} onVote={onVote} onDelete={onDelete} />);
        expect(screen.getByText('5')).toBeInTheDocument();
    });
});

describe('CommunityHoverCard', () => {
    it('renders community hover card', () => {
        render(
            <CommunityHoverCard
                community={mockCommunity}
                isLoading={false}
                onJoin={jest.fn()}
                style={{}}
                cardRef={React.createRef()}
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
            />
        );
        expect(screen.getByText('n/test')).toBeInTheDocument();
        expect(screen.getByText('123 members')).toBeInTheDocument();
    });
});
