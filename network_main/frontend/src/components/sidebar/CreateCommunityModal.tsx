'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, Description, DialogPanel } from '@headlessui/react';
import { CommunityType, Category, Subcategory } from '@/services/types';
import { getCategoriesTree } from '@/services/api';
import CommunityCreationPreview from './CommunityCreationPreview';
import { Eye, Lock, Shield } from 'lucide-react';
import useDebounce from './hooks/useDebounce';
import axios from 'axios';
import Link from 'next/link';
import '@/styles/CustomScrollbar.css'

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;


interface CreateCommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (community: Omit<CommunityType, 'id' | 'slug' | 'creator' | 'created' | 'updated' | 'status' | 'is_member' | 'members_count'> & { subcategories: number[] }) => void;
}

const steps = [
    "Tell us about your community",
    "Add icon and banner",
    "Add up to 3 topics to help interested users find your community.",
    "Final Touches",
];

type CommunityVisibility = 'public' | 'restricted' | 'private';

const VisibilityOption = ({ type, title, description, icon, selected, onClick }: {
    type: CommunityVisibility;
    title: string;
    description: string;
    icon: React.ReactNode;
    selected: boolean;
    onClick: (type: CommunityVisibility) => void;
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

export default function CreateCommunityModal({ isOpen, onClose, onCreate }: CreateCommunityModalProps) {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedSubcategories, setSelectedSubcategories] = useState<number[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isNsfw, setIsNsfw] = useState(false);
    const [visibility, setVisibility] = useState<CommunityVisibility>('public');
    const [icon, setIcon] = useState<File | null>(null);
    const [banner, setBanner] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    const [isNameChecking, setIsNameChecking] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const debouncedName = useDebounce(name, 1000);

    useEffect(() => {
        const checkName = async () => {
            if (debouncedName.trim() === '') {
                setNameError(null);
                return;
            }
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
        };

        checkName();
    }, [debouncedName]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategoriesTree();
                if (data && data.results) {
                    setCategories(data.results);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
                setCategories([]);
            }
        };

        if (isOpen && step === 2) {
            fetchCategories();
        }
    }, [isOpen, step]);

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

    const handleSubcategoryChange = (subcategoryId: number) => {
        setSelectedSubcategories(prevSelected => {
            const isSelected = prevSelected.includes(subcategoryId);
            if (isSelected) {
                return prevSelected.filter(id => id !== subcategoryId);
            } else {
                if (prevSelected.length < 3) {
                    return [...prevSelected, subcategoryId];
                }
                return prevSelected;
            }
        });
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        onCreate({
            name,
            description,
            visibility: visibility,
            banner: banner ? banner.name : '',
            icon: icon ? icon.name : '',
            is_nsfw: isNsfw,
            subcategories: selectedSubcategories,
        });
        onClose();
    };

    const nextStep = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

    // Validation logic
    let isCurrentStepValid = false;
    switch (step) {
        case 0:
            isCurrentStepValid = name.trim() !== '' && description.trim() !== '' && !isNameChecking && !nameError;
            break;
        case 1:
            isCurrentStepValid = true;
            break;
        case 2:
            isCurrentStepValid = selectedSubcategories.length > 0 && selectedSubcategories.length <= 3;
            break;
        case 3:
            isCurrentStepValid = true;
            break;
        default:
            isCurrentStepValid = false;
    }

    const isFormValid = name.trim() !== '' && description.trim() !== '' && selectedSubcategories.length > 0 && !nameError && !isNameChecking;


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
                        <div className="w-3/5 pr-1 space-y-6">
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
                                            className={`w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border rounded-lg focus:ring-2 
                                                ${nameError ? 'border-red-500 focus:ring-red-500' : 'border-zinc-300 dark:border-zinc-700 focus:ring-indigo-500'}`}
                                        />
                                        <div className="text-xs mt-1 h-4">
                                            {nameError && <p className="text-red-500">{nameError}</p>}
                                            <p className="text-zinc-500">{21 - name.length} characters remaining</p>
                                        </div>
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
                                    {selectedSubcategories.length > 0 && (
                                        <div className="mb-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Selected topics:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {categories.flatMap(cat => cat.subcategories)
                                                    .filter(sub => selectedSubcategories.includes(sub.id))
                                                    .map(subcategory => (
                                                        <div key={`selected-${subcategory.id}`} className="flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                                                            <span className="text-sm text-indigo-800 dark:text-indigo-200">{subcategory.title}</span>
                                                            <button onClick={() => handleSubcategoryChange(subcategory.id)} className="cursor-pointer text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    )}
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Topics (Select 1-3)
                                    </label>
                                    <div className="space-y-4 max-h-90 overflow-y-auto pr-2 custom-scrollbar">
                                        {categories.map((category) => (
                                            <div key={category.id}>
                                                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">{category.title}</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {category.subcategories.map((subcategory) => {
                                                        const isSelected = selectedSubcategories.includes(subcategory.id);
                                                        const isDisabled = !isSelected && selectedSubcategories.length >= 3;

                                                        return (
                                                            <button
                                                                key={subcategory.id}
                                                                type="button"
                                                                onClick={() => handleSubcategoryChange(subcategory.id)}
                                                                disabled={isDisabled}
                                                                className={`cursor-pointer px-4 py-2 rounded-full border text-sm font-medium transition-colors
                                        ${isSelected
                                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                        : 'bg-transparent border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                                                    }
                                        ${isDisabled ? 'cursor-pointer opacity-50 cursor-not-allowed' : ''}
                                    `}
                                                            >
                                                                {subcategory.title}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-4">{selectedSubcategories.length} / 3 selected</p>
                                </div>
                            )}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Community type</h3>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Choose who can see and participate in your community.</p>

                                        <div className="space-y-3">
                                            <VisibilityOption
                                                type="public"
                                                title="Public"
                                                description="Anyone can view, post, and comment in this community."
                                                icon={<Eye />}
                                                selected={visibility === 'public'}
                                                onClick={setVisibility}
                                            />
                                            <VisibilityOption
                                                type="restricted"
                                                title="Restricted"
                                                description="Anyone can view this community, but only approved users can post."
                                                icon={<Shield />}
                                                selected={visibility === 'restricted'}
                                                onClick={setVisibility}
                                            />
                                            <VisibilityOption
                                                type="private"
                                                title="Private"
                                                description="Only approved users can view and submit to this community."
                                                icon={<Lock />}
                                                selected={visibility === 'private'}
                                                onClick={setVisibility}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
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
                            {step === steps.length - 1 && (
                                <p className="mr-auto text-sm text-zinc-500 dark:text-zinc-400">
                                    By continuing, you agree to our <Link href="#" className="text-indigo-500 hover:underline">Network Rules</Link>.
                                </p>
                            )}
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