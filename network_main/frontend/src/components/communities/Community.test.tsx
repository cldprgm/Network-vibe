import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import CommunityEditSidebar from './CommunityEditSidebar';
import { RecommendedSection } from './RecommendedSection';
import { CommunityCard } from './CommunityCard';
import CommunityActions from './CommunityActions';
import { CommunityType } from '@/services/types';
import { joinCommunity } from '@/services/api';
import { api } from '@/services/auth';

jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ src, alt, ...props }: any) => <img src={typeof src === 'object' ? src.src : src} alt={alt} {...props} />,
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/services/api', () => ({
    fetchPostsForCommunity: jest.fn(),
    updateCommunity: jest.fn(),
    deleteCommunity: jest.fn(),
    joinCommunity: jest.fn(),
    leaveCommunity: jest.fn(),
}));

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        create: jest.fn(() => ({
            interceptors: {
                request: { use: jest.fn(), eject: jest.fn() },
                response: { use: jest.fn(), eject: jest.fn() },
            },
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
            patch: jest.fn(),
        })),
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        patch: jest.fn(),
    },
}));

jest.mock('../sidebar/hooks/useDebounce', () => (value: any) => value);

jest.mock('@/components/sidebar/cropImage', () => jest.fn(async () => ({ url: 'cropped.jpg', file: new File([], 'cropped.jpg') })));

const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn(),
};


beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
});

describe('CommunityEditSidebar Component', () => {
    it('renders sidebar items', () => {
        const mockOnSelect = jest.fn();
        render(<CommunityEditSidebar activeSection="general" onSelectSection={mockOnSelect} />);
        expect(screen.getByText('General')).toBeInTheDocument();
        expect(screen.getByText('Appearance')).toBeInTheDocument();
        expect(screen.getByText('Privacy & Type')).toBeInTheDocument();
    });

    it('calls onSelectSection on item click', () => {
        const mockOnSelect = jest.fn();
        render(<CommunityEditSidebar activeSection="general" onSelectSection={mockOnSelect} />);
        fireEvent.click(screen.getByText('Appearance'));
        expect(mockOnSelect).toHaveBeenCalledWith('appearance');
    });
});

describe('RecommendedSection Component', () => {
    const mockCommunities: CommunityType[] = [
        {
            id: 1,
            slug: 'comm1',
            name: 'Comm1',
            creator: 'user1',
            description: 'Desc1',
            banner: '',
            icon: 'icon1',
            banner_upload: '',
            icon_upload: '',
            is_nsfw: false,
            visibility: 'PUBLIC',
            created: '2023-01-01',
            updated: '2023-01-01',
            status: 'active',
            is_member: false,
            members_count: 10,
            current_user_roles: [],
            current_user_permissions: [],
        },
    ];

    const mockSetCommunities = jest.fn();
    const mockSetNextPage = jest.fn();

    it('renders recommended communities', () => {
        render(<RecommendedSection communities={mockCommunities} nextPage="/next" setCommunities={mockSetCommunities} setNextPage={mockSetNextPage} />);
        expect(screen.getByText('Comm1')).toBeInTheDocument();
    });

    it('loads more communities on button click', async () => {
        (api.get as jest.Mock).mockResolvedValue({ data: { recommendations: [{ ...mockCommunities[0], id: 2, name: 'Comm2' }], next: null } });
        render(<RecommendedSection communities={mockCommunities} nextPage="/next" setCommunities={mockSetCommunities} setNextPage={mockSetNextPage} />);
        fireEvent.click(screen.getByText('Show more'));
        await waitFor(() => {
            expect(mockSetCommunities).toHaveBeenCalled();
        });
    });

    it('shows error on load failure', async () => {
        (api.get as jest.Mock).mockRejectedValue(new Error());
        render(<RecommendedSection communities={[]} nextPage="/next" setCommunities={mockSetCommunities} setNextPage={mockSetNextPage} />);
        fireEvent.click(screen.getByText('Show more'));
        await waitFor(() => {
            expect(screen.getByText('Error loading communities')).toBeInTheDocument();
        });
    });
});

describe('CommunityCard Component', () => {
    const mockCommunity: CommunityType = {
        id: 1,
        slug: 'comm',
        name: 'Comm',
        creator: 'user',
        description: 'Desc',
        banner: '',
        icon: 'icon.jpg',
        banner_upload: '',
        icon_upload: '',
        is_nsfw: false,
        visibility: 'PUBLIC',
        created: '2023-01-01',
        updated: '2023-01-01',
        status: 'active',
        is_member: false,
        members_count: 10,
        current_user_roles: [],
        current_user_permissions: [],
    };

    it('renders community info', () => {
        render(<CommunityCard community={mockCommunity} />);
        expect(screen.getByText('Comm')).toBeInTheDocument();
        expect(screen.getByText('10 members')).toBeInTheDocument();
        expect(screen.getByText('Desc')).toBeInTheDocument();
    });

    it('handles join/leave toggle', async () => {
        (joinCommunity as jest.Mock).mockResolvedValue(undefined);
        render(<CommunityCard community={mockCommunity} />);
        fireEvent.click(screen.getByText('Join'));
        await waitFor(() => {
            expect(screen.getByText('Joined')).toBeInTheDocument();
            expect(screen.getByText('11 members')).toBeInTheDocument();
        });
    });
});

describe('CommunityActions Component', () => {
    const mockCommunity: CommunityType = {
        id: 1,
        slug: 'comm',
        name: 'Comm',
        creator: 'user',
        description: 'Desc',
        banner: '',
        icon: 'icon.jpg',
        banner_upload: '',
        icon_upload: '',
        is_nsfw: false,
        visibility: 'PUBLIC',
        created: '2023-01-01',
        updated: '2023-01-01',
        status: 'active',
        is_member: false,
        members_count: 10,
        current_user_roles: [],
        current_user_permissions: ['edit_community'],
    };

    it('renders action buttons', () => {
        render(<CommunityActions community={mockCommunity} isMember={false} />);
        expect(screen.getByText('Join')).toBeInTheDocument();
        expect(screen.getByText('Create Post')).toBeInTheDocument();
        expect(screen.getByText('Share')).toBeInTheDocument();
        expect(screen.getByText('Manage')).toBeInTheDocument();
    });

    it('handles join/leave', async () => {
        (joinCommunity as jest.Mock).mockResolvedValue(undefined);
        render(<CommunityActions community={mockCommunity} isMember={false} />);
        fireEvent.click(screen.getByText('Join'));
        await waitFor(() => {
            expect(screen.getByText('Joined')).toBeInTheDocument();
            expect(mockRouter.refresh).toHaveBeenCalled();
        });
    });

    it('handles create post', () => {
        render(<CommunityActions community={mockCommunity} isMember={false} />);
        fireEvent.click(screen.getByText('Create Post'));
        expect(mockRouter.push).toHaveBeenCalledWith('/submit?communitySlug=comm');
    });

    it('handles share (copy URL)', async () => {
        Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
        render(<CommunityActions community={mockCommunity} isMember={false} />);
        fireEvent.click(screen.getByText('Share'));
        await waitFor(() => {
            expect(screen.getByText('Copied!')).toBeInTheDocument();
        });
    });

    it('handles manage click', () => {
        render(<CommunityActions community={mockCommunity} isMember={false} />);
        fireEvent.click(screen.getByText('Manage'));
        expect(mockRouter.push).toHaveBeenCalledWith('comm/edit');
    });
});