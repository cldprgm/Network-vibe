'use client';

import { useState, useEffect, useRef, useCallback, ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop';
import { CommunityType } from '@/services/types';
import { updateCommunity } from '@/services/api';
import { Eye, Shield, Lock, UploadCloud, Save, CheckCircle, ImageIcon } from 'lucide-react';
import getCroppedImg from '@/components/sidebar/cropImage';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import CommunityEditSidebar from './CommunityEditSidebar';
import useDebounce from '../sidebar/hooks/useDebounce';
import axios from 'axios';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;


interface CommunityEditFormProps {
    community: CommunityType;
}


const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl shadow-sm">
        {children}
    </div>
);

const CardHeader = ({ title, description }: { title: string; description: string }) => (
    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{description}</p>
    </div>
);

const CardContent = ({ children }: { children: React.ReactNode }) => (
    <div className="p-6 space-y-6">{children}</div>
);

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
        className={`cursor-pointer p-4 border-2 rounded-lg transition-all duration-200 relative ${selected
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
            }`}
    >
        <div className="flex items-start gap-4">
            <div className={`mt-1 ${selected ? 'text-indigo-600' : 'text-zinc-500'}`}>{icon}</div>
            <div>
                <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">{title}</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
            </div>
        </div>
        {selected && (
            <div className="absolute top-3 right-3 text-indigo-600 dark:text-indigo-400">
                <CheckCircle size={20} />
            </div>
        )}
    </div>
);

