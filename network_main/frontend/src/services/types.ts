export type Post = {
    id: number;
    title: string;
    slug: string;
    description: string;
    status: 'PB' | 'DR';
    author: string;
    community_name: string;
    created: string;
    updated: string;
    sum_rating: number;
    media_data: any[];
};