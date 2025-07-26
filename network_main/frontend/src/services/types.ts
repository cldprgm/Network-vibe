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
    created: string;
    updated: string;
    sum_rating: number;
    user_vote: number;
    comment_count: number;
    media_data: any[];
    community_id: number;
    community_name: string;
    community_icon: string;
};

export type CommentType = {
    id: number;
    author: string;
    content: string;
    time_created: string;
    time_updated: string;
    sum_rating: number;
    user_vote: number;
    replies_count: number;
    children: CommentType[];
};

export type CommunityType = {
    id: number;
    slug: string;
    name: string;
    creator: string;
    description: string;
    banner: string;
    icon: string;
    banner_upload: string;
    icon_upload: string;
    is_nsfw: boolean;
    visibility: string;
    created: string;
    updated: string;
    status: string;
    is_member: boolean;
    members_count: number;
};

export interface Category {
    id: number;
    title: string;
    slug: string;
    subcategories: Subcategory[];
}

export interface Subcategory {
    id: number;
    title: string;
    slug: string;
    communities: CommunityType[];
    nextPage: string | null;
}

export type User = {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar?: string;
    description: string;
};