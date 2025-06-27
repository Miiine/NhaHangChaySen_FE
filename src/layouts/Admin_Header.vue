<script setup>
import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useSearchStore } from "@/stores/search";
import Swal from "sweetalert2";
import { useRouter } from "vue-router";
import { fetchThongBao } from "@/services/thongbao";

const auth = useAuthStore();
const router = useRouter();
const { user } = useAuthStore();

// Sử dụng store
const searchStore = useSearchStore();

// Cập nhật khi thay đổi input tìm kiếm
const updateSearchText = (event) => {
    searchStore.setSearchText(event.target.value); // Cập nhật giá trị tìm kiếm vào store
};

const danhSachThongBao = ref([]);
const thisListThongBao = ref([]);

const showUserMenu = ref(false);

const unreadCount = computed(
    () =>
        thisListThongBao.value.filter((n) => n.trangThai === "chua_doc").length
);

function toggleUserMenu() {
    showUserMenu.value = !showUserMenu.value;
}

const toPage = (page) => {
    router.push({ name: page });
};

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
        auth.logout();
        await Swal.fire({
            icon: "success",
            title: "Bạn đã đăng xuất thành công!",
            timer: 1500,
            showConfirmButton: false,
        });
        router.push("/DangNhap");
    }
};

const goToThongKe = () => {
    router.push({ name: "ThongKe" });
};

async function loadData() {
    try {
        const tbData = await fetchThongBao();
        danhSachThongBao.value = tbData;

        thisListThongBao.value = danhSachThongBao.value.filter(
            (tb) => tb.maNguoiNhan === user.id
        );
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
    <header class="header">
        <div class="logo" @click="goToThongKe">
            <img src="/assets/images/logo.png" alt="Sen Logo" height="40" />
        </div>

        <div class="search-box">
            <input
                type="text"
                placeholder="Tìm kiếm"
                v-model="searchStore.searchText"
                @input="updateSearchText"
            />
            <i class="fa fa-search search-icon"></i>
        </div>

        <div class="actions">
            <!-- Thêm :class active khi showUserMenu = true -->
            <div
                class="user-wrapper"
                :class="{ active: showUserMenu }"
                @click="toggleUserMenu"
            >
                <i class="fa fa-user user-icon"></i>
                <span class="user-name">{{
                    auth.user?.username ? auth.user.username : auth.user?.email
                }}</span>

                <div v-if="showUserMenu" class="user-menu">
                    <button @click.stop="logout" class="logout-btn">
                        <i
                            class="fa fa-sign-out-alt"
                            style="margin-right: 8px"
                        ></i>
                        Đăng xuất
                    </button>
                </div>
            </div>
            <i
                class="fa fa-bell notification-icon"
                @click="toPage('ThongBaoAdmin')"
            >
                <span class="notification-badge">{{ unreadCount }}</span>
            </i>
        </div>
    </header>
</template>

<style scoped>
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--brown-color);
    padding: 0 100px;
    height: 80px;
    color: var(--white-color);

    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* Logo */
.logo img {
    height: 80px;
    cursor: pointer;
}

/* Search box */
.search-box {
    position: relative;
    flex-grow: 1;
    max-width: 500px;
    margin: 0 20px;
}

.search-box input {
    width: 100%;
    padding: 10px 40px 10px 15px;
    border-radius: 5px;
    border: none;
    font-size: 1.4rem;
    outline: none;
    color: var(--black-color);
}

.search-box .search-icon {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--dark-gray-color);
    font-size: 1.4rem;
}

.actions {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
}

/* User wrapper */
.user-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    cursor: pointer;
    gap: 15px;
    user-select: none;
    height: 80px;
    padding: 30px;
    transition: color 0.3s ease;
}

.user-wrapper:hover {
    background-color: rgba(0, 0, 0, 0.3);
}

.user-wrapper.active {
    color: var(--yellow-color);
}

.user-wrapper.active .user-icon,
.user-wrapper.active .user-name {
    color: var(--yellow-color);
}

.user-icon {
    font-size: 2rem;
    color: var(--white-color);
}

/* User name */
.user-name {
    font-weight: 500;
    font-size: 1.6rem;
    color: var(--white-color);
}

/* Dropdown menu user */
.user-menu {
    position: absolute;
    top: 96%;
    left: 0;
    background-color: var(--dark-gray-color);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
    z-index: 100;
    white-space: nowrap;
}

.logout-btn {
    background: none;
    border: none;
    color: var(--white-color);
    font-weight: 600;
    cursor: pointer;
    padding: 15px;
    font-size: 1.2rem;
    border-radius: 4px;
    text-transform: uppercase;
    transition: background-color 0.3s ease;
    display: flex;
    align-items: center;
}

.logout-btn:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

/* thông báo icon */
.notification-icon {
    font-size: 1.8rem;
    cursor: pointer;
    height: 100%;
    padding: 30px;
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
    top: 22px;
    right: 18px;
    background-color: var(--white-color);
    color: var(--brown-color);
    border-radius: 50%;
    padding: 2px 6px;
    font-size: 0.8rem;
    height: 20%;
    min-width: 18px;
    text-align: center;
    line-height: 1.2rem;
    font-weight: bold;
}
</style>
