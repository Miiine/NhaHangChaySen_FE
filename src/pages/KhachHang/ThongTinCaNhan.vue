<script setup>
import { useRouter } from "vue-router";
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useAuthStore } from "@/stores/auth";
import Swal from "sweetalert2";
import BreadCrumb from "@/components/BreadCrumb.vue";
import BaseButton from "@/components/BaseButton.vue";

import {
    fetchTaiKhoan,
    updateTaiKhoan,
    uploadAvatar,
} from "@/services/taikhoan";
import {
    fetchTinhThanh,
    fetchQuanHuyen,
    fetchPhuongXa,
    fetchDiaChiDayDu,
} from "@/services/diachi";

const { user } = useAuthStore();
const auth = useAuthStore();
const router = useRouter();
const avatarPreview = ref("");
const avatarUrlFromServer = ref("");
const username = ref("");
const sdt = ref("");
const ngaySinh = ref("");
const gioiTinh = ref("");
const oldPassword = ref("");
const newPassword = ref("");
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const maTinhThanh = ref("");
const maQuanHuyen = ref("");
const maPhuongXa = ref("");
const diaChiCuThe = ref("");
const tenPhuongXa = ref("");
const tenQuanHuyen = ref("");
const tenTinhThanh = ref("");

const danhSachTaiKhoan = ref([]);
const thisTaiKhoan = ref([]);
const tinhThanhList = ref([]);
const quanHuyenList = ref([]);
const phuongXaList = ref([]);

const toPage = (page) => {
    router.push({ name: page });
    window.scrollTo(0, 0);
};

const hasPassword = computed(() => {
    // thisTaiKhoan.value.matKhau có tồn tại và không null hay rỗng
    return thisTaiKhoan.value && thisTaiKhoan.value.matKhau;
});

const logout = async () => {
    const result = await Swal.fire({
        title: "Bạn có chắc chắn muốn đăng xuất không?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Đăng xuất",
        cancelButtonText: "Hủy",
        reverseButtons: true,
    });

    if (result.isConfirmed) {
        auth.logout(); // Xoá token, user trong store
        await Swal.fire({
            icon: "success",
            title: "Bạn đã đăng xuất thành công!",
            timer: 1500,
            showConfirmButton: false,
        });
        router.push("/DangNhap"); // Chuyển về trang đăng nhập
    }
};

function formatDate(dateStr) {
    if (!dateStr) return "Chưa cập nhật";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // tháng bắt đầu từ 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const { fileUrl } = await uploadAvatar(file);
        avatarPreview.value = URL.createObjectURL(file);
        avatarUrlFromServer.value = fileUrl;
    } catch (err) {
        console.error("Upload ảnh thất bại:", err);
    }
};

const loadDiaChiDayDu = async (maPhuongXa) => {
    if (!maPhuongXa) return;

    try {
        const data = await fetchDiaChiDayDu(maPhuongXa);
        tenPhuongXa.value = data.tenPhuongXa || "";
        maQuanHuyen.value = data.maQuanHuyen || "";
        tenQuanHuyen.value = data.tenQuanHuyen || "";
        maTinhThanh.value = data.maTinhThanh || "";
        tenTinhThanh.value = data.tenTinhThanh || "";
    } catch (error) {
        console.error("Lỗi khi lấy địa chỉ đầy đủ:", error);
    }
};

async function updateAccount() {
    if (hasPassword.value && !oldPassword.value) {
        Swal.fire("Lỗi", "Vui lòng nhập mật khẩu để xác thực!", "error");
        return;
    }

    try {
        const payload = {
            oldPassword: oldPassword.value,
        };

        if (avatarUrlFromServer.value)
            payload.avatar = avatarUrlFromServer.value;
        if (newPassword.value) payload.matKhauMoi = newPassword.value;
        if (username.value) payload.tenTaiKhoan = username.value;
        if (sdt.value) payload.sdt = sdt.value;
        if (ngaySinh.value) payload.ngaySinh = ngaySinh.value;
        if (gioiTinh.value) payload.gioiTinh = gioiTinh.value;
        if (diaChiCuThe.value) payload.diaChiCuThe = diaChiCuThe.value;
        if (maPhuongXa.value) payload.maPhuongXa = maPhuongXa.value;

        await updateTaiKhoan(user.id, payload);

        oldPassword.value = "";
        newPassword.value = "";
        username.value = "";
        sdt.value = "";
        ngaySinh.value = "";
        gioiTinh.value = "";
        diaChiCuThe.value = "";
        maTinhThanh.value = "";
        maQuanHuyen.value = "";
        maPhuongXa.value = "";
        avatarUrlFromServer.value = "";
        // avatarFile.value = null;

        await loadData();
        await nextTick();

        Swal.fire("Thành công", "Đã cập nhật tài khoản!", "success").then(
            () => {
                document.activeElement?.blur();
                nextTick(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }, 100);
                    });
                });
            }
        );
    } catch (err) {
        const msg = err.response?.data?.message || "Lỗi cập nhật tài khoản";
        Swal.fire("Lỗi", msg, "error");
        console.error("Lỗi cập nhật thông tin tài khoản", err);
    }
}

