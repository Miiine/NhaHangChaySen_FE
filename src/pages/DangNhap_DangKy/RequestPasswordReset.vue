<script setup>
import { ref } from "vue";
import Swal from "sweetalert2";
import api from "@/services/axios";
import { useRouter } from "vue-router";
import BaseButton from "@/components/BaseButton.vue";

const email = ref("");
const error = ref("");

const router = useRouter();

const handleSubmit = async () => {
    error.value = "";
    if (!email.value) {
        error.value = "Email không được để trống";
        return;
    }

    try {
        await api.post("/auth/request-password-reset", { email: email.value });
        Swal.fire({
            icon: "success",
            title: "Đã gửi email",
            text: "Vui lòng kiểm tra email để đặt lại mật khẩu.",
        });
        router.push("/DangNhap");
    } catch (err) {
        console.error(
            "Lỗi chi tiết khi gọi request-password-reset:",
            err.response
        );
        error.value =
            err.response?.data?.message ||
            "Lỗi khi gửi yêu cầu đặt lại mật khẩu";
    }
};
</script>

<template>
    <div class="content">
        <div class="login-box">
            <h2 class="title-text">QUÊN MẬT KHẨU</h2>
            <input
                type="email"
                v-model="email"
                placeholder="Nhập email của bạn"
            />
            <p v-if="error" class="error-text">{{ error }}</p>
            <BaseButton
                @click="handleSubmit"
                btnTitle="Gửi yêu cầu"
                variant="primary"
                type="submit"
                class="login-btn"
            />
        </div>
    </div>
</template>

<style scoped>
.content {
    background-image: url("/assets/images/cream-bg.png");
    background-size: cover;
    background-repeat: no-repeat;
    background-position: top;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.logo-text {
    font-family: "Italianno", cursive;
    font-weight: 400;
    font-size: 6rem;
    color: var(--brown-color);
    margin: 20px 0;
}

.login-box {
    background-color: rgba(64, 58, 55, 0.9);
    color: var(--white-color);
    padding: 50px 100px;
    border-radius: 20px;
    width: 800px;
    margin: 0 auto;
    margin-top: 150px;
}

.login-box h2 {
    margin-bottom: 30px;
    font-size: 3rem;
    font-weight: 500;
}

input[type="email"],
input[type="text"],
input[type="password"] {
    width: 100%;
    padding: 12px 15px;
    margin: 10px 0;
    border-radius: 5px;
    border: none;
    font-size: 1.6rem;
}

.password-field {
    position: relative;
}

.eye-icon {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: var(--black-color);
}

.eye-icon i {
    pointer-events: none;
}

.forgot-password {
    display: block;
    text-align: left;
    font-size: 1.2rem;
    margin-bottom: 15px;
    color: var(--white-color);
    font-style: italic;
    text-decoration: underline;
}

.forgot-password:hover {
    color: var(--light-gray-color);
}

.login-btn {
    margin-top: 20px;
    margin-bottom: 10px;
}

.register-text {
    font-size: 1.4rem;
    color: var(--white-color);
    font-style: italic;
}

.register-text a {
    color: var(--white-color);
    text-decoration: underline;
}

.register-text a:hover {
    color: var(--light-gray-color);
}

.facebook-login {
    background-color: var(--white-color);
    padding: 10px 6px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 1.6rem;
    font-weight: 500;
    margin: 0 auto;
}
.google-login {
    border-radius: 6px;
    border: none;
    margin: 30px auto;
}

.facebook-login img {
    width: 20px;
    height: 20px;
}

.facebook-login:hover,
.google-login:hover {
    background-color: #f0f0f0;
}

.error-text {
    color: #ffb3b3;
    font-size: 1.2rem;
    margin: 4px 0 10px;
    text-align: left;
}

/* ---------- Responsive ---------- */
@media (max-width: 1024px) {
    .login-box {
        max-width: 90%;
    }
}

@media (max-width: 768px) {
    .logo-text {
        font-size: 3.8rem;
    }

    .login-box {
        padding: 30px 20px;
        max-width: 92%;
    }

    .login-box h2 {
        font-size: 2rem;
    }

    input[type="email"],
    input[type="password"] {
        font-size: 1.2rem;
    }

    .google-login {
        font-size: 1.2rem;
        padding: 10px 16px;
    }

    .register-text {
        font-size: 1.1rem;
    }
}

@media (max-width: 480px) {
    .logo-text {
        font-size: 3.2rem;
    }

    .login-box {
        padding: 25px 15px;
        border-radius: 15px;
        max-width: 95%;
    }

    .login-box h2 {
        font-size: 1.8rem;
    }

    .google-login {
        flex-direction: column;
        gap: 6px;
        font-size: 1.1rem;
    }

    .google-login img {
        width: 18px;
        height: 18px;
    }

    .register-text {
        font-size: 1rem;
    }

    input[type="email"],
    input[type="password"] {
        font-size: 1.1rem;
        padding: 10px;
    }
}
</style>
