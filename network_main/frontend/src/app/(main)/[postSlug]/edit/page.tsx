"use client";

import { useState, FormEvent, useRef, useCallback, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { getCommunities, getCommunityBySlug } from '@/services/api';
import { CommunityType, Post } from '@/services/types';
import { useParams, useRouter } from 'next/navigation';
import { ChevronDown, Type, Image as ImageIcon, X, Upload } from 'lucide-react';
import { api } from '@/services/auth';

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
    const [loading, setLoading] = useState<boolean>(false);

    const params = useParams();
    const slug = params.postSlug as string;

    const router = useRouter();

    const titleRef = useRef<HTMLTextAreaElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);

    const [communities, setCommunities] = useState<CommunityType[]>([]);

    const filesRef = useRef<FileWithPreview[]>([]);

    useEffect(() => {
        filesRef.current = files;
    }, [files]);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const response = await getCommunities(1);
                setCommunities(response.results);
            } catch (err: any) {
                console.log(err.message);
            }
        };
        fetchCommunities();
    }, []);

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
                    type: media.mime_type
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
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', content);
            formData.append('community_obj', String(community.id));

            files.forEach((file) => {
                formData.append('media_files', file, file.name);
            });

            deletedMediaIds.forEach((id) => {
                formData.append('deleted_media_ids[]', String(id));
            });

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

            const postSlug = updatedPost?.slug || slug;

            router.push(`/${postSlug}`);

        } catch (err: any) {
            console.error('Error updating post: ', err.message);
        } finally {
            setLoading(false);
        }
    };

    const isTitleValid = title.trim().length >= 5;
    const canSubmit = isTitleValid && community !== null;

    return (
        <div className='flex'>
            <div className="flex-[5] bg-white dark:bg-[var(--background)] flex sm:mt-[30px] md:mt-[60px] justify-center p-4">
                <div className="bg-white dark:bg-[var(--background)] w-full max-w-2xl rounded-2xl p-6">
                    <h1 className="text-2xl font-semibold mb-4 text-gray-200 dark:text-gray-300">Edit post</h1>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={toggleDropdown}
                            className="flex cursor-pointer peer block text-left rounded-3xl border dark:border-[var(--border)] px-4 py-3 bg-transparent"
                        >
                            {community ? (
                                <>
                                    <img
                                        src={community.icon}
                                        alt={`${community.name} icon`}
                                        className="w-5 h-5 mr-2 rounded-full"
                                    />
                                    <span>{community.name}</span>
                                </>
                            ) : (
                                <span>Select a community</span>
                            )}
                            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                        {dropdownOpen && (
                            <ul className="ml-3 absolute z-10 mt-1 bg-white dark:bg-gray-600 border dark:border-[var(--border)] rounded-2xl max-h-60 overflow-auto shadow-lg">
                                {communities.map((c) => (
                                    <li
                                        key={c.id}
                                        onClick={() => selectCommunity(c)}
                                        className="flex items-center px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                    >
                                        <img
                                            src={c.icon}
                                            alt={`${c.name} icon`}
                                            className="w-6 h-6 mr-2 rounded-full"
                                        />
                                        <span>n/{c.name}</span>
                                    </li>
                                ))}
                            </ul>
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
                                                {media.type.startsWith('image') ? (
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
                                type="button"
                                disabled={!canSubmit}
                                className={`px-4 py-2 font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 
                            ${canSubmit
                                        ? 'cursor-pointer bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            >
                                Save Draft(Not working yet)
                            </button>
                            <button
                                type="submit"
                                disabled={!canSubmit || loading}
                                className={`ml-4 px-4 py-2 font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 
                            ${canSubmit
                                        ? 'cursor-pointer bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            >
                                {loading ? 'Updating...' : 'Update Post'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
            <div className="w-[250px] hidden xl:block"></div>
        </div>
    );
}