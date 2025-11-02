export type Media = {
    id: number;
    file: string;
    media_type: 'image' | 'video';
    aspect_ratio?: string;
    file_url: string;
    uploaded_at: string;
};

export type Post = {
    id: number;
    title: string;
    slug: string;
    description: string;
    author: string;
    author_icon: string;
    author_slug: string;
    created: string;
    updated: string;
    sum_rating: number;
    user_vote: number;
    comment_count: number;
    media_data: any[];
    community_id: number;
    community_name: string;
    community_slug: string;
    community_icon: string;
    is_creator: boolean;
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
    online_members: number;
    current_user_roles: string[];
    current_user_permissions: string[];
};

export interface Category {
    id: number | string;
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
    slug: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar: string;
    description: string;
    birth_date: string;
    gender: string;
    date_joined: string;
};