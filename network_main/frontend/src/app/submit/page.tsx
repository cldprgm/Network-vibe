"use client";

import { useState, FormEvent, useRef, useCallback, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Metadata } from 'next';
import { getCommunities } from '@/services/api';
import { Community, Post } from '@/services/types';
import { apiCreatePost } from '@/services/api';

interface FileWithPreview extends File {
    preview: string;
}

export default function CreatePost() {
    const [activeTab, setActiveTab] = useState<'TEXT' | 'MEDIA'>('TEXT');
    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [community, setCommunity] = useState<Community | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const titleRef = useRef<HTMLTextAreaElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);

    const [communities, setCommunities] = useState<Community[]>([]);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const data: Community[] = await getCommunities();
                setCommunities(data);
            } catch (err: any) {
                console.log(err.message);
            }
        };
        fetchCommunities();
    }, []);

    const adjustHeight = (el?: HTMLTextAreaElement | null) => {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };


    const onDrop = useCallback((acceptedFiles: File[]) => {
        const mapped = acceptedFiles.map(file => {
            const f = file as FileWithPreview;
            f.preview = URL.createObjectURL(file);
            return f;
        });
        setFiles(prev => [...prev, ...mapped]);
    }, []);

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        fileRejections,
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

    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTitle(e.target.value);
        adjustHeight(titleRef.current);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        adjustHeight(contentRef.current);
    };

    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
    const selectCommunity = (c: Community) => {
        setCommunity(c);
        setDropdownOpen(false);
    };

    useEffect(() => () => {
        files.forEach(file => URL.revokeObjectURL(file.preview));
    }, [files]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!community) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', content);
            formData.append('community_obj', community.id);

            files.forEach((file, idx) => {
                formData.append('media_files', file, file.name)
            });

            const newPost = await apiCreatePost(formData);
            console.log('Created post:', newPost);
            setTitle('');
            setContent('');
            setCommunity(null);
            setFiles([]);
            adjustHeight(titleRef.current);
            adjustHeight(contentRef.current);

        } catch (err: any) {
            console.error('Error creating post: ', err.message)
        } finally {
            setLoading(false);
        }


    };

    const canSubmit = title.trim().length > 0;

    return (
        <div className="bg-white dark:bg-[var(--background)] flex sm:mt-[30px] md:mt-[60px] justify-center p-4">
            <div className="bg-white dark:bg-[var(--background)] w-full max-w-2xl rounded-2xl p-6">
                <h1 className="text-2xl font-semibold mb-4 text-gray-200 dark:text-gray-300">Create post</h1>
                <div className="relative">
                    <button
                        type="button"
                        onClick={toggleDropdown}
                        className="flex cursor-pointer peer block text-left rounded-3xl border dark:border-[var(--border)] p-3 bg-transparent"
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
                        <svg className="ml-2" fill="currentColor" height="20" viewBox="0 0 20 16" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M10 13.02a.755.755 0 0 1-.53-.22L4.912 8.242A.771.771 0 0 1 4.93 7.2a.771.771 0 0 1 1.042-.018L10 11.209l4.028-4.027a.771.771 0 0 1 1.042.018.771.771 0 0 1 .018 1.042L10.53 12.8a.754.754 0 0 1-.53.22Z"></path></svg>
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
                            className={`cursor-pointer px-6 py-2 -mb-px font-medium ${activeTab === tab
                                ? 'border-b-2 border-blue-400 text-gray-300'
                                : 'text-gray-500'
                                }`}
                        >
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
                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 h-48 rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center"
                            >
                                <input {...getInputProps()} />
                                <p>{isDragActive ? 'Drop files here...' : "Drag 'n' drop media here, or click to select"}</p>
                            </div>
                            {files.length > 0 && (
                                <div className="grid grid-cols-3 gap-4">
                                    {files.map((file, idx) => (
                                        <div key={idx} className="relative">
                                            {file.type.startsWith('image') ? (
                                                <img src={file.preview} alt={file.name} className="w-full h-auto rounded" />
                                            ) : (
                                                <video src={file.preview} controls className="w-full h-auto rounded" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {fileRejections.length > 0 && (
                                <aside>
                                    <h4 className="mt-4 font-medium text-red-600">Rejected files</h4>
                                    <ul className="list-disc ml-5 text-sm text-red-500">
                                        {fileRejections.map(({ file, errors }: FileRejection, i) => (
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
                        </>)}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            disabled={!canSubmit}
                            className={`px-4 py-2 font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 
                            ${canSubmit
                                    ? 'cursor-pointer bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                        >
                            Save Draft
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className={`ml-4 px-4 py-2 font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 
                            ${canSubmit
                                    ? 'cursor-pointer bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                        >
                            {loading ? 'Posting...' : 'Submit Post'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
