'use client';

import { Shield, Palette, Settings } from 'lucide-react';

interface CommunityEditSidebarProps {
    activeSection: string;
    onSelectSection: (section: string) => void;
}

const sidebarItems = [
    { id: 'general', label: 'General', icon: <Settings size={20} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
    { id: 'privacy', label: 'Privacy & Type', icon: <Shield size={20} /> },
];

export default function CommunityEditSidebar({ activeSection, onSelectSection }: CommunityEditSidebarProps) {
    return (
        <aside className="w-64 flex-shrink-0">
            <div className="sticky top-24">
                <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-4 mb-3">Settings</h2>
                <nav>
                    <ul className="space-y-1">
                        {sidebarItems.map((item) => (
                            <li key={item.id}>
                                <button
                                    onClick={() => onSelectSection(item.id)}
                                    className={`cursor-pointer flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-left text-sm font-medium transition-colors ${activeSection === item.id
                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100'
                                        }`}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </aside>
    );
}