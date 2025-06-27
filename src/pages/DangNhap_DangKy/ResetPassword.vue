<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import api from "@/services/axios";
import BaseButton from "@/components/BaseButton.vue";

const route = useRoute();
const router = useRouter();

const token = route.query.token || "";

const newPassword = ref("");
const confirmPassword = ref("");
const error = ref("");

const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const toggleNewPassword = () => {
    showNewPassword.value = !showNewPassword.value;
};

const toggleConfirmPassword = () => {
    showConfirmPassword.value = !showConfirmPassword.value;
};

const validate = () => {
    error.value = "";
    if (!newPassword.value) {
        error.value = "Mật khẩu mới không được để trống";
        return false;
    }
    if (newPassword.value.length < 6) {
        error.value = "Mật khẩu phải có ít nhất 6 ký tự";
        return false;
    }
    if (newPassword.value !== confirmPassword.value) {
        error.value = "Mật khẩu xác nhận không khớp";
        return false;
    }
    if (!token) {
        error.value = "Token không hợp lệ";
        return false;
    }
    return true;
};

const handleSubmit = async () => {
    if (!validate()) return;

    try {
        await api.post("/auth/reset-password", {
            token,
            newPassword: newPassword.value,
        });
        Swal.fire({
            icon: "success",
            title: "Đặt lại mật khẩu thành công",
        });
        router.push("/DangNhap");
    } catch (err) {
        error.value = err.response?.data?.message || "Lỗi khi đặt lại mật khẩu";
    }
};
</script>

<template>
    <div class="content">
        <div class="login-box">
            <h2 class="title-text">ĐẶT LẠI MẬT KHẨU</h2>
            <div class="password-field">
                <input
                    :type="showNewPassword ? 'text' : 'password'"
                    v-model="newPassword"
                    placeholder="Nhập mật khẩu mới"
                />
                <span class="eye-icon" @click="toggleNewPassword">
                    <i
                        :class="
                            showNewPassword
                                ? 'fa-solid fa-eye'
                                : 'fa-solid fa-eye-slash'
                        "
                    ></i>
                </span>
            </div>

            <div class="password-field">
                <input
                    :type="showConfirmPassword ? 'text' : 'password'"
                    v-model="confirmPassword"
                    placeholder="Xác nhận mật khẩu mới"
                />
                <span class="eye-icon" @click="toggleConfirmPassword">
                    <i
                        :class="
                            showConfirmPassword
                                ? 'fa-solid fa-eye'
                                : 'fa-solid fa-eye-slash'
                        "
                    ></i>
                </span>
            </div>
            <p v-if="error" class="error-text">{{ error }}</p>
            <BaseButton
                @click="handleSubmit"
                btnTitle="Đặt lại mật khẩu"
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
