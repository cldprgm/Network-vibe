'use client';

import React, { useState } from 'react';
import { Dialog, DialogTitle, Description, DialogPanel } from '@headlessui/react';
import { CommunityType } from '@/services/types';
import CommunityCreationPreview from './CommunityCreationPreview';
import Link from 'next/link';

interface CreateCommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (community: Omit<CommunityType, 'id' | 'slug' | 'creator' | 'created' | 'updated' | 'status' | 'is_member' | 'members_count'>) => void;
}

const steps = [
    "Tell us about your community",
    "Add icon and banner",
    "Add topics",
    "Final Touches",
];

export default function CreateCommunityModal({ isOpen, onClose, onCreate }: CreateCommunityModalProps) {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [isNsfw, setIsNsfw] = useState(false);
    const [icon, setIcon] = useState<File | null>(null);
    const [banner, setBanner] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIcon(file);
            setIconPreview(URL.createObjectURL(file));
        }
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setBanner(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        // file loading logic
        onCreate({
            name,
            description,
            visibility: category,
            banner: banner ? banner.name : '', // url after loading
            icon: icon ? icon.name : '', // url after loading
            is_nsfw: isNsfw
        });
        onClose();
    };

    const nextStep = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

    // Validation logic
    let isCurrentStepValid = false;
    switch (step) {
        case 0:
            isCurrentStepValid = name.trim() !== '' && description.trim() !== '';
            break;
        case 1:
            isCurrentStepValid = true; // add verification
            break;
        case 2:
            isCurrentStepValid = category !== '';
            break;
        case 3:
            isCurrentStepValid = true;
            break;
        default:
            isCurrentStepValid = false;
    }

    const isFormValid = name.trim() !== '' && description.trim() !== '' && category !== '';


    return (
        <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
            <div className="flex items-center justify-center min-h-screen p-4">
                <DialogPanel className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-4xl mx-auto transition-all duration-300 ease-in-out">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
                        <div className="flex justify-between items-start">
                            <DialogTitle className="text-2xl font-bold text-zinc-900 dark:text-white">
                                Create a community
                            </DialogTitle>
                            <button onClick={onClose} aria-label="Close" className="cursor-pointer text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <Description className="text-zinc-600 dark:text-zinc-400 mt-1">Step {step + 1} of {steps.length}: {steps[step]}</Description>
                    </div>

                    <div className="flex p-6 min-h-[350px]">
                        {/* Left Column: Form */}
                        <div className="w-3/5 pr-8 space-y-6">
                            {step === 0 && (
                                <>
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                            Name
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            required
                                            maxLength={21}
                                            placeholder="AwesomeGamers"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <p className="text-xs text-zinc-500 mt-1">{21 - name.length} characters remaining</p>
                                    </div>
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            id="description"
                                            required
                                            rows={4}
                                            placeholder="A brief description of your community"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </>
                            )}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="icon" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                            Icon
                                        </label>
                                        <input
                                            id="icon"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleIconChange}
                                            className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="banner" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                            Banner
                                        </label>
                                        <input
                                            id="banner"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleBannerChange}
                                            className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        />
                                    </div>
                                </div>
                            )}
                            {step === 2 && (
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Category
                                    </label>
                                    <select
                                        id="category"
                                        required
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Select a category</option>
                                        <option value="tech">Tech</option>
                                        <option value="gaming">Gaming</option>
                                        <option value="art">Art</option>
                                        <option value="music">Music</option>
                                    </select>
                                </div>
                            )}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            id="is_nsfw"
                                            type="checkbox"
                                            checked={isNsfw}
                                            onChange={(e) => setIsNsfw(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="is_nsfw" className="cursor-pointer ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                            NSFW (18+ content)
                                        </label>
                                    </div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        By continuing, you agree to our <Link href="#" className="text-indigo-500 hover:underline">Network Rules</Link>.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Preview */}
                        <div className="w-2/5 pl-8 border-l border-zinc-200 dark:border-zinc-700">
                            <CommunityCreationPreview
                                name={name}
                                description={description}
                                iconPreview={iconPreview}
                                bannerPreview={bannerPreview}
                            />
                        </div>
                    </div>

                    {/* navigation buttons */}
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-b-2xl border-t border-zinc-200 dark:border-zinc-700">
                        <div className="flex justify-end items-center">
                            <div className="flex items-center space-x-4">
                                {step > 0 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="cursor-pointer px-4 py-2 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                                    >
                                        Back
                                    </button>
                                )}
                                {step < steps.length - 1 ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        disabled={!isCurrentStepValid}
                                        className="cursor-pointer px-6 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:dark:bg-gray-800 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        onClick={handleSubmit}
                                        disabled={!isFormValid}
                                        className="cursor-pointer px-6 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:dark:bg-indigo-800 disabled:cursor-not-allowed"
                                    >
                                        Create Community
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}