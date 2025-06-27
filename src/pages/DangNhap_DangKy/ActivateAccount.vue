<script setup>
import { ref, onMounted } from "vue";
import api from "@/services/axios";
import { useRoute, useRouter } from "vue-router";

const message = ref("");
const route = useRoute();
const router = useRouter();

onMounted(async () => {
    const token = route.query.token;

    try {
        const res = await api.get(`/auth/activate-account?token=${token}`);
        message.value = res.data.message;
    } catch (error) {
        message.value = "Lỗi kích hoạt tài khoản. Vui lòng thử lại!";
    }
});

const goToLogin = () => {
    router.push("/DangNhap");
};
</script>

<template>
    <div class="activation-box">
        <h2>Kích hoạt tài khoản</h2>
        <p v-if="message" class="message-text">{{ message }}</p>
        <button class="login-btn" @click="goToLogin">
            Đến trang đăng nhập
        </button>
    </div>
</template>

<style scoped>
.activation-box {
    max-width: 420px;
    margin: 80px auto;
    padding: 40px 30px;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
    text-align: center;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.activation-box h2 {
    font-size: 2.4rem;
    color: #2c3e50;
    margin-bottom: 20px;
    font-weight: 700;
}

.message-text {
    font-size: 1.3rem;
    color: #34495e;
    margin-bottom: 30px;
    min-height: 48px;
    line-height: 1.4;
}

.login-btn {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 14px 30px;
    border-radius: 30px;
    font-size: 1.2rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
    box-shadow: 0 6px 12px rgba(52, 152, 219, 0.4);
}

.login-btn:hover {
    background-color: #2980b9;
    box-shadow: 0 8px 18px rgba(41, 128, 185, 0.6);
}

/* Responsive */
@media (max-width: 480px) {
    .activation-box {
        margin: 50px 20px;
        padding: 30px 20px;
    }

    .activation-box h2 {
        font-size: 2rem;
    }

    .message-text {
        font-size: 1.1rem;
        margin-bottom: 25px;
    }

    .login-btn {
        width: 100%;
        padding: 12px 0;
        font-size: 1.1rem;
    }
}
</style>
