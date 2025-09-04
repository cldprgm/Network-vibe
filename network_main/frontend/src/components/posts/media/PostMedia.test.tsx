import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostMedia from './PostMedia';
import { Post, Media } from '@/services/types';

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        const { fill, priority, unoptimized, placeholder, sizes, srcSet, loader, ...imgProps } = props;

        if (imgProps.src && typeof imgProps.src === 'object') {
            imgProps.src = imgProps.src.src ?? '';
        }

        return <img {...imgProps} />;
    },
}));

const mockUnregister = jest.fn();
const mockRegister = jest.fn(() => mockUnregister);
jest.mock('../VideoVisibilityManager', () => ({
    getVideoVisibilityManager: () => ({ register: mockRegister }),
}));

const mockImage1: Media = {
    id: 1,
    uploaded_at: '12',
    file: 'image1.jpg',
    media_type: 'image',
    aspect_ratio: '4/3',
};
const mockImage2: Media = {
    id: 2,
    uploaded_at: '18',
    file: 'image2.png',
    media_type: 'image',
    aspect_ratio: '16/9',
};
const mockImageVertical: Media = {
    id: 3,
    uploaded_at: '4',
    file: 'image_vertical.jpg',
    media_type: 'image',
    aspect_ratio: '9/16',
};
const mockVideo: Media = {
    id: 4,
    uploaded_at: '5',
    file: 'video.mp4',
    media_type: 'video',
    aspect_ratio: '16/9',
};

const mockPost: Post = {
    id: 1,
    title: 'test',
    slug: 'test',
    description: 'Test post',
    author: 'bebra',
    created: '13',
    updated: '14',
    sum_rating: 23,
    user_vote: 0,
    comment_count: 3,
    community_id: 1,
    community_name: 'testcommunity',
    community_icon: 'test',
    community_slug: 'testcommunity',
    media_data: [],
    is_creator: false
};