const ImageUploader = ({ label, currentImage, preview, onFileChange, error, aspectRatio = '1 / 1' }: {
    label: string;
    currentImage: string;
    preview: string | null;
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    error?: string | null;
    aspectRatio?: string;
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const id = `file-upload-${label.toLowerCase()}`;
    const isIcon = label === 'Icon';

    return (
        <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{label}</label>
            <div
                onClick={() => inputRef.current?.click()}
                className={`group relative cursor-pointer ${isIcon
                    ? 'rounded-full w-36 h-36 mx-auto'
                    : 'rounded-lg'
                    } overflow-hidden bg-zinc-100 dark:bg-zinc-800/50 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 transition-colors`}
                style={{ aspectRatio: isIcon ? '1 / 1' : aspectRatio }}
            >
                <input
                    type="file"
                    ref={inputRef}
                    id={id}
                    onChange={onFileChange}
                    accept="image/webp,image/png,image/jpeg,image/jpg"
                    className="hidden"
                />
                {preview || currentImage ? (
                    <Image
                        src={preview || currentImage}
                        alt={`${label} Preview`}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
                        <ImageIcon size={isIcon ? 32 : 48} className="mb-2" />
                        <span className="font-semibold">Click to upload</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <UploadCloud size={isIcon ? 24 : 32} />
                    <span className="mt-2 font-semibold">Change {label}</span>
                </div>
            </div>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
    );
};


export default function CommunityEditForm({ community }: CommunityEditFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState('general');

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

    const [nameError, setNameError] = useState<string | null>(null);
    const [isNameChecking, setIsNameChecking] = useState(false);
    const debouncedName = useDebounce(name, 1000);

    useEffect(() => {
        const validateName = async () => {
            if (debouncedName.trim().length === 0) {
                setNameError(null);
                return;
            }

            if (debouncedName.trim().length < 4) {
                setNameError('Name must be at least 4 characters long.');
                return;
            }

            const nameRegex = /^[a-zA-Z0-9_а-яА-Я]+$/;
            if (!nameRegex.test(debouncedName)) {
                setNameError('Name can only contain letters, numbers, and underscores.');
                return;
            }

            if (debouncedName !== community.name) {
                setIsNameChecking(true);
                setNameError(null);
                try {
                    const response = await axios.get(`${baseUrl}/communities/check-community-name/`, {
                        params: { name: debouncedName }
                    });
                    if (response.data.is_taken) {
                        setNameError(`"n/${name}" is already taken`);
                    }
                } catch (error) {
                    console.error("Community name check error:", error);
                    setNameError("Couldn't verify the name. Try again later.");
                } finally {
                    setIsNameChecking(false);
                }
            }
        };

        validateName();
    }, [debouncedName, community.name]);

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

    const handleCloseCropper = () => {
        setIsCropperOpen(false);
        setUncroppedBanner(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
    };

    const handleIconChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (validateImage(file, 7, setIconError)) {
                setIconFile(file);
                setIconPreview(URL.createObjectURL(file));
            } else {
                setIconFile(null);
                setIconPreview(null);
            }
        }
    };

    const handleBannerChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (validateImage(file, 10, setBannerError)) {
                setUncroppedBanner(URL.createObjectURL(file));
                setIsCropperOpen(true);
            } else {
                setBannerFile(null);
                setBannerPreview(null);
            }
            e.target.value = '';
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
            handleCloseCropper();
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
            alert("No changes to save.");
            return;
        }
        try {
            const updatedCommunity = await updateCommunity(community.slug, formData);
            router.push(`/communities/${updatedCommunity.slug}`);
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const isFormValid =
        name.trim().length >= 4 &&
        name.trim().length <= 21 &&
        description.trim().length >= 4 &&
        !nameError &&
        !isNameChecking &&
        !iconError &&
        !bannerError;

    return (
        <>
            <div className="flex flex-col md:flex-row gap-12">
                <CommunityEditSidebar activeSection={activeSection} onSelectSection={setActiveSection} />

                <main className="flex-[5]">
                    <form onSubmit={handleSubmit}>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white">Community Settings</h1>
                                <p className="text-gray-400 mt-1">Editing settings for n/{community.name}</p>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !isFormValid}
                                className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white transition-all ${loading || !isFormValid
                                        ? 'bg-indigo-500/50 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                            >
                                {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                            </button>
                        </div>

                        <div className="space-y-8">
                            {activeSection === 'general' && (
                                <Card>
                                    <CardHeader title="General" description="Basic information about your community." />
                                    <CardContent>
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                                Community Name<span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                value={name}
                                                minLength={4}
                                                maxLength={21}
                                                onChange={e => setName(e.target.value)}
                                                className={`w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border rounded-lg focus:ring-2 ${name.trim().length > 0 && name.trim().length < 4
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : 'border-zinc-300 dark:border-zinc-700 focus:ring-indigo-500'
                                                    }`}
                                            />
                                            <div className="text-sm mt-1 h-4 flex justify-between">
                                                {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                                                <p className="text-zinc-500 ml-auto">{21 - name.length} characters remaining</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                                Description<span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <textarea
                                                id="description"
                                                value={description}
                                                minLength={4}
                                                maxLength={420}
                                                onChange={e => setDescription(e.target.value)}
                                                rows={4}
                                                className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-indigo-500"
                                            />
                                            <div className="text-sm mt-1 h-4 flex justify-between">
                                                {description.trim().length < 4 && <p className="text-xs text-red-500">Description must be at least 4 characters long.</p>}
                                                <p className="text-zinc-500 ml-auto">{420 - description.length} characters remaining</p>

                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {activeSection === 'appearance' && (
                                <Card>
                                    <CardHeader title="Appearance" description="Customize the look of your community." />
                                    <CardContent>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                            <div className="space-y-2 text-center">
                                                <ImageUploader
                                                    label="Icon"
                                                    currentImage={community.icon}
                                                    preview={iconPreview}
                                                    onFileChange={handleIconChange}
                                                    error={iconError}
                                                />
                                                {iconError && (
                                                    <p className="text-xs text-red-500 mt-1">{iconError}</p>
                                                )}
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 px-1">max 7MB.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <ImageUploader
                                                    label="Banner"
                                                    currentImage={community.banner}
                                                    preview={bannerPreview}
                                                    onFileChange={handleBannerChange}
                                                    error={bannerError}
                                                    aspectRatio="16 / 5"
                                                />
                                                {bannerError && (
                                                    <p className="text-xs text-red-500 mt-1">{bannerError}</p>
                                                )}
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 px-1">max 10MB.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {activeSection === 'privacy' && (
                                <Card>
                                    <CardHeader title="Privacy & Content" description="Control who can see and post, and tag mature content." />
                                    <CardContent>
                                        <div>
                                            <h4 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Community Type</h4>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Choose who can view and participate.</p>
                                            <div className="space-y-3">
                                                <VisibilityOption type="PUBLIC" title="Public" description="Anyone can view, post, and comment." icon={<Eye />} selected={visibility === 'PUBLIC'} onClick={setVisibility} />
                                                <VisibilityOption type="RESTRICTED" title="Restricted" description="Anyone can view, but only approved users can post." icon={<Shield />} selected={visibility === 'RESTRICTED'} onClick={setVisibility} />
                                                <VisibilityOption type="PRIVATE" title="Private" description="Only approved users can view and post." icon={<Lock />} selected={visibility === 'PRIVATE'} onClick={setVisibility} />
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                                            <h4 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">Content Tag</h4>
                                            <div className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg mt-4">
                                                <div>
                                                    <label htmlFor="is_nsfw" className="font-medium text-gray-900 dark:text-gray-200">NSFW (18+ content)</label>
                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Tag your community if it contains adult content.</p>
                                                </div>
                                                <label htmlFor="is_nsfw" className="cursor-pointer">
                                                    <input id="is_nsfw" type="checkbox" className="sr-only peer" checked={isNsfw} onChange={(e) => setIsNsfw(e.target.checked)} />
                                                    <div className="relative w-11 h-6 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </form>
                </main>
                <div></div>
            </div>

            <Dialog open={isCropperOpen} onClose={handleCloseCropper} className="relative z-50">
                <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-2xl">
                        <DialogTitle className="p-4 text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800">
                            Adjust Banner
                        </DialogTitle>
                        <div className="relative w-full h-80 bg-zinc-200 dark:bg-zinc-800">
                            {uncroppedBanner && (
                                <Cropper image={uncroppedBanner} crop={crop} zoom={zoom} aspect={16 / 5} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
                            )}
                        </div>
                        <div className="p-4 space-y-4 border-t border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Zoom</label>
                                <input
                                    type="range" value={zoom} min={1} max={3} step={0.01}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button" onClick={handleCloseCropper}
                                    className="px-4 py-2 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button" onClick={showCroppedImage}
                                    className="px-6 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
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