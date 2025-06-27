<script setup>
import { useRouter, useRoute } from "vue-router";
import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { fetchTaiKhoan } from "@/services/taikhoan";
import { fetchGioHang } from "@/services/giohang";
import { fetchThongBao } from "@/services/thongbao";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const cartStore = useCartStore();
const { user } = useAuthStore();
const danhSachTaiKhoan = ref([]);
const thisTaiKhoan = ref([]);
const danhSachGioHang = ref([]);
const danhSachThongBao = ref([]);
const thisListThongBao = ref([]);

const activeTab = computed(() => {
    console.log("Current route.name:", route.name);
    return route.name || "TrangChu";
});

const toPage = (page) => {
    router.push({ name: page });
};

const toLogin = () => {
    router.push({ name: "DangNhap" });
};

// const cartItemCount = computed(() => danhSachGioHang.value?.length || 0);
const unreadCount = computed(
    () =>
        thisListThongBao.value.filter((n) => n.trangThai === "chua_doc").length
);

async function loadData() {
    try {
        const tkData = await fetchTaiKhoan();
        const ghData = await fetchGioHang(user.id);
        const tbData = await fetchThongBao();

        danhSachTaiKhoan.value = tkData;
        danhSachGioHang.value = ghData;
        danhSachThongBao.value = tbData;

        thisTaiKhoan.value = danhSachTaiKhoan.value.find(
            (tk) => tk.maTaiKhoan === user.id
        );

        thisListThongBao.value = danhSachThongBao.value.filter(
            (tb) => tb.maNguoiNhan === user.id
        );

        // Sau khi lấy dữ liệu giỏ hàng, gọi hàm tính tổng số lượng món ăn từ store
        await cartStore.calculateTotalItemCount(user.id);
    } catch (err) {
        console.error("API error:", err);
    }
}

onMounted(async () => {
    try {
        await loadData();
    } catch (err) {
        console.error("loadData failed:", err);
    }
});
</script>

<template>
    <div class="header">
        <img
            src="/assets/images/logo.png"
            alt="Sen Logo"
            class="logo"
            @click="toPage('TrangChu')"
        />
        <ul class="nav">
            <li
                :class="{ active: activeTab === 'TrangChu' }"
                @click="toPage('TrangChu')"
            >
                <a>TRANG CHỦ</a>
            </li>
            <li
                class="dropdown"
                :class="{
                    active: activeTab === 'NhaHang' || activeTab === 'KhuVuc',
                }"
            >
                <span>GIỚI THIỆU</span>
                <div class="dropdown-content">
                    <a
                        :class="{ active: activeTab === 'NhaHang' }"
                        @click="toPage('NhaHang')"
                        >NHÀ HÀNG</a
                    >
                    <a
                        :class="{ active: activeTab === 'KhuVuc' }"
                        @click="toPage('KhuVuc')"
                        >KHU VỰC BÀN</a
                    >
                </div>
            </li>
            <li
                :class="{ active: activeTab === 'ThucDon' }"
                @click="toPage('ThucDon')"
            >
                <a>THỰC ĐƠN</a>
            </li>
            <li
                :class="{ active: activeTab === 'DatBan' }"
                @click="toPage('DatBan')"
            >
                <a>ĐẶT BÀN</a>
            </li>
            <li
                :class="{ active: activeTab === 'UuDai' }"
                @click="toPage('UuDai')"
            >
                <a>ƯU ĐÃI</a>
            </li>
            <li
                :class="{ active: activeTab === 'LienHe' }"
                @click="toPage('LienHe')"
            >
                <a>LIÊN HỆ</a>
            </li>
        </ul>

        <div class="actions">
            <span
                v-if="!auth.token"
                :class="{ active: activeTab === 'DangNhap' }"
                @click="toLogin"
            >
                <i class="fa fa-user"></i> Đăng nhập
            </span>

            <span
                v-else
                class="user-info"
                :class="{
                    active:
                        activeTab === 'ThongTinCaNhan' ||
                        activeTab === 'DanhSachYeuThich' ||
                        activeTab === 'LichSuDatBan' ||
                        activeTab === 'ThongBao',
                }"
                @click="toPage('ThongTinCaNhan')"
            >
                <i class="fa fa-user"></i>
                {{ thisTaiKhoan.tenTaiKhoan }}
            </span>
            <i
                class="fa fa-shopping-cart cart-icon"
                :class="{ active: activeTab === 'GioHang' }"
                @click="toPage('GioHang')"
            >
                <span class="cart-badge">{{ cartStore.totalItemCount }}</span>
            </i>
            <i
                class="fa fa-bell notification-icon"
                :class="{ active: activeTab === 'ThongBao' }"
                @click="toPage('ThongBao')"
            >
                <span class="notification-badge">{{ unreadCount }}</span>
            </i>
        </div>
    </div>
