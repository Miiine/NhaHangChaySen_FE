import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        user: JSON.parse(localStorage.getItem("user")) || null,
        token: localStorage.getItem("token") || null,
    }),
    actions: {
        login(data) {
            console.log("Data from login:", data);

            this.user = data.user;
            this.token = data.token;
            localStorage.setItem("token", data.token);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("user", JSON.stringify(data.user));

            console.log("User after login stored in Pinia:", this.user);
            console.log(
                "User from localStorage:",
                JSON.parse(localStorage.getItem("user"))
            );
        },
        logout() {
            this.user = null;
            this.token = null;
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
        },
    },
});
