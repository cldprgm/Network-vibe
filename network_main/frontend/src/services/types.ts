export type Media = {
    id: number;
    file: string;
    media_type: 'image' | 'video';
    aspect_ratio?: string;
    file_url?: string;
    uploaded_at: string;
};

export type Post = {
    id: number;
    title: string;
    slug: string;
    description: string;
    author: string;
    community_name: string;
    created: string;
    updated: string;
    sum_rating: number;
    user_vote: number;
    media_data: any[];
};

export type User = {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar?: string;
    description: string;
};