import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import CommentsSection from './CommentsSection';
import CommentForm from './CommentForm';
import CommentNode from './CommentNode';
import CommentRating from './CommentRating';
import { CommentType } from '@/services/types';

jest.mock('@/services/api', () => ({
    fetchComments: jest.fn(),
    fetchReplies: jest.fn(),
    createComment: jest.fn(),
    voteComment: jest.fn(),
    deleteVoteComment: jest.fn(),
}));

const mockRequireAuth = jest.fn((callback) => callback());
const mockPostSlug = 'test-slug';

const mockComment: CommentType = {
    id: 1,
    content: 'Test comment',
    author: 'TestUser',
    time_created: '2023-01-01T00:00:00Z',
    time_updated: '2023-02-01T00:00:00Z',
    sum_rating: 5,
    user_vote: 0,
    replies_count: 0,
    children: [],
};

const mockChildComment: CommentType = {
    id: 2,
    content: 'Child comment',
    author: 'ChildUser',
    time_created: '2023-01-02T00:00:00Z',
    time_updated: '2023-03-02T00:00:00Z',
    sum_rating: 2,
    user_vote: 0,
    replies_count: 0,
    children: [],
};

class IntersectionObserverMock implements IntersectionObserver {
    static callback?: IntersectionObserverCallback;
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];

    constructor(cb: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
        IntersectionObserverMock.callback = cb;
    }

    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
    takeRecords = jest.fn();
}
(global as any).IntersectionObserver = IntersectionObserverMock as any;

