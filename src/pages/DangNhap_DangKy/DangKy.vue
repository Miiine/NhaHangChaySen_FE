<script setup>
import BaseButton from "@/components/BaseButton.vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/axios";
import Swal from "sweetalert2";

// Dữ liệu form
const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");

const router = useRouter();

// Trạng thái lỗi
const errors = ref({
    email: "",
    password: "",
});

// Hàm validate
const validateForm = () => {
    let valid = true;
    errors.value.username = "";
    errors.value.email = "";
    errors.value.password = "";
    errors.value.confirmPassword = "";

    if (!username.value) {
        errors.value.username = "Tên tài khoản không được để trống";
        valid = false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email.value) {
        errors.value.email = "Email không được để trống";
        valid = false;
    } else if (!emailRegex.test(email.value)) {
        errors.value.email = "Email không hợp lệ";
        valid = false;
    }

    if (!password.value) {
        errors.value.password = "Mật khẩu không được để trống";
        valid = false;
    } else if (password.value.length < 6) {
        errors.value.password = "Mật khẩu phải có ít nhất 6 ký tự";
        valid = false;
    }

    if (!confirmPassword.value) {
        errors.value.confirmPassword = "Vui lòng nhập lại mật khẩu";
        valid = false;
    } else if (password.value !== confirmPassword.value) {
        errors.value.confirmPassword = "Mật khẩu không khớp";
        valid = false;
    }

    return valid;
};

// Gửi form
const handleSubmit = async (event) => {
    event.preventDefault();
    if (validateForm()) {
        if (password.value !== confirmPassword.value) {
            return;
        }
        try {
            await api.post("/auth/register", {
                username: username.value,
                email: email.value,
                password: password.value,
            });
            Swal.fire({
                icon: "success",
                title: "Đăng ký thành công!",
                text: "Vui lòng kiểm tra email để kích hoạt tài khoản.",
            });
            console.log("Đăng ký thành công với email:", email.value);
            router.push("/DangNhap");
        } catch (err) {
            console.log(err);
            Swal.fire({
                icon: "error",
                title: "Đăng ký thất bại",
                text: err.response?.data?.message || "Lỗi đăng ký",
            });
        }
    } else {
        console.log("Có lỗi trong form:", errors.value);
    }
};

// Hiển thị mật khẩu
const showPassword = ref(false);
const showConfirmPassword = ref(false);
</script>

<template>
    <div class="content">
        <h1 class="logo-text">Nhà hàng chay Sen</h1>
        <div class="login-box">
            <h2 class="title-text">ĐĂNG KÝ</h2>
            <form action="" @submit.prevent="handleSubmit">
                <input
                    type="text"
                    v-model="username"
                    placeholder="Tên tài khoản"
                    class="input-text"
                />
                <p v-if="errors.username" class="error-text">
                    {{ errors.username }}
                </p>
                <input
                    type="email"
                    v-model="email"
                    placeholder="Email"
                    class="input-text"
                />
                <p v-if="errors.email" class="error-text">{{ errors.email }}</p>

                <div class="password-field">
                    <input
                        :type="showPassword ? 'text' : 'password'"
                        v-model="password"
                        placeholder="Mật khẩu"
                        class="input-text"
                    />
                    <span
                        class="eye-icon"
                        @click="showPassword = !showPassword"
                    >
                        <i
                            :class="
                                showPassword
                                    ? 'fa-solid fa-eye'
                                    : 'fa-solid fa-eye-slash'
                            "
                        ></i>
                    </span>
                </div>
                <p v-if="errors.password" class="error-text">
                    {{ errors.password }}
                </p>
                <div class="password-field">
                    <input
                        :type="showConfirmPassword ? 'text' : 'password'"
                        v-model="confirmPassword"
                        placeholder="Nhập lại mật khẩu"
                        class="input-text"
                    />
                    <span
                        class="eye-icon"
                        @click="showConfirmPassword = !showConfirmPassword"
                    >
                        <i
                            :class="
                                showConfirmPassword
                                    ? 'fa-solid fa-eye'
                                    : 'fa-solid fa-eye-slash'
                            "
                        ></i>
                    </span>
                </div>
                <p v-if="errors.confirmPassword" class="error-text">
                    {{ errors.confirmPassword }}
                </p>
                <BaseButton
                    btnTitle="ĐĂNG KÝ"
                    variant="primary"
                    type="submit"
                    class="login-btn"
                />
                <p class="register-text">
                    Bạn đã có tài khoản?
                    <router-link to="/DangNhap">Đăng nhập</router-link>
                </p>
            </form>
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

.login-btn {
    margin-top: 30px;
    margin-bottom: 20px;
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