async function loadData() {
    try {
        const tkData = await fetchTaiKhoan();
        const ttData = await fetchTinhThanh();

        danhSachTaiKhoan.value = tkData;
        tinhThanhList.value = ttData;

        thisTaiKhoan.value = danhSachTaiKhoan.value.find(
            (tk) => tk.maTaiKhoan === user.id
        );

        if (!thisTaiKhoan.value) {
            console.warn("Không tìm thấy tài khoản với mã: ", user.id);
        }
        console.log("This Tài khoản: ", thisTaiKhoan.value);

        // Đồng bộ dữ liệu vào form
        avatarPreview.value =
            thisTaiKhoan.value.anhTaiKhoan ||
            "/assets/images/taikhoan/avatar.png";

        maPhuongXa.value = thisTaiKhoan.value.maPhuongXa || "";
        if (maPhuongXa.value) {
            await loadDiaChiDayDu(maPhuongXa.value);
        }
        maTinhThanh.value = "";
    } catch (err) {
        console.error("Lỗi loadData:", err);
    }
}

// Khi chọn tỉnh thay đổi thì load quận tương ứng
watch(maTinhThanh, async (newVal) => {
    if (newVal) {
        quanHuyenList.value = await fetchQuanHuyen(newVal);
        maQuanHuyen.value = "";
        phuongXaList.value = [];
        maPhuongXa.value = "";
    } else {
        quanHuyenList.value = [];
        maQuanHuyen.value = "";
        phuongXaList.value = [];
        maPhuongXa.value = "";
    }
});

// Khi chọn quận thay đổi thì load phường tương ứng
watch(maQuanHuyen, async (newVal) => {
    if (newVal) {
        phuongXaList.value = await fetchPhuongXa(newVal);
        maPhuongXa.value = "";
    } else {
        phuongXaList.value = [];
        maPhuongXa.value = "";
    }
});

onMounted(async () => {
    //Fetch all
    await loadData();
});
</script>