describe('CommentsSection Component', () => {
    const { fetchComments } = require('@/services/api');

    beforeEach(() => {
        fetchComments.mockResolvedValue({ results: [mockComment], next: null });
        jest.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it('renders placeholder when no comments are loaded', async () => {
        fetchComments.mockResolvedValueOnce({ results: [], next: null });
        await act(async () => {
            render(<CommentsSection postSlug={mockPostSlug} requireAuth={mockRequireAuth} />);
        });
        expect(screen.getByText('Join the conversation')).toBeInTheDocument();
    });

    it('loads and displays root comments', async () => {
        await act(async () => {
            render(<CommentsSection postSlug={mockPostSlug} requireAuth={mockRequireAuth} />);
        });

        await waitFor(() => expect(fetchComments).toHaveBeenCalledWith(mockPostSlug));
        expect(screen.getByText('Test comment')).toBeInTheDocument();
        expect(screen.getByText('TestUser')).toBeInTheDocument();
    });

    it('handles creating a root comment', async () => {
        const { createComment } = require('@/services/api');
        createComment.mockResolvedValue({ ...mockComment, id: 3, content: 'New comment' });

        await act(async () => {
            render(<CommentsSection postSlug={mockPostSlug} requireAuth={mockRequireAuth} />);
        });

        await act(async () => {
            fireEvent.click(screen.getByText('Join the conversation'));
        });

        const textarea = screen.getByPlaceholderText('Write a comment...');
        await act(async () => {
            fireEvent.change(textarea, { target: { value: 'New comment' } });
            fireEvent.click(screen.getByText('Comment'));
        });

        await waitFor(() => expect(createComment).toHaveBeenCalledWith(mockPostSlug, 'New comment', null));
        await waitFor(() => expect(screen.getByText('New comment')).toBeInTheDocument());
    });

    it('handles infinite scrolling for more comments', async () => {
        fetchComments.mockResolvedValueOnce({ results: [mockComment], next: 'page2' });
        fetchComments.mockResolvedValueOnce({ results: [mockChildComment], next: null });

        await act(async () => {
            render(<CommentsSection postSlug={mockPostSlug} requireAuth={mockRequireAuth} />);
        });

        await waitFor(() => expect(screen.getByText('Test comment')).toBeInTheDocument());

        await act(async () => {
            const cb = (IntersectionObserverMock as any).callback as IntersectionObserverCallback | undefined;
            if (cb) {
                const observerInstance = new (IntersectionObserverMock as any)(cb) as IntersectionObserver;
                cb(
                    [{ isIntersecting: true, target: document.querySelector('.h-2') as Element } as IntersectionObserverEntry],
                    observerInstance
                );
            }
        });

        await waitFor(() => expect(fetchComments).toHaveBeenCalledWith(mockPostSlug, 2));
        await waitFor(() => expect(screen.getByText('Child comment')).toBeInTheDocument());
    });
});

describe('CommentForm Component', () => {
    let mockOnSubmit: jest.Mock;
    let mockOnCancel: jest.Mock;

    beforeEach(() => {
        mockOnSubmit = jest.fn();
        mockOnCancel = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders the form with textarea and buttons', () => {
        render(<CommentForm parentId="root" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
        expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Comment')).toBeInTheDocument();
    });

    it('submits the form with text', async () => {
        render(<CommentForm parentId="root" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
        const textarea = screen.getByPlaceholderText('Write a comment...');
        await act(async () => {
            fireEvent.change(textarea, { target: { value: 'Test comment' } });
            fireEvent.click(screen.getByText('Comment'));
        });
        expect(mockOnSubmit).toHaveBeenCalledWith('root', 'Test comment');
    });

    it('does not submit if text is empty', async () => {
        render(<CommentForm parentId="root" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
        await act(async () => {
            fireEvent.click(screen.getByText('Comment'));
        });
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('calls onCancel when cancel button is clicked', async () => {
        render(<CommentForm parentId="root" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
        await act(async () => {
            fireEvent.click(screen.getByText('Cancel'));
        });
        expect(mockOnCancel).toHaveBeenCalled();
    });
});

describe('CommentNode Component', () => {
    const mockSetReplyTo = jest.fn();
    const mockOnCreateComment = jest.fn();
    const mockOnVote = jest.fn();
    const mockOnDeleteVote = jest.fn();
    const mockOnLoadChildren = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders comment content, author, and timestamp', () => {
        render(
            <CommentNode
                comment={mockComment}
                depth={0}
                replyTo={null}
                setReplyTo={mockSetReplyTo}
                onCreateComment={mockOnCreateComment}
                onVote={mockOnVote}
                onDeleteVote={mockOnDeleteVote}
                onLoadChildren={mockOnLoadChildren}
            />
        );
        expect(screen.getByText('Test comment')).toBeInTheDocument();
        expect(screen.getByText('TestUser')).toBeInTheDocument();
        expect(screen.getByText(/2023/)).toBeInTheDocument();
    });

    it('handles reply button click', () => {
        render(
            <CommentNode
                comment={mockComment}
                depth={0}
                replyTo={null}
                setReplyTo={mockSetReplyTo}
                onCreateComment={mockOnCreateComment}
                onVote={mockOnVote}
                onDeleteVote={mockOnDeleteVote}
                onLoadChildren={mockOnLoadChildren}
            />
        );
        fireEvent.click(screen.getByText('Reply'));
        expect(mockSetReplyTo).toHaveBeenCalledWith('1');
    });

    it('shows expand button if has children and handles toggle', async () => {
        const commentWithChildren = { ...mockComment, replies_count: 1, children: [] };
        render(
            <CommentNode
                comment={commentWithChildren}
                depth={0}
                replyTo={null}
                setReplyTo={mockSetReplyTo}
                onCreateComment={mockOnCreateComment}
                onVote={mockOnVote}
                onDeleteVote={mockOnDeleteVote}
                onLoadChildren={mockOnLoadChildren}
            />
        );
        expect(screen.getByText('Show replies (1)')).toBeInTheDocument();
        await act(async () => {
            fireEvent.click(screen.getByText('Show replies (1)'));
        });
        expect(mockOnLoadChildren).toHaveBeenCalledWith(1);
    });

    it('renders child comments when expanded', () => {
        const commentWithChildren = { ...mockComment, children: [mockChildComment], replies_count: 1 };
        render(
            <CommentNode
                comment={commentWithChildren}
                depth={0}
                replyTo={null}
                setReplyTo={mockSetReplyTo}
                onCreateComment={mockOnCreateComment}
                onVote={mockOnVote}
                onDeleteVote={mockOnDeleteVote}
                onLoadChildren={mockOnLoadChildren}
            />
        );
        fireEvent.click(screen.getByText('Show replies (1)'));
        expect(screen.getByText('Child comment')).toBeInTheDocument();
    });
});

describe('CommentRating Component', () => {
    const mockOnVote = jest.fn();
    const mockOnDelete = jest.fn();

    it('renders rating with upvote and downvote buttons', () => {
        render(<CommentRating sum_rating={5} userVote={null} onVote={mockOnVote} onDelete={mockOnDelete} />);
        expect(screen.getByText('5')).toBeInTheDocument();
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(2);
    });

    it('handles upvote click', () => {
        render(<CommentRating sum_rating={5} userVote={null} onVote={mockOnVote} onDelete={mockOnDelete} />);
        const upvoteButton = screen.getAllByRole('button')[0];
        fireEvent.click(upvoteButton);
        expect(mockOnVote).toHaveBeenCalledWith(1);
    });

    it('handles downvote click', () => {
        render(<CommentRating sum_rating={5} userVote={null} onVote={mockOnVote} onDelete={mockOnDelete} />);
        const downvoteButton = screen.getAllByRole('button')[1];
        fireEvent.click(downvoteButton);
        expect(mockOnVote).toHaveBeenCalledWith(-1);
    });

    it('handles delete vote if already voted', () => {
        render(<CommentRating sum_rating={5} userVote={1} onVote={mockOnVote} onDelete={mockOnDelete} />);
        const upvoteButton = screen.getAllByRole('button')[0];
        fireEvent.click(upvoteButton);
        expect(mockOnDelete).toHaveBeenCalled();
    });
});
