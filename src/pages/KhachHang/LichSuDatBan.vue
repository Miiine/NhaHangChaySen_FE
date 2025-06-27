<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Swal from "sweetalert2";
import BreadCrumb from "@/components/BreadCrumb.vue";
import { fetchHoaDon, autoCancelHoaDon } from "@/services/hoadon";

const { user } = useAuthStore();
const auth = useAuthStore();
const router = useRouter();

const hoaDonList = ref([]);
const selectedTrangThai = ref("tat_ca");
const currentPage = ref(1);
const itemsPerPage = 6;

const toPage = (page) => {
    router.push({ name: page });
    window.scrollTo(0, 0);
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

const goToChiTietHoaDon = (maHoaDon) => {
    router.push({ name: "ChiTietHoaDon", params: { maHoaDon } });
};

const filterHoaDon = () => {
    currentPage.value = 1;
};

const filteredHoaDon = computed(() => {
    switch (selectedTrangThai.value) {
        case "tat_ca":
            return hoaDonList.value;
        case "da_hoan_thanh":
            return hoaDonList.value.filter(
                (h) => h.trangThai == "da_hoan_thanh"
            );
        case "chua_thanh_toan":
            return hoaDonList.value.filter(
                (h) =>
                    h.trangThaiTT === "chua_thanh_toan" &&
                    h.trangThai !== "da_huy"
            );
        case "cho_duyet":
            return hoaDonList.value.filter(
                (h) =>
                    ["coc", "toan_bo"].includes(h.trangThaiTT) &&
                    h.trangThai === "cho_duyet"
            );
        case "da_duyet":
            return hoaDonList.value.filter(
                (h) =>
                    ["coc", "toan_bo"].includes(h.trangThaiTT) &&
                    h.trangThai === "da_duyet"
            );
        case "da_huy":
            return hoaDonList.value.filter((h) => h.trangThai === "da_huy");
        default:
            return [];
    }
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);
const endIndex = computed(() => startIndex.value + itemsPerPage);

const paginatedHoaDon = computed(() =>
    filteredHoaDon.value.slice(startIndex.value, endIndex.value)
);

const prevPage = () => {
    if (currentPage.value > 1) currentPage.value--;
};
const nextPage = () => {
    if (endIndex.value < filteredHoaDon.value.length) currentPage.value++;
};

const formatDate = (datetimeStr) => {
    if (!datetimeStr) return "";
    const date = new Date(datetimeStr);
    return date.toLocaleDateString("vi-VN");
};

const formatTime = (datetimeStr) => {
    if (!datetimeStr) return "";
    const date = new Date(datetimeStr);
    return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatCurrency = (value) =>
    Number(value).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
    });

const getStatusLabel = (hd) => {
    if (hd.trangThai === "da_huy") return "Đã hủy";
    if (hd.trangThai == "da_hoan_thanh") return "Đã hoàn thành";
    if (hd.trangThaiTT === "chua_thanh_toan") return "Chưa thanh toán";
    if (!hd.trangThai || hd.trangThai === "") return "Chưa thanh toán";
    if (hd.trangThai === "cho_duyet") return "Chờ duyệt";
    if (hd.trangThai === "da_duyet") return "Đã duyệt";
    return "Khác";
};

const getStatusClass = (hd) => {
    if (hd.trangThai === "da_huy") return "da_huy";
    if (hd.trangThai == "da_hoan_thanh") return "da_hoan_thanh";
    if (hd.trangThaiTT === "chua_thanh_toan") return "chua_thanh_toan";
    if (!hd.trangThai || hd.trangThai === "") return "chua_thanh_toan";
    if (hd.trangThai === "cho_duyet") return "cho_duyet";
    if (hd.trangThai === "da_duyet") return "da_duyet";
    return "";
};

async function loadData() {
    try {
        let hdData = await fetchHoaDon();

        //tự động cập nhật hủy hóa đơn khi chưa thanh toán sau 1h đặt bàn
        const now = new Date();
        for (const hd of hdData) {
            if (
                hd.trangThaiTT === "chua_thanh_toan" && // chỉ chưa thanh toán
                hd.trangThai !== "da_huy" &&
                hd.thoiGianDatBan &&
                now - new Date(hd.thoiGianDatBan) > 60 * 60 * 1000
            ) {
                // Gọi API tự động hủy
                await autoCancelHoaDon(hd.maHoaDon);
            }
        }

        // Lấy lại danh sách sau khi cập nhật
        hdData = await fetchHoaDon();

        // Lọc hóa đơn của user hiện tại
        const filtered = hdData.filter((hd) => hd.maTaiKhoan === user.id);

        // Sắp xếp giảm dần theo thời gian đặt bàn
        filtered.sort(
            (a, b) => new Date(b.thoiGianDatBan) - new Date(a.thoiGianDatBan)
        );
        hoaDonList.value = filtered;
    } catch (err) {
        console.error("Lỗi loadData:", err);
    }
}

onMounted(async () => {
    await loadData();
});
</script>

<template>
    <BreadCrumb />
    <div class="page-container">
        <div class="left-nav">
            <ul>
                <li @click="toPage('ThongTinCaNhan')">Thông tin tài khoản</li>
                <li @click="toPage('DanhSachYeuThich')">Món ăn yêu thích</li>
                <li class="active" @click="toPage('LichSuDatBan')">
                    Lịch sử đặt bàn
                </li>
                <li @click="toPage('ThongBao')">Thông báo</li>
                <li @click="logout">Đăng xuất</li>
            </ul>
        </div>

        <div class="right-content">
            <h2>Lịch sử đặt bàn</h2>
            <div class="hoa-don-wrapper">
                <div class="filter-box">
                    <select v-model="selectedTrangThai" @change="filterHoaDon">
                        <option value="tat_ca">Tất cả</option>
                        <option value="da_hoan_thanh">Đã hoàn thành</option>
                        <option value="chua_thanh_toan">Chưa thanh toán</option>
                        <option value="cho_duyet">Chờ duyệt</option>
                        <option value="da_duyet">Đã duyệt</option>
                        <option value="da_huy">Đã hủy</option>
                    </select>
                </div>

                <div class="list-hoa-don">
                    <template v-if="paginatedHoaDon.length > 0">
                        <div
                            v-for="hd in paginatedHoaDon"
                            :key="hd.maHoaDon"
                            class="hoa-don-item"
                            @click="goToChiTietHoaDon(hd.maHoaDon)"
                        >
                            <div class="hoa-don-left">
                                <div class="hoa-don-time">
                                    {{ formatTime(hd.thoiGianSuDung) }}
                                </div>
                                <div class="hoa-don-date">
                                    {{ formatDate(hd.thoiGianSuDung) }}
                                </div>
                                <div class="hoa-don-name">{{ hd.hoTen }}</div>
                            </div>

                            <div class="hoa-don-right">
                                <span
                                    :class="['status-tag', getStatusClass(hd)]"
                                >
                                    {{ getStatusLabel(hd) }}
                                </span>
                                <div class="ma-hoa-don">#{{ hd.maHoaDon }}</div>
                                <div class="thanh-tien">
                                    {{ formatCurrency(hd.thanhTien) }}
                                </div>
                            </div>
                        </div>

                        <div class="pagination">
                            <button
                                @click="prevPage"
                                :disabled="currentPage === 1"
                            >
                                &lt;
                            </button>
                            <span>{{ currentPage }}</span>
                            <button
                                @click="nextPage"
                                :disabled="endIndex >= filteredHoaDon.length"
                            >
                                &gt;
                            </button>
                        </div>
                    </template>

                    <template v-else>
                        <div class="no-data-container">
                            <img
                                src="/assets/images/no-data.webp"
                                alt="Không có dữ liệu"
                            />
                            <p>Không có hóa đơn nào để hiển thị.</p>
                        </div>
                    </template>
                </div>
            </div>
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
    padding: 0;
    margin: 0;
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

.hoa-don-wrapper {
    display: flex;
    gap: 40px;
}

.filter-box {
    width: 220px;
}

.filter-box select {
    border-radius: 5px;
    width: 100%;
    padding: 10px;
    font-size: 1.6rem;
    border: 1px solid var(--light-gray-color);
}

.list-hoa-don {
    flex: 1;
    margin: 0 20px;
    min-height: 500px;
}

.hoa-don-item {
    background: var(--white-color);
    border-radius: 8px;
    padding: 20px 0px 20px 40px;
    box-shadow: 0 1px 6px rgb(0 0 0 / 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
}

.hoa-don-item:hover {
    background: var(--light-blue-color);
}

.hoa-don-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-grow: 1;
}

.hoa-don-time {
    font-weight: 700;
    font-size: 2.2rem;
    line-height: 1;
    color: var(--black-color);
}

.hoa-don-date {
    font-size: 1.2rem;
    color: var(--dark-gray-color);
    margin-top: 2px;
}

.hoa-don-name {
    margin-top: 10px;
    font-weight: 600;
    font-size: 1.6rem;
    color: var(--black-color);
}

.hoa-don-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    min-width: 110px;
}