</template>

<style scoped>
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--brown-color);
    padding: 0 50px;
    height: 100px;
}

/* Logo */
.logo {
    height: 100%;
}

/* Navigation */
.nav {
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.nav > li {
    position: relative;
    display: flex;
    align-items: center;
    height: 100px;
    padding: 0 20px;
    transition: background-color 0.3s ease;
}

.nav > li:hover {
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 5px;
}

.nav a,
.nav span {
    color: var(--white-color);
    font-weight: 500;
    cursor: pointer;
    font-size: 1.8rem;
    transition: color 0.3s ease;
}

/* Top-level active */
.nav > li.active > a,
.nav > li.active > span {
    color: var(--yellow-color);
}

/* Dropdown: chỉ link con active */
.dropdown-content a.active {
    color: var(--yellow-color);
}

/* Dropdown */
.dropdown-content {
    display: none;
    position: absolute;
    top: 100px;
    left: 0;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    min-width: 150px;
    white-space: nowrap;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    z-index: 1000;
}

.dropdown-content a {
    display: block;
    font-size: 1.8rem;
    padding: 15px 20px;
    color: var(--white-color);
    transition: background-color 0.3s ease, color 0.3s ease;
}

.dropdown-content a:hover {
    background-color: rgba(0, 0, 0, 0.3);
}

.dropdown:hover .dropdown-content {
    display: block;
}

/* Actions */
.actions {
    color: var(--white-color);
    display: flex;
    align-items: center;
    height: 100%;
    gap: 10px;
}

/* Đăng nhập */
.actions span {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 100%;
    padding: 0 15px;
    cursor: pointer;
    transition: background-color 0.3s ease, color 0.3s ease;
    border-radius: 5px;
    font-size: 1.8rem;
}

.actions span:hover {
    background-color: rgba(0, 0, 0, 0.3);
}

/* Cart icon */
.cart-icon {
    font-size: 1.8rem;
    cursor: pointer;
    height: 100%;
    padding: 0 15px;
    display: flex;
    align-items: center;
    transition: background-color 0.3s ease, color 0.3s ease;
    border-radius: 5px;
    position: relative;
}

.cart-badge {
    position: absolute;
    top: 30px;
    right: 5px;
    background-color: var(--white-color);
    color: var(--brown-color);
    border-radius: 50% !important;
    padding: 2px 4px !important;
    font-size: 0.8rem !important;
    height: 15% !important;
}

.cart-icon:hover {
    background-color: rgba(0, 0, 0, 0.3);
}

/* thông báo icon */
.notification-icon {
    font-size: 1.8rem;
    cursor: pointer;
    height: 100%;
    padding: 0 15px;
    display: flex;
    align-items: center;
    position: relative;
    border-radius: 5px;
    transition: background-color 0.3s ease, color 0.3s ease;
    color: var(--white-color);
}

.notification-icon:hover {
    background-color: rgba(0, 0, 0, 0.3);
}

.notification-icon.active {
    color: var(--yellow-color) !important;
}

.notification-badge {
    position: absolute;
    top: 30px;
    right: 5px;
    background-color: var(--white-color);
    color: var(--brown-color);
    border-radius: 50% !important;
    padding: 2px 6px !important;
    font-size: 0.8rem !important;
    height: 15% !important;
    min-width: 18px;
    text-align: center;
    line-height: 1.2rem;
    font-weight: bold;
}

/* highlight cho action khi active */
.actions .active {
    color: var(--yellow-color) !important;
}

.cart-icon.active .cart-badge {
    background-color: var(--yellow-color) !important;
    color: var(--brown-color) !important;
}

.notification-icon.active .notification-badge {
    background-color: var(--yellow-color) !important;
    color: var(--brown-color) !important;
}

.actions .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--white-color);
    font-size: 1.8rem;
}

/* Responsive */
@media (max-width: 1280px) {
    .header {
        padding: 0 30px;
    }
}

@media (max-width: 768px) {
    .header {
        flex-direction: column;
        height: auto;
        padding: 10px 20px;
    }
    .nav {
        flex-wrap: wrap;
    }
}

@media (max-width: 480px) {
    .nav a,
    .nav span,
    .dropdown-content a {
        font-size: 1.4rem;
    }
}
</style>