<template>
    <BreadCrumb />
    <div class="page-container">
        <div class="left-nav">
            <ul>
                <li @click="toPage('ThongTinCaNhan')" class="active">
                    Thông tin tài khoản
                </li>
                <li @click="toPage('DanhSachYeuThich')">Món ăn yêu thích</li>
                <li @click="toPage('LichSuDatBan')">Lịch sử đặt bàn</li>
                <li @click="toPage('ThongBao')">Thông báo</li>
                <li @click="logout">Đăng xuất</li>
            </ul>
        </div>

        <div class="right-content">
            <h2>THÔNG TIN TÀI KHOẢN</h2>

            <div class="info-account">
                <div class="avatar">
                    <img
                        :src="avatarPreview"
                        alt="Ảnh đại diện"
                        @error="
                            avatarPreview = '/assets/images/taikhoan/avatar.png'
                        "
                    />
                </div>
                <div class="info-text">
                    <p>
                        <strong>Tên tài khoản:</strong>
                        {{ thisTaiKhoan.tenTaiKhoan || "Chưa cập nhật" }}
                    </p>
                    <p>
                        <strong>Email:</strong>
                        {{ thisTaiKhoan.email || "Chưa cập nhật" }}
                    </p>
                    <p>
                        <strong>SĐT:</strong>
                        {{ thisTaiKhoan.SDT || "Chưa cập nhật" }}
                    </p>
                    <p>
                        <strong>Ngày sinh:</strong>
                        {{ formatDate(thisTaiKhoan.ngaySinh) }}
                    </p>

                    <p>
                        <strong>Giới tính:</strong>
                        {{
                            thisTaiKhoan.gioiTinh === "Nam"
                                ? "Nam"
                                : thisTaiKhoan.gioiTinh === "Nu"
                                ? "Nữ"
                                : thisTaiKhoan.gioiTinh === "Khac"
                                ? "Khác"
                                : "Chưa cập nhật"
                        }}
                    </p>
                    <p>
                        <strong>Địa chỉ:</strong>
                        {{ thisTaiKhoan.diaChi || "" }}
                        <template v-if="tenPhuongXa"
                            >, {{ tenPhuongXa }}</template
                        >
                        <template v-if="tenQuanHuyen"
                            >, {{ tenQuanHuyen }}</template
                        >
                        <template v-if="tenTinhThanh"
                            >, {{ tenTinhThanh }}</template
                        >
                        <template
                            v-if="
                                !diaChiCuThe &&
                                !tenPhuongXa &&
                                !tenQuanHuyen &&
                                !tenTinhThanh
                            "
                        >
                            Chưa cập nhật
                        </template>
                    </p>
                </div>
            </div>

            <form @submit.prevent="updateAccount" class="update-form">
                <h3>Cập nhật thông tin tài khoản:</h3>

                <div class="form-row">
                    <!-- Chứa các form-group -->
                    <div class="form-group full-width">
                        <label>Ảnh đại diện:</label>
                        <input
                            type="file"
                            @change="handleFileChange"
                            accept="image/*"
                        />
                    </div>

                    <div class="form-group full-width">
                        <label>Tên tài khoản:</label>
                        <input
                            type="text"
                            v-model="username"
                            placeholder="Nhập tên tài khoản mới"
                        />
                    </div>

                    <div class="form-group">
                        <label>Số điện thoại:</label>
                        <input
                            type="text"
                            v-model="sdt"
                            placeholder="Nhập số điện thoại"
                        />
                    </div>

                    <div class="form-group">
                        <label>Ngày sinh:</label>
                        <input
                            type="date"
                            v-model="ngaySinh"
                            placeholder="Chọn ngày sinh"
                            max="9999-12-31"
                        />
                    </div>

                    <div class="form-group">
                        <label>Giới tính:</label>
                        <select v-model="gioiTinh">
                            <option value="">Chọn giới tính</option>
                            <option value="Nam">Nam</option>
                            <option value="Nu">Nữ</option>
                            <option value="Khac">Khác</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Tỉnh/Thành:</label>
                        <select v-model="maTinhThanh">
                            <option value="">Chọn Tỉnh/Thành</option>
                            <option
                                v-for="tt in tinhThanhList"
                                :key="tt.maTinhThanh"
                                :value="tt.maTinhThanh"
                            >
                                {{ tt.tenTinhThanh }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Quận/Huyện:</label>
                        <select v-model="maQuanHuyen" :disabled="!maTinhThanh">
                            <option value="">Chọn Quận/Huyện</option>
                            <option
                                v-for="qh in quanHuyenList"
                                :key="qh.maQuanHuyen"
                                :value="qh.maQuanHuyen"
                            >
                                {{ qh.tenQuanHuyen }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Phường/Xã:</label>
                        <select v-model="maPhuongXa" :disabled="!maQuanHuyen">
                            <option value="">Chọn Phường/Xã</option>
                            <option
                                v-for="px in phuongXaList"
                                :key="px.maPhuongXa"
                                :value="px.maPhuongXa"
                            >
                                {{ px.tenPhuongXa }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group full-width">
                        <label>Địa chỉ cụ thể:</label>
                        <textarea
                            v-model="diaChiCuThe"
                            placeholder="Nhập địa chỉ"
                            rows="3"
                        ></textarea>
                    </div>

                    <div v-if="hasPassword" class="form-group">
                        <label>Password mới:</label>
                        <div class="password-wrapper">
                            <input
                                :type="showNewPassword ? 'text' : 'password'"
                                v-model="newPassword"
                                placeholder="Nhập password mới"
                            />
                            <span
                                class="toggle-password"
                                @click="showNewPassword = !showNewPassword"
                            >
                                {{ showNewPassword ? "👁️" : "🙈" }}
                            </span>
                        </div>
                    </div>
                </div>

                <div v-if="hasPassword" class="form-group">
                    <label>Password:</label>
                    <div class="password-wrapper">
                        <input
                            :type="showOldPassword ? 'text' : 'password'"
                            v-model="oldPassword"
                            required
                            placeholder="Vui lòng nhập password để cập nhật thông tin"
                        />
                        <span
                            class="toggle-password"
                            @click="showOldPassword = !showOldPassword"
                        >
                            {{ showOldPassword ? "👁️" : "🙈" }}
                        </span>
                    </div>
                </div>

                <BaseButton
                    type="submit"
                    btnTitle="CẬP NHẬT THÔNG TIN"
                    variant="primary"
                    class="info-btn"
                ></BaseButton>
            </form>
        </div>
    </div>
</template>

<style scoped>
.page-container {
    padding: 0px;
    width: 100%;
    background-image: url("/assets/images/cream-bg.png");
    background-size: cover;
    background-repeat: no-repeat;
    background-position: top top;
    margin-bottom: 10px;
    padding-bottom: 0;

    display: flex;
    justify-content: space-between;
}

.left-nav {
    width: 300px;
    background-color: var(--yellow-color);
}

.left-nav ul {
    list-style: none;
}

.left-nav ul li {
    padding: 15px 30px;
    color: var(--cream-color);
    cursor: pointer;
    text-transform: uppercase;
    border-bottom: 1px solid var(--brown-color);
    transition: background-color 0.3s;
    font-size: 1.6rem;
    font-weight: 600;
}

.left-nav ul li:hover,
.left-nav ul li.active {
    background-color: #7e5525;
}

.right-content {
    flex: 1;
    padding: 50px 200px;
}

h2 {
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 30px;
    font-size: 3rem;
    color: var(--brown-color);
}

/* Phần thông tin tài khoản */
.info-account {
    display: flex;
    align-items: center;
    gap: 30px;
}

.avatar {
    width: 150px;
    height: 150px;
    border: 5px solid var(--yellow-color);
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--white-color);
}

.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.info-text p {
    font-size: 1.6rem;
    color: var(--brown-color);
    margin-bottom: 10px;
    font-weight: 600;
}

/* Form cập nhật */
.update-form h3 {
    font-weight: 700;
    margin-top: 20px;
    padding-top: 20px;
    margin-bottom: 25px;
    color: var(--brown-color);
    border-top: 1px solid var(--brown-color);
}

.update-form .form-row {
    display: flex;
    flex-wrap: wrap;
    column-gap: 50px;
    row-gap: 10px;
    margin-bottom: 50px;
}

.update-form .form-row .form-group {
    flex: 1 1 35%;
    min-width: 280px;
}
.update-form .form-row .form-group.full-width {
    flex-basis: 100%;
}

.form-group {
    display: flex;
    align-items: center;
}

.form-group label {
    flex-basis: 120px;
    font-weight: 600;
    color: var(--brown-color);
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="password"],
.form-group input[type="date"],
.form-group input[type="file"],
.form-group select,
.form-group textarea {
    flex: 1;
    padding: 8px 10px;
    border: 1.5px solid var(--dark-gray-color);
    border-radius: 4px;
    font-size: 1.4rem;
    color: var(--black-color);
    outline-color: var(--yellow-color);
}

.password-wrapper {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
}

.password-wrapper input {
    flex: 1;
    padding-right: 35px; /* đủ chỗ cho icon */
}

.toggle-password {
    position: absolute;
    right: 10px;
    cursor: pointer;
    user-select: none;
    font-size: 1.6rem;
    color: var(--brown-color);
}

/* Nút cập nhật */
.info-btn {
    display: block;
    margin: 30px auto;
}

@media (max-width: 1200px) {
    .right-content {
        padding: 40px 100px;
    }
}

@media (max-width: 992px) {
    .page-container {
        flex-direction: column;
    }

    .left-nav {
        width: 100%;
        display: flex;
        overflow-x: auto;
    }

    .left-nav ul {
        display: flex;
        width: 100%;
        padding: 0;
        margin: 0;
    }

    .left-nav ul li {
        flex: 1;
        text-align: center;
        border-bottom: none;
        border-right: 1px solid var(--brown-color);
        white-space: nowrap;
    }

    .right-content {
        padding: 30px 50px;
    }

    .info-account {
        flex-direction: column;
        align-items: flex-start;
    }

    .avatar {
        margin-bottom: 20px;
    }

    .update-form .form-row {
        column-gap: 30px;
    }
}

@media (max-width: 768px) {
    .right-content {
        padding: 20px 30px;
    }

    .update-form .form-row .form-group {
        flex: 1 1 100%;
    }

    .form-group label {
        flex-basis: 100px;
    }

    .toggle-password {
        font-size: 1.4rem;
    }

    h2 {
        font-size: 2.4rem;
    }

    .info-text p {
        font-size: 1.4rem;
    }
}

@media (max-width: 576px) {
    .right-content {
        padding: 20px 15px;
    }

    .form-group {
        flex-direction: column;
        align-items: flex-start;
    }

    .form-group label {
        margin-bottom: 5px;
    }

    .password-wrapper input {
        padding-right: 30px;
    }

    .toggle-password {
        right: 8px;
        font-size: 1.2rem;
    }

    .left-nav ul li {
        padding: 10px 15px;
        font-size: 1.4rem;
    }

    .update-form .form-row {
        column-gap: 0;
        row-gap: 20px;
    }

    .update-form h3 {
        font-size: 1.6rem;
    }
}
</style>
