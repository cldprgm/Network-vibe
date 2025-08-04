'use client';

import { useState, useRef, useCallback, ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop';
import { CommunityType } from '@/services/types';
import { Eye, Shield, Lock, UploadCloud, Save } from 'lucide-react';
import getCroppedImg from '@/components/sidebar/cropImage';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

interface CommunityEditFormProps {
    community: CommunityType;
}

async function updateCommunity(slug: string, data: FormData) {
    console.log('Updating community...', { slug });
    for (let [key, value] of data.entries()) {
        console.log(key, value);
    }

    alert("Community update logic is not implemented yet. Check the console for form data.");
}

const VisibilityOption = ({ type, title, description, icon, selected, onClick }: {
    type: CommunityType['visibility'];
    title: string;
    description: string;
    icon: React.ReactNode;
    selected: boolean;
    onClick: (type: CommunityType['visibility']) => void;
}) => (
    <div
        onClick={() => onClick(type)}
        className={`cursor-pointer p-4 border rounded-lg transition-all duration-200 ${selected
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
            }`}
    >
        <div className="flex items-center gap-3">
            <div className={`text-xl ${selected ? 'text-indigo-600' : 'text-zinc-500'}`}>{icon}</div>
            <div>
                <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">{title}</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
            </div>
        </div>
    </div>
);

const ImageUploader = ({ label, currentImage, preview, onFileChange, error }: {
    label: string;
    currentImage: string;
    preview: string | null;
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    error?: string | null;
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{label}</label>
            <div className="flex items-center gap-4">
                <Image
                    src={preview || currentImage}
                    alt={`${label} Preview`}
                    width={label === 'Icon' ? 64 : 128}
                    height={64}
                    className={`${label === 'Icon' ? 'rounded-full' : 'rounded-md'} object-cover bg-zinc-200 dark:bg-zinc-700`}
                    style={{ aspectRatio: label === 'Icon' ? '1 / 1' : '16 / 5' }}
                />
                <input
                    type="file"
                    ref={inputRef}
                    onChange={onFileChange}
                    accept="image/webp,image/png,image/jpeg,image/jpg"
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                    <UploadCloud size={16} />
                    Change {label}
                </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};


export default function CommunityEditForm({ community }: { community: CommunityType }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState(community.name);
    const [description, setDescription] = useState(community.description);
    const [isNsfw, setIsNsfw] = useState(community.is_nsfw);
    const [visibility, setVisibility] = useState<CommunityType['visibility']>(community.visibility);

    const [iconFile, setIconFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [iconError, setIconError] = useState<string | null>(null);
    const [bannerError, setBannerError] = useState<string | null>(null);

    const [uncroppedBanner, setUncroppedBanner] = useState<string | null>(null);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);


    const validateImage = (file: File, maxSizeMB: number, setError: (error: string | null) => void): boolean => {
        setError(null);
        const allowedTypes = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];

        if (!allowedTypes.includes(file.type)) {
            setError(`Invalid file type. Please use: ${allowedTypes.join(', ')}`);
            return false;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File is too large. Max size is ${maxSizeMB}MB.`);
            return false;
        }

        return true;
    };


    const handleIconChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && validateImage(file, 7, setIconError)) {
            setIconFile(file);
            setIconPreview(URL.createObjectURL(file));
        }
    };

    const handleBannerChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && validateImage(file, 10, setBannerError)) {
            setUncroppedBanner(URL.createObjectURL(file));
            setIsCropperOpen(true);
        }
    };

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = useCallback(async () => {
        if (!croppedAreaPixels || !uncroppedBanner) return;
        try {
            const croppedImage = await getCroppedImg(uncroppedBanner, croppedAreaPixels);
            if (croppedImage) {
                setBannerPreview(croppedImage.url);
                setBannerFile(croppedImage.file);
            }
        } catch (e) {
            console.error(e);
            setBannerError("Could not crop the image. Please try again.");
        } finally {
            setIsCropperOpen(false);
        }
    }, [croppedAreaPixels, uncroppedBanner]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        if (name !== community.name) formData.append('name', name);
        if (description !== community.description) formData.append('description', description);
        if (isNsfw !== community.is_nsfw) formData.append('is_nsfw', String(isNsfw));
        if (visibility !== community.visibility) formData.append('visibility', visibility);
        if (iconFile) formData.append('icon_upload', iconFile);
        if (bannerFile) formData.append('banner_upload', bannerFile);

        if (formData.entries().next().done) {
            setLoading(false);
            alert("Нет изменений для сохранения.");
            return;
        }

        try {
            await updateCommunity(community.slug, formData); //fix later
            router.push(`/communities/${community.slug}`);
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = name.trim().length >= 4 && description.trim().length >= 4 && !iconError && !bannerError;

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Base Settings</h3>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Community Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                minLength={4}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            {name.trim().length < 4 && <p className="text-xs text-red-500 mt-1">Name must be at least 4 characters long.</p>}
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Description</label>
                            <textarea
                                id="description"
                                value={description}
                                minLength={4}
                                onChange={e => setDescription(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            {description.trim().length < 4 && <p className="text-xs text-red-500 mt-1">Описание должно содержать не менее 4 символов.</p>}
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Appearance</h3>
                    <div className="space-y-6">
                        <ImageUploader
                            label="Icon"
                            currentImage={community.icon}
                            preview={iconPreview}
                            onFileChange={handleIconChange}
                            error={iconError}
                        />
                        <ImageUploader
                            label="Banner"
                            currentImage={community.banner}
                            preview={bannerPreview}
                            onFileChange={handleBannerChange}
                            error={bannerError}
                        />
                    </div>
                </div>

                <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Community Type</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Choose who can see and participate in your community.</p>
                    <div className="space-y-3 mb-6">
                        <VisibilityOption
                            type="PUBLIC"
                            title="Public"
                            description="Anyone can view, post, and comment in this community."
                            icon={<Eye />}
                            selected={visibility === 'PUBLIC'}
                            onClick={setVisibility}
                        />
                        <VisibilityOption
                            type="RESTRICTED"
                            title="Restricted"
                            description="Anyone can view this community, but only approved users can post."
                            icon={<Shield />}
                            selected={visibility === 'RESTRICTED'}
                            onClick={setVisibility}
                        />
                        <VisibilityOption
                            type="PRIVATE"
                            title="Private"
                            description="Only approved users can view and submit to this community."
                            icon={<Lock />}
                            selected={visibility === 'PRIVATE'}
                            onClick={setVisibility}
                        />
                    </div>

                    <div className="pt-6 border-t border-zinc-200 dark:border-zinc-700">
                        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Content Tag</h3>
                        <div className="flex items-start p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <input
                                id="is_nsfw"
                                type="checkbox"
                                checked={isNsfw}
                                onChange={(e) => setIsNsfw(e.target.checked)}
                                className="h-4 w-4 mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="ml-3">
                                <label htmlFor="is_nsfw" className="cursor-pointer font-medium text-gray-900 dark:text-gray-200">
                                    NSFW (18+ content)
                                </label>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Tag your community as Not Safe For Work if it contains adult content.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || !isFormValid}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:bg-indigo-400 disabled:dark:bg-indigo-800 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : <><Save size={18} /> Save changes</>}
                    </button>
                </div>
            </form>

            <Dialog open={isCropperOpen} onClose={() => setIsCropperOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-2xl">
                        <DialogTitle className="p-4 text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-700">
                            Adjust Banner
                        </DialogTitle>
                        <div className="relative w-full h-80 bg-zinc-200 dark:bg-zinc-800">
                            {uncroppedBanner && (
                                <Cropper
                                    image={uncroppedBanner}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={16 / 5}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                />
                            )}
                        </div>
                        <div className="p-4 space-y-4 border-t border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Zoom</label>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.01}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCropperOpen(false)}
                                    className="cursor-pointer px-4 py-2 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={showCroppedImage}
                                    className="cursor-pointer px-6 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </>
    );
}