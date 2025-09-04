import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Sidebar from './sidebar';
import { useRouter } from 'next/navigation';
import CommunityCreationPreview from './CommunityCreationPreview';
import getCroppedImg, { createImage } from './cropImage';


jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('./CreateCommunityModal', () => ({
    __esModule: true,
    default: ({ isOpen, onClose, onCreate }: any) =>
        isOpen ? (
            <div data-testid="create-community-modal">
                <button onClick={() => onCreate({ slug: 'test-community' })}>
                    Simulate Create
                </button>
            </div>
        ) : null,
}));

describe('Sidebar', () => {
    const mockRouter = {
        push: jest.fn(),
    };

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        jest.clearAllMocks();
    });

    it('renders collapsed sidebar on small screens', () => {
        global.innerWidth = 800;
        render(<Sidebar />);

        expect(screen.getByRole('complementary')).toHaveClass('w-10');
    });

    it('expands sidebar when toggle button is clicked', () => {
        render(<Sidebar />);

        fireEvent.click(screen.getByTitle('Expand navigation'));

        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Popular')).toBeInTheDocument();
    });

    it('opens community creation modal', async () => {
        render(<Sidebar />);

        fireEvent.click(screen.getByTitle('Expand navigation'));
        fireEvent.click(screen.getByText('Create a community'));

        await waitFor(() => {
            expect(screen.getByTestId('create-community-modal')).toBeInTheDocument();
        });
    });

    it('navigates to community after creation', async () => {
        render(<Sidebar />);

        fireEvent.click(screen.getByTitle('Expand navigation'));
        fireEvent.click(screen.getByText('Create a community'));

        await waitFor(() => {
            fireEvent.click(screen.getByText('Simulate Create'));
        });

        expect(mockRouter.push).toHaveBeenCalledWith('/communities/test-community');
    });
});


jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('./CreateCommunityModal', () => ({
    __esModule: true,
    default: ({ isOpen, onClose, onCreate }: any) =>
        isOpen ? (
            <div data-testid="create-community-modal">
                <button onClick={() => onCreate({ slug: 'test-community' })}>
                    Simulate Create
                </button>
            </div>
        ) : null,
}));

describe('Sidebar', () => {
    const mockRouter = {
        push: jest.fn(),
    };

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        jest.clearAllMocks();
    });

    it('renders collapsed sidebar on small screens', () => {
        global.innerWidth = 800;
        render(<Sidebar />);

        expect(screen.getByRole('complementary')).toHaveClass('w-10');
    });

    it('expands sidebar when toggle button is clicked', () => {
        render(<Sidebar />);

        fireEvent.click(screen.getByTitle('Expand navigation'));

        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Popular')).toBeInTheDocument();
    });

    it('opens community creation modal', async () => {
        render(<Sidebar />);

        fireEvent.click(screen.getByTitle('Expand navigation'));
        fireEvent.click(screen.getByText('Create a community'));

        await waitFor(() => {
            expect(screen.getByTestId('create-community-modal')).toBeInTheDocument();
        });
    });

    it('navigates to community after creation', async () => {
        render(<Sidebar />);

        fireEvent.click(screen.getByTitle('Expand navigation'));
        fireEvent.click(screen.getByText('Create a community'));

        await waitFor(() => {
            fireEvent.click(screen.getByText('Simulate Create'));
        });

        expect(mockRouter.push).toHaveBeenCalledWith('/communities/test-community');
    });
});


describe('CommunityCreationPreview', () => {
    it('displays community information', () => {
        const props = {
            name: 'TestCommunity',
            description: 'Test description',
            iconPreview: 'icon.jpg',
            bannerPreview: 'banner.jpg',
        };

        render(<CommunityCreationPreview {...props} />);

        expect(screen.getByText('n/TestCommunity')).toBeInTheDocument();
        expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('shows default content when no data provided', () => {
        render(<CommunityCreationPreview name="" description="" iconPreview={null} bannerPreview={null} />);

        expect(screen.getByText('n/CommunityName')).toBeInTheDocument();
        expect(screen.getByText(/This is where the description/)).toBeInTheDocument();
    });
});



global.URL.createObjectURL = jest.fn(() => 'mocked-url');

const mockGetContext = jest.fn(() => ({
    drawImage: jest.fn(),
    canvas: {} as HTMLCanvasElement,
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
}));

Object.defineProperty(global.HTMLCanvasElement.prototype, 'getContext', {
    value: mockGetContext,
    writable: true,
});

Object.defineProperty(global.HTMLCanvasElement.prototype, 'toBlob', {
    value: jest.fn((callback) => {
        callback(new Blob());
    }),
    writable: true,
});

global.Image = class MockImage {
    src: string = '';
    onload: () => void = () => { };
    onerror: (error: any) => void = () => { };

    addEventListener: (type: string, listener: any) => void = (type, listener) => {
        if (type === 'load') {
            this.onload = listener;
        } else if (type === 'error') {
            this.onerror = listener;
        }
    };

    setAttribute: (name: string, value: string) => void = (name, value) => {
    };

    constructor() {
        setTimeout(() => {
            this.onload();
        }, 100);
    }
} as any;

describe('cropImage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates image from URL', async () => {
        const url = 'test.jpg';
        const image = await createImage(url);
        expect(image.src).toBe(url);
    }, 10000);

    it('returns cropped image', async () => {
        const cropArea = {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
        } as any;

        const result = await getCroppedImg('test.jpg', cropArea);

        expect(result).toHaveProperty('file');
        expect(result).toHaveProperty('url');
        expect(global.URL.createObjectURL).toHaveBeenCalled();
    }, 10000);
});