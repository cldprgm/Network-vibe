"use client";

import { useState, FormEvent, useRef, useCallback, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { getCommunityBySlug, fetchCommunitiesForUserProfile } from '@/services/api';
import { useAuthStore } from '@/zustand_store/authStore';
import { CommunityType, Post } from '@/services/types';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Type, Image as ImageIcon, X, Upload, Loader2, Search } from 'lucide-react';
import { api } from '@/services/auth';
import Image from 'next/image';
import { processAndAppendFiles } from '@/services/fileProcessing';

interface FileWithPreview extends File {
    preview: string;
}

interface ExistingMedia {
    id: number;
    preview: string;
    type: string;
}

export default function EditPost() {
    const [activeTab, setActiveTab] = useState<'TEXT' | 'MEDIA'>('TEXT');
    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [community, setCommunity] = useState<CommunityType | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>([]);
    const [deletedMediaIds, setDeletedMediaIds] = useState<number[]>([]);
    const [rejections, setRejections] = useState<FileRejection[]>([]);

    const [communitiesLoading, setCommunitiesLoading] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [compressionStatus, setCompressionStatus] = useState<string>('');

    const { user } = useAuthStore();

    const searchParams = useSearchParams();
    const communitySlug = searchParams.get('communitySlug');

    const [searchQuery, setSearchQuery] = useState('');

    const params = useParams();
    const slug = params.postSlug as string;

    const router = useRouter();

    const titleRef = useRef<HTMLTextAreaElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLUListElement>(null);
    const dropdownContainerRef = useRef<HTMLDivElement>(null);

    const [communities, setCommunities] = useState<CommunityType[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

    const filesRef = useRef<FileWithPreview[]>([]);

    useEffect(() => {
        filesRef.current = files;
    }, [files]);

    useEffect(() => {
        if (!user?.slug) return;

        const fetchInitialCommunities = async () => {
            setCommunitiesLoading(true);
            try {
                const response = await fetchCommunitiesForUserProfile(user.slug);
                setCommunities(response.results);
                setNextCursor(response.nextCursor);
            } catch (err: any) {
                console.log(err.message);
            } finally {
                setCommunitiesLoading(false);
            }
        };
        fetchInitialCommunities();
    }, [user?.slug]);

    const loadMoreCommunities = async () => {
        if (!nextCursor || communitiesLoading || !user?.slug) return;

        setCommunitiesLoading(true);
        try {
            const { results, nextCursor: cursor } = await fetchCommunitiesForUserProfile(user.slug, nextCursor);
            setCommunities(prev => [...prev, ...results]);
            setNextCursor(cursor);
        } catch (error) {
            console.error('Failed to load more communities:', error);
        } finally {
            setCommunitiesLoading(false);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            if (dropdownRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = dropdownRef.current;
                if (scrollTop + clientHeight >= scrollHeight - 5) {
                    loadMoreCommunities();
                }
            }
        };

        const dropdownEl = dropdownRef.current;
        if (dropdownOpen && dropdownEl) {
            dropdownEl.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (dropdownEl) {
                dropdownEl.removeEventListener('scroll', handleScroll);
            }
        };
    }, [dropdownOpen, nextCursor, communitiesLoading]);

    useEffect(() => {
        if (!communitySlug) return;
        getCommunityBySlug(communitySlug)
            .then(c => setCommunity(c))
            .catch(err => console.error(err));
    }, [communitySlug]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    useEffect(() => {
        if (!slug) return;
        const fetchPost = async () => {
            try {
                const post_data = await api.get(`/posts/${slug}`);
                const post: Post = await post_data.data

                setTitle(post.title);
                setContent(post.description || '');
                const comm = await getCommunityBySlug(post.community_slug);
                setCommunity(comm);
                setExistingMedia(post.media_data.map(media => ({
                    id: media.id,
                    preview: media.file,
                    type: media.media_type
                })));
                adjustHeight(titleRef.current);
                adjustHeight(contentRef.current);
            } catch (err) {
                console.error(err);
            }
        };
        fetchPost();
    }, [slug]);

    const adjustHeight = (el?: HTMLTextAreaElement | null) => {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        const remaining = 5 - (files.length + existingMedia.length);
        const toAdd = acceptedFiles.slice(0, Math.max(0, remaining));
        const extras = acceptedFiles.slice(toAdd.length);

        const mappedToAdd = toAdd.map(file => {
            const f = file as FileWithPreview;
            f.preview = URL.createObjectURL(file);
            return f;
        });

        setFiles(prev => [...prev, ...mappedToAdd]);

        const extraRejections: FileRejection[] = extras.map(file => ({
            file,
            errors: [{ code: 'too-many-files', message: 'Maximum of 5 files allowed' }]
        }));

        setRejections([...rejectedFiles, ...extraRejections]);
    }, [files, existingMedia]);

    const {
        getRootProps,
        getInputProps,
        isDragActive,
    } = useDropzone({
        onDrop,
        accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/webp': ['.webp'],
            'image/gif': ['.gif'],
            'video/mp4': ['.mp4'],
            'video/webm': ['.webm'],
        },
    });

    const removeFile = (index: number) => {
        setFiles(prev => {
            const newFiles = prev.filter((_, i) => i !== index);
            URL.revokeObjectURL(prev[index].preview);
            return newFiles;
        });
    };

    const removeExisting = (index: number) => {
        const media = existingMedia[index];
        setDeletedMediaIds(prev => [...prev, media.id]);
        setExistingMedia(prev => prev.filter((_, i) => i !== index));
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTitle(e.target.value);
        adjustHeight(titleRef.current);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        adjustHeight(contentRef.current);
    };

    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
    const selectCommunity = (c: CommunityType) => {
        setCommunity(c);
        setDropdownOpen(false);
    };

    useEffect(() => {
        return () => {
            filesRef.current.forEach(file => URL.revokeObjectURL(file.preview));
        };
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!community) return;

        setIsSubmitting(true);
        setCompressionStatus('Preparing...');

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', content);
            formData.append('community_obj', String(community.id));

            deletedMediaIds.forEach((id) => {
                formData.append('deleted_media_files', String(id));
            });

            await processAndAppendFiles(files, formData, setCompressionStatus);

            setCompressionStatus('Uploading...');

            const response = await api.patch(`/posts/${slug}/`, formData);
            const updatedPost = response.data;

            setTitle('');
            setContent('');
            setCommunity(null);
            setFiles([]);
            setExistingMedia([]);
            setDeletedMediaIds([]);
            adjustHeight(titleRef.current);
            adjustHeight(contentRef.current);
            setCompressionStatus('');

            const postSlug = updatedPost?.slug || slug;
            router.push(`/${postSlug}`);

        } catch (err: any) {
            console.error('Error updating post: ', err.message);
        } finally {
            setIsSubmitting(false);
            setCompressionStatus('');
        }
    };

    const filteredCommunities = communities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isTitleValid = title.trim().length >= 5;
    const canSubmit = isTitleValid && community !== null;

    return (
        <div className='flex'>
            <div className="flex-[5] bg-white dark:bg-[var(--background)] flex sm:mt-[30px] md:mt-[60px] justify-center p-4">
                <div className="bg-white dark:bg-[var(--background)] w-full max-w-2xl rounded-2xl p-6">
                    <h1 className="text-2xl font-semibold mb-4 text-gray-200 dark:text-gray-300">Edit post</h1>
                    <div className="relative" ref={dropdownContainerRef}>
                        <button
                            type="button"
                            onClick={toggleDropdown}
                            className="flex items-center justify-between w-full max-w-xs cursor-pointer rounded-2xl border dark:border-gray-600 px-4 py-3 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                            <div className="flex items-center">
                                {community ? (
                                    <>
                                        <Image
                                            src={community.icon}
                                            alt={`${community.name} icon`}
                                            width={24}
                                            height={24}
                                            className="w-6 h-6 mr-3 rounded-full"
                                        />
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{community.name}</span>
                                    </>
                                ) : (
                                    <span className="text-gray-300">Select a community</span>
                                )}
                            </div>
                            <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute z-10 mt-2 w-full max-w-xs bg-white dark:bg-zinc-800 border dark:border-gray-600 rounded-lg shadow-xl">
                                <div className="p-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Find a community..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <ul ref={dropdownRef} className="max-h-60 overflow-auto">
                                    {filteredCommunities.length > 0 ? (
                                        filteredCommunities.map((c) => (
                                            <li
                                                key={c.id}
                                                onClick={() => selectCommunity(c)}
                                                className="flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
                                            >
                                                <Image
                                                    src={c.icon}
                                                    alt={`${c.name} icon`}
                                                    width={32}
                                                    height={32}
                                                    className="w-8 h-8 mr-3 rounded-full"
                                                />
                                                <span className="font-medium text-gray-800 dark:text-gray-200">n/{c.name}</span>
                                            </li>
                                        ))
                                    ) : !communitiesLoading && (
                                        <li className="px-4 py-3 text-center text-gray-500">
                                            Communities not found.
                                        </li>
                                    )}
                                    {communitiesLoading && (
                                        <li className="flex justify-center items-center p-4">
                                            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div role="tablist" className="flex border-b dark:border-gray-400 mb-6 mt-3">
                        {['TEXT', 'MEDIA'].map(tab => (
                            <button
                                key={tab}
                                role="tab"
                                aria-selected={activeTab === tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`cursor-pointer flex px-6 py-2 -mb-px font-medium ${activeTab === tab
                                    ? 'border-b-2 border-blue-500 text-gray-300'
                                    : 'text-gray-500'
                                    }`}
                            >
                                {tab === 'TEXT' ? <Type className="w-5 h-5 mr-2" /> : <ImageIcon className="w-5 h-5 mr-2" />}
                                {tab === 'TEXT' ? 'Text' : 'Media'}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {activeTab === 'TEXT' ? (
                            <>
                                <div>
                                    <div className="relative mt-1">
                                        <textarea
                                            id="title"
                                            ref={titleRef}
                                            value={title}
                                            onChange={handleTitleChange}
                                            rows={1}
                                            placeholder=" "
                                            maxLength={300}
                                            className="peer block w-full rounded-2xl border dark:border-[var(--border)] p-4 pt-5 resize-none overflow-hidden bg-transparent "
                                            required
                                            autoComplete='off'
                                        />
                                        <label
                                            htmlFor="title"
                                            className="absolute left-4 transition-all duration-200 pointer-events-none
                                    top-2 text-xs text-gray-200 dark:text-gray-400
                                    peer-placeholder-shown:top-4 peer-placeholder-shown:text-lg
                                    peer-focus:top-2 peer-focus:text-xs"
                                        >
                                            Title*
                                        </label>
                                    </div>
                                    <div className="flex justify-end mr-2 mt-3 ">
                                        <p className="text-xs text-gray-300">{title.length}/300</p>
                                    </div>
                                </div>

                                <div>
                                    <div className="relative mt-1">
                                        <textarea
                                            id="content"
                                            ref={contentRef}
                                            value={content}
                                            onChange={handleContentChange}
                                            placeholder=" "
                                            rows={4}
                                            maxLength={600}
                                            className="peer block w-full rounded-2xl border dark:border-[var(--border)] p-4 pt-6 resize-none overflow-hidden bg-transparent"
                                            autoComplete='off'

                                        />
                                        <label
                                            htmlFor="content"
                                            className="absolute left-4 transition-all duration-200 pointer-events-none
                                    top-2 text-xs text-gray-200 dark:text-gray-400
                                    peer-placeholder-shown:top-4 peer-placeholder-shown:text-lg
                                    peer-focus:top-2 peer-focus:text-xs"
                                        >
                                            Body text (optional)
                                        </label>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div
                                    {...getRootProps()}
                                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 h-48 rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    <input {...getInputProps()} />
                                    <Upload className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" />
                                    <p className="text-gray-600 dark:text-gray-300 font-medium">{isDragActive ? 'Drop files here...' : "Drag 'n' drop media here, or click to select"}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Supported: PNG, JPG, WEBP, GIF, MP4, WEBM. Max 5 files.</p>
                                </div>
                                {(existingMedia.length > 0 || files.length > 0) && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                                        {existingMedia.map((media, idx) => (
                                            <div key={`existing-${media.id}`} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 shadow-md">
                                                {media.type == 'image' ? (
                                                    <img src={media.preview} alt="Existing media" className="w-full h-full object-cover" />
                                                ) : (
                                                    <video src={media.preview} controls className="w-full h-full object-cover" />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeExisting(idx)}
                                                    className="cursor-pointer absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {files.map((file, idx) => (
                                            <div key={`new-${idx}`} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 shadow-md">
                                                {file.type.startsWith('image') ? (
                                                    <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <video src={file.preview} controls className="w-full h-full object-cover" />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(idx)}
                                                    className="cursor-pointer absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {rejections.length > 0 && (
                                    <aside className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                        <h4 className="font-medium text-red-600 dark:text-red-400">Rejected files</h4>
                                        <ul className="list-disc ml-5 text-sm text-red-500 dark:text-red-300">
                                            {rejections.map(({ file, errors }: FileRejection, i) => (
                                                <li key={i}>
                                                    {file.name} - {file.size} bytes
                                                    <ul className="ml-5 list-disc">
                                                        {errors.map((e, ei) => (
                                                            <li key={ei}>{e.message}</li>
                                                        ))}
                                                    </ul>
                                                </li>
                                            ))}
                                        </ul>
                                    </aside>
                                )}
                            </>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={!canSubmit || isSubmitting}
                                className={`ml-4 px-4 py-2 font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 
                            ${canSubmit
                                        ? 'cursor-pointer bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            >
                                {isSubmitting ? (compressionStatus || 'Updating...') : 'Update Post'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
            <div className="w-[250px] hidden xl:block"></div>
        </div>
    );
}