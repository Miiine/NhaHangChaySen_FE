<script setup>
import BaseButton from "@/components/BaseButton.vue";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import api from "@/services/axios";
import { useAuthStore } from "@/stores/auth";

// Dữ liệu form
const email = ref("");
const password = ref("");

const router = useRouter();
const auth = useAuthStore();

// Trạng thái lỗi
const errors = ref({
    email: "",
    password: "",
});

const toPage = (page) => {
    router.push({ name: page });
    window.scrollTo(0, 0);
};

// Hàm validate
const validateForm = () => {
    let valid = true;
    errors.value.email = "";
    errors.value.password = "";

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
    return valid;
};

// Gửi form
const handleSubmit = async (event) => {
    event.preventDefault();
    if (validateForm()) {
        try {
            const res = await api.post("/auth/login", {
                email: email.value,
                password: password.value,
            });
            auth.login(res.data);
            Swal.fire({
                icon: "success",
                title: "Đăng nhập thành công!",
                text: "Xin chào " + email.value + "!",
            });

            // Lấy mã vai trò user
            const userRole = res.data.user?.maVaiTro || res.data.maVaiTro;

            // Điều hướng theo vai trò
            if (userRole === 1) {
                router.push({ name: "TrangChu" });
            } else if (userRole === 2) {
                router.push({ name: "SoDoBan" });
            } else if (userRole === 3) {
                router.push({ name: "ThongKe" });
            }
        } catch (err) {
            if (
                err.response?.data?.message ===
                "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với nhà hàng để mở lại tài khoản."
            ) {
                Swal.fire({
                    icon: "error",
                    title: "Tài khoản bị khóa",
                    text:
                        err.response?.data?.message ||
                        "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với nhà hàng để mở lại tài khoản.",
                    confirmButtonText: "OK",
                });
            } else if (
                err.response?.data?.message ===
                "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt."
            ) {
                Swal.fire({
                    icon: "warning",
                    title: "Tài khoản chưa được kích hoạt",
                    text:
                        err.response?.data?.message ||
                        "Vui lòng kiểm tra email để kích hoạt tài khoản.",
                    confirmButtonText: "OK",
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Đăng nhập thất bại",
                    text: err.response?.data?.message || "Lỗi đăng nhập",
                    confirmButtonText: "OK",
                });
            }
        }
    } else {
        console.log("Có lỗi trong form:", errors.value);
    }
};

// Hiển thị mật khẩu
const showPassword = ref(false);

//Toggle ẩn/hiện mật khẩu
const togglePassword = () => {
    showPassword.value = !showPassword.value;
};

// Đăng nhập bằng google
const handleGoogleResponse = async (response) => {
    // response.credential là JWT ID token của Google
    try {
        // Gửi token này lên backend để xác thực và nhận dữ liệu user
        const res = await api.post("/auth/google-login", {
            token: response.credential,
        });
        console.log("User data received from backend:", res.data);
        auth.login(res.data);
        Swal.fire({
            icon: "success",
            title: "Đăng nhập thành công bằng Google!",
            text: `Xin chào ${res.data.email || "bạn"}!`,
        });

        // Lấy mã vai trò user
        const userRole = res.data.user?.maVaiTro || res.data.maVaiTro;

        // Điều hướng theo vai trò
        if (userRole === 1) {
            router.push({ name: "TrangChu" });
        } else if (userRole === 2) {
            router.push({ name: "SoDoBan" });
        } else if (userRole === 3) {
            router.push({ name: "ThongKe" });
        }
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Đăng nhập Google thất bại",
            text: error.response?.data?.message || "Lỗi đăng nhập Google",
        });
    }
};

//hàm gọi đăng nhập Facebook
const handleFacebookLogin = () => {
    FB.login(
        function (response) {
            if (response.authResponse) {
                // Lấy access token
                const accessToken = response.authResponse.accessToken;

                // Gửi token này lên backend để xác thực và tạo JWT của app
                api.post("/auth/facebook-login", { accessToken })
                    .then((res) => {
                        auth.login(res.data);
                        Swal.fire({
                            icon: "success",
                            title: "Đăng nhập thành công bằng Facebook!",
                            text: `Xin chào ${res.data.user.email || "bạn"}!`,
                        });
                        router.push("/");
                    })
                    .catch((err) => {
                        Swal.fire({
                            icon: "error",
                            title: "Đăng nhập Facebook thất bại",
                            text:
                                err.response?.data?.message ||
                                "Lỗi đăng nhập Facebook",
                        });
                    });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Đăng nhập Facebook thất bại",
                    text: "Bạn đã hủy đăng nhập hoặc chưa cấp quyền.",
                });
            }
        },
        { scope: "email" } // yêu cầu quyền lấy email
    );
};

onMounted(() => {
    // load và khởi tạo SDK Facebook
    window.fbAsyncInit = function () {
        FB.init({
            appId: "1098162509046124",
            cookie: true,
            xfbml: false,
            version: "v22.0",
        });
    };

    // Kiểm tra google object đã load chưa
    if (window.google) {
        window.google.accounts.id.initialize({
            client_id:
                "145924684461-ggv8osjml94ei2f1nrncpmu6spg94bd1.apps.googleusercontent.com",
            callback: handleGoogleResponse,
        });

        window.google.accounts.id.renderButton(
            document.getElementById("googleSignInDiv"),
            {
                theme: "outline", // "filled_blue", "outline", "filled_black"
                size: "large",
                type: "standard",
            }
        );

        // (Tuỳ chọn) Tự động hiển thị popup đăng nhập Google nếu đã đăng nhập trước
        // window.google.accounts.id.prompt();
    }
});
</script>

<template>
    <div class="content">
        <h1 class="logo-text">Nhà hàng chay Sen</h1>
        <div class="login-box">
            <h2 class="title-text">ĐĂNG NHẬP</h2>
            <form @submit.prevent="handleSubmit">
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
                    <span class="eye-icon" @click="togglePassword">
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
                <a
                    @click="toPage('RequestPasswordReset')"
                    class="forgot-password"
                    >Quên mật khẩu</a
                >
                <BaseButton
                    btnTitle="ĐĂNG NHẬP"
                    variant="primary"
                    type="submit"
                    class="login-btn"
                />
                <p class="register-text">
                    Bạn chưa có tài khoản?
                    <router-link to="/DangKy">Đăng ký</router-link>
                </p>
            </form>
            <button id="googleSignInDiv" class="google-login">
                <!-- <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google icon"
                /> -->
                <!-- <span>Đăng nhập bằng Google</span> -->
            </button>
            <button @click="handleFacebookLogin" class="facebook-login">
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/2023_Facebook_icon.svg/768px-2023_Facebook_icon.svg.png"
                    alt="Google icon"
                />
                <span>Đăng nhập bằng Facebook</span>
            </button>
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