.status-tag {
    font-weight: 600;
    font-size: 1.4rem;
    color: var(--white-color);
    padding: 8px 10px;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
    white-space: nowrap;
    min-width: 150px;
    text-align: left;
}

.status-tag.da_hoan_thanh {
    background-color: var(--green-color);
}

.status-tag.chua_thanh_toan {
    background-color: var(--dark-gray-color);
}

.status-tag.cho_duyet {
    background-color: var(--yellow-color);
}

.status-tag.da_duyet {
    background-color: var(--blue-color);
}

.status-tag.da_huy {
    background-color: var(--red-color);
}

.ma-hoa-don {
    font-size: 1.4rem;
    color: var(--dark-gray-color);
    margin-right: 40px;
}

.thanh-tien {
    font-weight: 700;
    font-size: 1.8rem;
    color: var(--black-color);
    margin-right: 40px;
}

.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
}

.pagination button {
    padding: 6px 12px;
}

@media (max-width: 1200px) {
    .right-content {
        padding: 40px 50px;
    }

    .hoa-don-wrapper {
        gap: 30px;
        flex-direction: column;
    }

    .filter-box {
        width: 100%;
        margin-bottom: 20px;
    }

    .list-hoa-don {
        margin: 0;
        min-height: auto;
    }
}

@media (max-width: 768px) {
    .right-content {
        padding: 20px 20px;
    }

    .hoa-don-item {
        flex-direction: column;
        align-items: flex-start;
        padding: 15px 20px;
    }

    .hoa-don-left {
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 10px;
    }

    .hoa-don-right {
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
    }

    .status-tag {
        min-width: auto;
        padding: 6px 8px;
        font-size: 1.2rem;
    }

    .ma-hoa-don,
    .thanh-tien {
        margin-right: 10px;
        font-size: 1.4rem;
    }

    .hoa-don-time {
        font-size: 1.8rem;
    }
}

@media (max-width: 480px) {
    .left-nav {
        width: 100%;
        display: flex;
        overflow-x: auto;
    }

    .left-nav ul {
        display: flex;
        padding: 0;
        margin: 0;
    }

    .left-nav ul li {
        flex: 1 0 auto;
        text-align: center;
        padding: 12px 10px;
        font-size: 1.3rem;
        white-space: nowrap;
    }

    .right-content {
        padding: 15px 10px;
    }

    h2 {
        font-size: 2rem;
    }

    .hoa-don-item {
        padding: 12px 15px;
    }

    .hoa-don-time {
        font-size: 1.6rem;
    }

    .hoa-don-date {
        font-size: 1rem;
    }

    .hoa-don-name {
        font-size: 1.2rem;
    }

    .status-tag {
        font-size: 1rem;
        padding: 5px 6px;
    }

    .ma-hoa-don,
    .thanh-tien {
        font-size: 1.2rem;
        margin-right: 5px;
    }

    .pagination button {
        padding: 6px 8px;
        font-size: 1.2rem;
    }
}
</style>
