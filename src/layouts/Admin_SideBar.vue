<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Swal from "sweetalert2";
const route = useRoute();
const auth = useAuthStore();
const router = useRouter();

const menus = [
    { id: 1, label: "Thống kê", icon: "fa-chart-bar", to: "/admin/" },
    {
        id: 2,
        label: "Đặt bàn",
        icon: "fa-calendar-check",
        children: [
            { id: 21, label: "Sơ đồ bàn", to: "/admin/datban/sodo" },
            { id: 22, label: "Lịch đặt bàn", to: "/admin/datban/lichdat" },
            {
                id: 23,
                label: "Lịch sử đặt bàn",
                to: "/admin/datban/lichsudatban",
            },
        ],
    },
    { id: 3, label: "Ưu đãi", icon: "fa-gift", to: "/admin/uudai" },
    {
        id: 4,
        label: "Món ăn",
        icon: "fa-utensils",
        children: [
            { id: 41, label: "Danh mục", to: "/admin/monan/danhmuc" },
            { id: 42, label: "Danh sách món ăn", to: "/admin/monan/danhsach" },
        ],
    },
    {
        id: 5,
        label: "Nguyên liệu",
        icon: "fa-box-open",
        children: [
            { id: 51, label: "Danh mục", to: "/admin/nguyenlieu/danhmuc" },
            { id: 52, label: "Danh sách NL", to: "/admin/nguyenlieu/danhsach" },
            { id: 53, label: "Nhập kho", to: "/admin/nguyenlieu/nhapkho" },
        ],
    },
    // { id: 6, label: "Nhân viên", icon: "fa-users", to: "/nhanvien" },
    // { id: 7, label: "Khách hàng", icon: "fa-user-friends", to: "/khachhang" },
    {
        id: 6,
        label: "Nhà cung cấp",
        icon: "fa-user-friends",
        to: "/admin/nhacungcap",
    },
    { id: 7, label: "Tài khoản", icon: "fa-users", to: "/admin/taikhoan" },
    { id: 8, label: "Thông báo", icon: "fa fa-bell", to: "/admin/thongbao" },
    { id: 9, label: "Đăng xuất", icon: "fa-sign-out-alt", to: "/dangxuat" },
];

const openMenus = ref([]);

function toggleMenu(id) {
    if (openMenus.value.includes(id)) {
        openMenus.value = openMenus.value.filter((x) => x !== id);
    } else {
        openMenus.value.push(id);
    }
}

function isMenuActive(menu) {
    if (menu.to && route.path === menu.to) {
        return true;
    }
    if (menu.children) {
        return menu.children.some((child) => route.path === child.to);
    }
    return false;
}

function isSubMenuActive(child) {
    return route.path === child.to;
}

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
</script>

<template>
    <aside class="sidebar">
        <ul class="menu-list">
            <li
                v-for="menu in menus"
                :key="menu.id"
                :class="{
                    open: openMenus.includes(menu.id),
                    active: isMenuActive(menu),
                }"
            >
                <div
                    class="menu-item"
                    :class="{ active: isMenuActive(menu) }"
                    @click="
                        menu.id === 9
                            ? logout()
                            : menu.children
                            ? toggleMenu(menu.id)
                            : $router.push(menu.to)
                    "
                >
                    <i
                        :class="[
                            'fa',
                            menu.icon,
                            'menu-icon',
                            { active: isMenuActive(menu) },
                        ]"
                    ></i>
                    <span>{{ menu.label }}</span>
                    <i
                        v-if="menu.children"
                        class="fa fa-chevron-down arrow-icon"
                        :class="{ rotated: openMenus.includes(menu.id) }"
                    ></i>
                </div>

                <ul
                    v-if="menu.children && openMenus.includes(menu.id)"
                    class="sub-menu"
                >
                    <li
                        v-for="child in menu.children"
                        :key="child.id"
                        class="sub-menu-item"
                        :class="{ active: isSubMenuActive(child) }"
                        @click="$router.push(child.to)"
                    >
                        <i class="fa fa-circle sub-menu-icon"></i>
                        <span>{{ child.label }}</span>
                    </li>
                </ul>
            </li>
        </ul>
    </aside>
</template>

<style scoped>
.sidebar {
    width: 260px;
    background-color: var(--dark-blue-color);
    /* height: 100vh; */
    overflow-y: auto;
    border-right: 1px solid var(--light-green-color);
    user-select: none;
    height: 100%;
    position: fixed;
    top: 80px;
    left: 0;
    bottom: 0;
    overflow-y: auto;
    box-shadow: 1px 0 5px rgba(0, 0, 0, 0.1);
    z-index: 999;
}

.menu-list {
    list-style: none;
}

.menu-item {
    display: flex;
    align-items: center;
    padding: 12px 30px;
    cursor: pointer;
    color: var(--black-color);
    font-size: 1.6rem;
    font-weight: 600;
    transition: background-color 0.3s ease;
    border-bottom: 1px solid var(--light-green-color);
}

.menu-item:hover {
    background-color: #a0b2b3;
}

.menu-icon {
    margin-right: 10px;
    font-size: 1.6rem;
}

/* active menu item */
.menu-item.active,
.menu-list > li.active > .menu-item {
    background-color: #609595;
    color: white;
}
.menu-item.active .menu-icon {
    color: white;
}

/* Mũi tên cho dropdown */
.arrow-icon {
    margin-left: auto;
    transition: transform 0.3s ease;
}

.arrow-icon.rotated {
    transform: rotate(180deg);
}

/* Sub menu */
.sub-menu {
    list-style: none;
    background-color: #b9cfcf;
}

.sub-menu-item {
    padding: 12px 20px 12px 40px;
    font-weight: 500;
    font-size: 1.4rem;
    cursor: pointer;
    color: var(--black-color);
    display: flex;
    align-items: center;
    gap: 15px;
    transition: background-color 0.2s ease;
}

.sub-menu-item:hover {
    background-color: #a0b2b3;
}

.sub-menu-icon {
    font-size: 0.6rem;
    color: #666;
}
/* active sub menu item */
.sub-menu-item.active {
    background-color: #609595;
    color: white;
}

.sub-menu-item.active .sub-menu-icon {
    color: white;
}
</style>
