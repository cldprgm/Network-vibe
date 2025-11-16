import axios, { AxiosResponse } from "axios"
import { User } from "./types";
import { useAuthStore } from "@/zustand_store/authStore";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface RegisterResponse {
    user: User;
}

export interface LoginResponse {
    user: User;
}

export const api = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/users/login/') &&
            !originalRequest.url.includes('/users/refresh/') &&
            !originalRequest.url.includes('/user/verify-email/')
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await api.post('/users/refresh/');
                processQueue(null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                useAuthStore.getState().logout();
                useAuthStore.getState().setShowAuthModal(true);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export const registerUser = async (email: string, username: string, password: string
): Promise<AxiosResponse<RegisterResponse>> => {
    try {
        const response = await api.post<RegisterResponse>(
            '/users/register/',
            { email, username, password },
            { withCredentials: true }
        );
        return response;
    }
    catch (error: any) {
        const status = error?.response?.status;
        const details = error?.response?.data;

        throw new Error(
            `Registration failed${status ? ` (status ${status})` : ''}: ${details?.message || error.message}`
        );
    }
};

export const verifyUserEmail = async (uid: string, token: string): Promise<LoginResponse> => {
    const response = await api.get<LoginResponse>(`/users/verify-email/${uid}/${token}/`);
    return response.data;
};

export const loginUser = async (email: string, password: string): Promise<AxiosResponse<LoginResponse>> => {
    try {
        const response = await api.post<LoginResponse>(
            '/users/login/',
            { email, password },
            { withCredentials: true }
        );
        return response;
    }
    catch (error: any) {
        const status = error?.response?.status;
        const details = error?.response?.data;

        throw new Error(
            `Auth failed${status ? ` (status ${status})` : ''}: ${details?.message || error.message}`
        );
    }
};

export const verifyCode = async (email: string, code: string) => {
    try {
        const response = await api.post(
            '/users/verify/',
            { email, code },
            { withCredentials: true }
        );
        return response;
    }
    catch (e) {
        throw new Error('Code verifying failed!')
    }
};

export const resendCode = async (email: string) => {
    try {
        const response = await api.post(
            '/users/resend/',
            { email },
            { withCredentials: true }
        );
        return response;
    }
    catch (e) {
        throw new Error('Code resending failed!')
    }
};

export const logoutUser = async () => {
    try {
        const response = await api.post(
            '/users/logout/',
            null,
            { withCredentials: true }
        );
        return response;
    }
    catch (e) {
        throw new Error('Logout failed!')
    }
};

export const getUserInfo = async (): Promise<User> => {
    try {
        const response = await api.get<User>(
            '/users/user-info/',
            { withCredentials: true }
        );
        return response.data;
    }
    catch (e) {
        throw new Error('Getting user info failed!')
    }
};

export const getUser = async (slug: string): Promise<User> => {
    try {
        const response = await api.get<User>(
            `/users/${slug}/`,
            { withCredentials: true }
        );
        return response.data;
    }
    catch (e) {
        throw new Error('Getting user failed!')
    }
};
