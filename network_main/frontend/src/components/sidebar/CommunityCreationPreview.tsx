import React from 'react';

interface CommunityCreationPreviewProps {
    name: string;
    description: string;
    iconPreview: string | null;
    bannerPreview: string | null;
}

export default function CommunityCreationPreview({ name, description, iconPreview, bannerPreview }: CommunityCreationPreviewProps) {
    return (
        <div className="w-full bg-white dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 flex flex-col">
            <div className="h-10 bg-zinc-200 dark:bg-zinc-700 bg-cover bg-center" style={{ backgroundImage: `url(${bannerPreview})` }}></div>
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex items-center space-x-3 mb-4 -mt-12">
                    <div className="w-16 h-16 bg-zinc-300 dark:bg-zinc-600 rounded-full flex-shrink-0 border-4 border-white dark:border-zinc-800 bg-cover bg-center"
                        style={{ backgroundImage: `url(${iconPreview})` }}
                    />
                    <div className="pt-8">
                        <h3 className="font-bold text-zinc-900 dark:text-white break-all">
                            {name ? `n/${name}` : "n/CommunityName"}
                        </h3>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                            10 members · 3 online
                        </p>
                    </div>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 break-words flex-grow">
                    {description || "This is where the description for your community will appear. Write something engaging for new members!"}
                </p>

                <div className="flex space-x-2 mt-auto">
                    <button className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold cursor-not-allowed">
                        Join
                    </button>
                    <button className="bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 p-2 rounded-full cursor-not-allowed">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}