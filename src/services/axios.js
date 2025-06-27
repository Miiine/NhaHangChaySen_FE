import axios from "axios";
import Swal from "sweetalert2";

import { useAuthStore } from "@/stores/auth.js";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

//Request interceptor: Gắn token tự động vào header của tất cả các request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

//Response interceptor: Tự động refresh token khi hết hạn
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response &&
            error.response.status === 403 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
                try {
                    const res = await api.post("/auth/refresh", {
                        refreshToken,
                    });
                    localStorage.setItem("token", res.data.token);
                    originalRequest.headers[
                        "Authorization"
                    ] = `Bearer ${res.data.token}`;
                    return api(originalRequest);
                } catch (err) {
                    const auth = useAuthStore();
                    auth.logout();
                    Swal.fire({
                        icon: "error",
                        title: "Phiên đăng nhập hết hạn!",
                        text: "Vui lòng đăng nhập lại.",
                        confirmButtonText: "OK",
                    }).then(() => {
                        window.location.href = "/DangNhap";
                    });
                }
            } else {
                const auth = useAuthStore();
                auth.logout();
                Swal.fire({
                    icon: "error",
                    title: "Bạn chưa đăng nhập!",
                    text: "Vui lòng đăng nhập để tiếp tục.",
                    confirmButtonText: "OK",
                }).then(() => {
                    window.location.href = "/DangNhap";
                });
            }
        }
        return Promise.reject(error);
    }
);

export default api;