describe('PostMedia Component', () => {
    beforeAll(() => {
        Object.defineProperty(global.Image.prototype, 'naturalWidth', {
            writable: true,
            value: 800,
        });
        Object.defineProperty(global.Image.prototype, 'naturalHeight', {
            writable: true,
            value: 600,
        });

        Object.defineProperty(HTMLMediaElement.prototype, 'readyState', { value: 4 });
        Object.defineProperty(HTMLMediaElement.prototype, 'play', { value: jest.fn() });
        Object.defineProperty(HTMLMediaElement.prototype, 'pause', { value: jest.fn() });
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('does not render if no media_data is provided', () => {
        const { container } = render(<PostMedia post={{ ...mockPost, media_data: [] }} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders a single image without navigation buttons', () => {
        render(<PostMedia post={{ ...mockPost, media_data: [mockImage1] }} />);
        expect(screen.getByAltText('Post media content')).toBeInTheDocument();
        expect(screen.queryByLabelText('Next media')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Previous media')).not.toBeInTheDocument();
    });

    it('renders a single video', async () => {
        render(<PostMedia post={{ ...mockPost, media_data: [mockVideo] }} />);
        const video = await screen.findByTitle('Post video content');
        expect(video).toBeInTheDocument();
        expect(video).toHaveAttribute('src', mockVideo.file);
    });

    it('renders multiple media with navigation buttons', () => {
        render(<PostMedia post={{ ...mockPost, media_data: [mockImage1, mockImage2] }} />);

        const prevButtons = screen.getAllByLabelText('Previous media');
        expect(prevButtons[0]).toBeInTheDocument();

        const nextButtons = screen.getAllByLabelText('Next media');
        expect(nextButtons[0]).toBeInTheDocument();

        const indicators = screen.getByLabelText('media indicators');
        expect(indicators.children.length).toBe(2);
    });

    describe('Slider Navigation', () => {
        it('switches to the next slide when clicking "Next"', () => {
            render(<PostMedia post={{ ...mockPost, media_data: [mockImage1, mockImage2] }} />);

            const nextButtons = screen.getAllByLabelText('Next media');
            fireEvent.click(nextButtons[0]);

            expect(screen.getByAltText('Post media content')).toHaveAttribute('src', 'image2.png');
        });

        it('switches from the last slide to the first slide', () => {
            render(<PostMedia post={{ ...mockPost, media_data: [mockImage1, mockImage2] }} />);

            const nextButtons = screen.getAllByLabelText('Next media');
            fireEvent.click(nextButtons[0]);
            fireEvent.click(nextButtons[0]);

            expect(screen.getByAltText('Post media content')).toHaveAttribute('src', 'image1.jpg');
        });

        it('switches to the previous slide when clicking "Previous"', () => {
            render(<PostMedia post={{ ...mockPost, media_data: [mockImage1, mockImage2] }} />);

            const nextButtons = screen.getAllByLabelText('Next media');
            fireEvent.click(nextButtons[0]);

            const prevButtons = screen.getAllByLabelText('Previous media');
            fireEvent.click(prevButtons[0]);

            expect(screen.getByAltText('Post media content')).toHaveAttribute('src', 'image1.jpg');
        });
    });

    describe('Aspect Ratio Calculation', () => {
        it('uses the minimum aspect ratio from all images for the container', async () => {
            render(<PostMedia post={{ ...mockPost, media_data: [mockImage1, mockImage2] }} />);

            const container = screen.getByTestId('media-container');
            await waitFor(() => {
                expect(container).toHaveStyle(`aspect-ratio: ${800 / 600}`);
            });
        });

        it('uses the video aspect ratio when it is displayed', async () => {
            render(<PostMedia post={{ ...mockPost, media_data: [mockVideo, mockImage1] }} />);

            const container = screen.getByTestId('media-container');
            await waitFor(() => {
                expect(container).toHaveStyle(`aspect-ratio: ${16 / 9}`);
            });

            const nextButtons = screen.getAllByLabelText('Next media');
            fireEvent.click(nextButtons[0]);

            await waitFor(() => {
                expect(container).toHaveStyle(`aspect-ratio: ${800 / 600}`);
            });
        });

        it('sets minHeight to 300px for videos', async () => {
            render(<PostMedia post={{ ...mockPost, media_data: [mockVideo] }} />);
            const container = screen.getByTestId('media-container');

            await waitFor(() => {
                expect(container).toHaveStyle('min-height: 300px');
            });
        });

        it('does not set minHeight for images', async () => {
            render(<PostMedia post={{ ...mockPost, media_data: [mockImage1] }} />);
            const container = screen.getByTestId('media-container');

            await waitFor(() => {
                expect(container).not.toHaveStyle('min-height: 300px');
            });
        });
    });

    describe('Fullscreen Mode (Lightbox)', () => {
        it('opens fullscreen mode when clicking on an image', () => {
            render(<PostMedia post={{ ...mockPost, media_data: [mockImage1] }} />);
            const imageButton = screen.getByLabelText('Open image fullscreen');
            fireEvent.click(imageButton);

            expect(screen.getByLabelText('Close lightbox')).toBeInTheDocument();
            expect(screen.getByAltText('Fullscreen media')).toHaveAttribute('src', 'image1.jpg');
        });

        it('closes fullscreen mode when clicking the "Close" button', () => {
            render(<PostMedia post={{ ...mockPost, media_data: [mockImage1] }} />);
            fireEvent.click(screen.getByLabelText('Open image fullscreen'));

            const closeButton = screen.getByLabelText('Close lightbox');
            fireEvent.click(closeButton);

            expect(screen.queryByLabelText('Close lightbox')).not.toBeInTheDocument();
        });

        it('closes fullscreen mode when pressing the Escape key', () => {
            render(<PostMedia post={{ ...mockPost, media_data: [mockImage1] }} />);
            fireEvent.click(screen.getByLabelText('Open image fullscreen'));

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(screen.queryByLabelText('Close lightbox')).not.toBeInTheDocument();
        });

        it('allows navigation with arrow keys in fullscreen mode', () => {
            render(<PostMedia post={{ ...mockPost, media_data: [mockImage1, mockImage2] }} />);
            fireEvent.click(screen.getByLabelText('Open image fullscreen'));

            expect(screen.getByAltText('Fullscreen media')).toHaveAttribute('src', 'image1.jpg');

            fireEvent.keyDown(document, { key: 'ArrowRight' });
            expect(screen.getByAltText('Fullscreen media')).toHaveAttribute('src', 'image2.png');

            fireEvent.keyDown(document, { key: 'ArrowLeft' });
            expect(screen.getByAltText('Fullscreen media')).toHaveAttribute('src', 'image1.jpg');
        });


    });

    describe('Video Player Behavior', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('shows video controls 600ms after playback starts', async () => {
            render(<PostMedia post={{ ...mockPost, media_data: [mockVideo] }} />);

            const video = await screen.findByTitle('Post video content');
            fireEvent.play(video);

            act(() => {
                jest.advanceTimersByTime(600);
            });

            expect(video).toHaveAttribute('controls');
        });
    });
});