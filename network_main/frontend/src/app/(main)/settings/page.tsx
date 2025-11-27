'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getUserInfo } from '@/services/auth';
import { User } from '@/services/types';
import { api } from '@/services/auth';
import { useAuthStore } from '@/zustand_store/authStore';
import { User as UserIcon, UserCheck, Calendar, Edit3, Save, X, Upload, CalendarX, FileText, Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        description: '',
        birth_date: '',
        gender: '',
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');

    const authStore = useAuthStore();

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            setIsLoading(true);
            const data = await getUserInfo();
            setUserInfo(data);
            setFormData({
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                username: data.username,
                description: data.description,
                birth_date: data.birth_date || '',
                gender: data.gender,
            });
            setAvatarPreview(data.avatar);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        }
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            setAvatarPreview(userInfo?.avatar || '');
        }
    };

    const handleSave = async () => {
        if (!userInfo) return;
        setIsSaving(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('first_name', formData.first_name);
            formDataToSend.append('last_name', formData.last_name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('username', formData.username);
            formDataToSend.append('description', formData.description);
            if (formData.birth_date) formDataToSend.append('birth_date', formData.birth_date);
            formDataToSend.append('gender', formData.gender);
            if (avatarFile) formDataToSend.append('avatar', avatarFile);

            const response = await api.put<User>('/users/user-info/', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
            });

            const updatedData = response.data;
            setUserInfo(updatedData);
            setIsEditing(false);

            authStore.login(updatedData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while saving');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setAvatarFile(null);
        setAvatarPreview(userInfo?.avatar || '');
        setFormData({
            first_name: userInfo?.first_name || '',
            last_name: userInfo?.last_name || '',
            email: userInfo?.email || '',
            username: userInfo?.username || '',
            description: userInfo?.description || '',
            birth_date: userInfo?.birth_date || '',
            gender: userInfo?.gender || '',
        });
        setError(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[var(--background)] flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                    <p className="text-zinc-600 dark:text-zinc-400">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (!userInfo) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[var(--background)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-zinc-600 dark:text-zinc-400">Unable to load user info.</p>
                    <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-15 min-h-screen bg-gray-50 py-8 dark:bg-[var(--background)]">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Settings</h1>
                        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Manage your account information</p>
                    </div>
                    {!isEditing ? (
                        <button
                            onClick={handleEditToggle}
                            className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150"
                        >
                            <Edit3 size={18} />
                            <span>Edit Info</span>
                        </button>
                    ) : (
                        <div className="flex space-x-2">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors duration-150"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                            <button
                                onClick={handleCancel}
                                className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-300 text-zinc-700 rounded-lg hover:bg-gray-400 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 transition-colors duration-150"
                            >
                                <X size={18} />
                                <span>Cancel</span>
                            </button>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                        {error}
                    </div>
                )}

                <div className="bg-white dark:bg-[var(--background)] rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-zinc-700">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center">
                            <UserIcon size={20} className="mr-2 text-zinc-500" />
                            Profile Picture
                        </h2>
                        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                            <div className="relative">
                                <div className='w-30 h-30'>
                                    <Image
                                        src={avatarPreview || '/default-avatar.png'}
                                        alt="Avatar"
                                        fill
                                        className="rounded-full object-cover border-4 border-gray-200 dark:border-zinc-700"
                                    />
                                </div>
                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors duration-150">
                                        <Upload size={16} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Upload a new photo (optional)</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6 flex items-center">
                            <UserCheck size={20} className="mr-2 text-zinc-500" />
                            Basic Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-300 disabled:cursor-not-allowed dark:bg-zinc-700 dark:border-zinc-600 disabled:text-black dark:text-white dark:placeholder-zinc-400"
                                    placeholder="Username"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-300 disabled:cursor-not-allowed dark:bg-zinc-700 dark:border-zinc-600 disabled:text-black dark:text-white dark:placeholder-zinc-400"
                                    placeholder="Email"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-300 disabled:cursor-not-allowed dark:bg-zinc-700 dark:border-zinc-600 disabled:text-black dark:text-white dark:placeholder-zinc-400"
                                    placeholder="First name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-300 disabled:cursor-not-allowed dark:bg-zinc-700 dark:border-zinc-600 disabled:text-black dark:text-white dark:placeholder-zinc-400"
                                    placeholder="Last name"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-200 dark:border-zinc-700">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6 flex items-center">
                            <FileText size={20} className="mr-2 text-zinc-500" />
                            Additional Information
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-300 disabled:cursor-not-allowed dark:bg-zinc-700 dark:border-zinc-600 disabled:placeholder-zinc-400 disabled:text-black dark:text-white dark:placeholder-zinc-400"
                                    placeholder="Tell us about yourself"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Birth Date
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="birth_date"
                                            value={formData.birth_date}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-300 disabled:cursor-not-allowed dark:bg-zinc-700 dark:border-zinc-600 disabled:text-black dark:text-white dark:placeholder-zinc-400 pr-10"
                                        />
                                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-300 disabled:cursor-not-allowed dark:bg-zinc-700 dark:border-zinc-600 disabled:text-black dark:text-white"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-zinc-700">
                            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">Account Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                                <div className="flex items-center">
                                    <CalendarX size={16} className="mr-2 text-zinc-400 flex-shrink-0" />
                                    <span className="text-zinc-600 dark:text-zinc-400">Joined: {new Date(userInfo.date_joined).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}