<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useSearchStore } from "@/stores/search";
import Swal from "sweetalert2";
import moment from "moment";

import { fetchKhuyenMai, deleteKhuyenMai } from "@/services/khuyenmai";

const router = useRouter();

const searchStore = useSearchStore();
const searchText = computed(() => searchStore.getSearchText); // Lấy giá trị tìm kiếm từ store

const danhSachKhuyenMai = ref([]);

// Lọc và phân trang
const activeTab = ref("tat_ca");
const currentPage = ref(1);
const itemsPerPage = 5;
const selectedIds = ref(new Set());

const tabs = [
    { key: "tat_ca", label: "Tất cả" },
    { key: "con_han", label: "Còn hạn" },
    { key: "het_han", label: "Hết hạn" },
];

const toPage = (page) => {
    router.push({ name: page });
    window.scrollTo(0, 0);
};

function goToChiTiet(maKhuyenMai) {
    router.push({ name: "ChiTietQLUuDai", params: { maKhuyenMai } });
    window.scrollTo(0, 0);
}

const changeTab = (tabKey) => {
    activeTab.value = tabKey;
    currentPage.value = 1;
    selectedIds.value.clear();
};

const now = new Date();

const filteredKhuyenMai = computed(() => {
    const search = searchText.value.toLowerCase();

    // Bước 1: Lọc theo tab
    const filteredByTab = danhSachKhuyenMai.value.filter((item) => {
        const thoiGianApDungDate = new Date(item.thoiGianApDung);
        const thoiGianHetHanDate = new Date(item.thoiGianHetHan);

        if (activeTab.value === "con_han") {
            // Còn hạn: Thời gian áp dụng >= hiện tại và thời gian hết hạn >= hiện tại
            return now >= thoiGianApDungDate && now <= thoiGianHetHanDate;
        } else if (activeTab.value === "het_han") {
            // Hết hạn: Thời gian hết hạn < hiện tại
            return now > thoiGianHetHanDate;
        } else if (activeTab.value === "tat_ca") {
            // Tất cả: Không phân biệt thời gian
            return true;
        }
        return false;
    });

    // Bước 2: Lọc theo từ khóa tìm kiếm (thoiGianApDung, tenKhuyenMai, phanTram)
    const filteredBySearch = filteredByTab.filter((item) => {
        // Lọc theo thời gian áp dụng
        const thoiGianApDungMatch =
            item.thoiGianApDung &&
            moment(item.thoiGianApDung, "YYYY-MM-DD")
                .format("DD/MM/YYYY")
                .includes(search);

        // Lọc theo tên khuyến mãi
        const tenKhuyenMaiMatch =
            item.tenKhuyenMai &&
            item.tenKhuyenMai.toLowerCase().includes(search);

        // Lọc theo phần trăm
        const phanTramMatch =
            item.phanTram &&
            item.phanTram.toString().toLowerCase().includes(search);

        return thoiGianApDungMatch || tenKhuyenMaiMatch || phanTramMatch;
    });

    return filteredBySearch;
});

const totalPages = computed(() =>
    Math.ceil(filteredKhuyenMai.value.length / itemsPerPage)
);

const pagedKhuyenMai = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredKhuyenMai.value.slice(start, start + itemsPerPage);
});

function toggleSelect(id) {
    if (selectedIds.value.has(id)) {
        selectedIds.value.delete(id);
    } else {
        selectedIds.value.add(id);
    }
}

const allChecked = computed(() => {
    if (pagedKhuyenMai.value.length === 0) return false;
    return pagedKhuyenMai.value.every((item) =>
        selectedIds.value.has(item.maKhuyenMai)
    );
});

function toggleSelectAll() {
    if (allChecked.value) {
        pagedKhuyenMai.value.forEach((item) => {
            selectedIds.value.delete(item.maKhuyenMai);
        });
    } else {
        pagedKhuyenMai.value.forEach((item) => {
            selectedIds.value.add(item.maKhuyenMai);
        });
    }
}

function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        selectedIds.value.clear();
    }
}

// Hàm xóa một mã khuyến mãi
async function onDeleteKhuyenMai(maKhuyenMai) {
    const result = await Swal.fire({
        title: "Bạn có chắc muốn xóa mã khuyến mãi này?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
        try {
            await deleteKhuyenMai(maKhuyenMai);
            danhSachKhuyenMai.value = danhSachKhuyenMai.value.filter(
                (item) => item.maKhuyenMai !== maKhuyenMai
            );
            selectedIds.value.delete(maKhuyenMai);
            await loadData();
            Swal.fire("Đã xóa!", "", "success");
        } catch (error) {
            Swal.fire("Lỗi khi xóa!", error.message || "", "error");
        }
    }
}

// Hàm xóa nhiều mã khuyến mãi đã chọn
async function onDeleteSelected() {
    if (selectedIds.value.size === 0) return;

    const result = await Swal.fire({
        title: `Bạn có chắc muốn xóa ${selectedIds.value.size} mã khuyến mãi đã chọn?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
        try {
            // Lặp qua từng mã khuyến mãi đã chọn và xóa
            for (const id of selectedIds.value) {
                await deleteKhuyenMai(id);
                danhSachKhuyenMai.value = danhSachKhuyenMai.value.filter(
                    (item) => item.maKhuyenMai !== id
                );
            }

            selectedIds.value.clear();

            Swal.fire("Đã xóa!", "", "success");

            await loadData();
        } catch (error) {
            Swal.fire(
                "Lỗi khi xóa!",
                error.message || "Không thể xóa mã khuyến mãi",
                "error"
            );
        }
    }
}

const loadData = async () => {
    try {
        const km = await fetchKhuyenMai();
        danhSachKhuyenMai.value = km.sort((a, b) => {
            const dateA = moment(a.created_at, "YYYY-MM-DD HH:mm:ss");
            const dateB = moment(b.created_at, "YYYY-MM-DD HH:mm:ss");
            return dateB.isBefore(dateA) ? 1 : -1;
        });
        selectedIds.value.clear();
    } catch (err) {
        console.error("Lỗi tải dữ liệu khuyến mãi:", err);
    }
};

onMounted(() => {
    loadData();
});
</script>

<template>
    <div class="page-container">
        <h3 class="title">Quản lý mã khuyến mãi</h3>
        <hr />
        <div class="top-bar">
            <button class="btn-add" @click="toPage('ThemMoiUuDai')">
                <i class="fas fa-plus"></i> Thêm mới
            </button>
        </div>
        <div class="list-container">
            <div class="tabs">
                <div
                    v-for="tab in tabs"
                    :key="tab.key"
                    class="tab"
                    :class="{ active: activeTab === tab.key }"
                    @click="changeTab(tab.key)"
                >
                    {{ tab.label }}
                </div>
            </div>

            <div class="list-content">
                <table class="promotion-table">
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    :checked="allChecked"
                                    @change="toggleSelectAll"
                                />
                            </th>
                            <th>STT</th>
                            <th>Thời gian ưu đãi</th>
                            <th>Thời gian hết hạn</th>
                            <th>Hình ảnh</th>
                            <th>Tên ưu đãi</th>
                            <th>Điều kiện áp dụng</th>
                            <th>Phần trăm</th>
                            <th>Số lượng</th>
                            <th>Chi tiết</th>
                            <th>Xóa</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(item, index) in pagedKhuyenMai"
                            :key="item.maKhuyenMai"
                        >
                            <td>
                                <input
                                    type="checkbox"
                                    :checked="selectedIds.has(item.maKhuyenMai)"
                                    @change="toggleSelect(item.maKhuyenMai)"
                                />
                            </td>
                            <td>
                                {{
                                    (currentPage - 1) * itemsPerPage + index + 1
                                }}
                            </td>
                            <td>
                                {{
                                    moment(item.thoiGianApDung).format(
                                        "DD/MM/YYYY"
                                    )
                                }}
                            </td>
                            <td>
                                {{
                                    moment(item.thoiGianHetHan).format(
                                        "DD/MM/YYYY"
                                    )
                                }}
                            </td>
                            <td>
                                <img
                                    v-if="item.hinhAnh"
                                    :src="item.hinhAnh"
                                    alt="Hình khuyến mãi"
                                    class="promo-image"
                                />
                                <span v-else>-</span>
                            </td>
                            <td>{{ item.tenKhuyenMai }}</td>
                            <td>
                                Hóa đơn có giá trị từ
                                {{
                                    parseInt(
                                        item.dieuKienApDung
                                    ).toLocaleString("vi-VN")
                                }}đ
                            </td>
                            <td>{{ item.phanTram }}%</td>
                            <td>{{ item.soLuong }}</td>
                            <td>
                                <button
                                    class="btn-detail"
                                    @click="goToChiTiet(item.maKhuyenMai)"
                                    title="Xem chi tiết"
                                >
                                    <i class="fas fa-file-lines"></i>
                                </button>
                            </td>
                            <td>
                                <button
                                    class="btn-delete"
                                    @click="onDeleteKhuyenMai(item.maKhuyenMai)"
                                    title="Xóa mã khuyến mãi"
                                >
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                        <tr v-if="pagedKhuyenMai.length === 0">
                            <td colspan="9" class="no-data">
                                Không có mã khuyến mãi
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="bottom-controls">
                    <button
                        class="btn-delete-selected"
                        @click="onDeleteSelected"
                        :disabled="selectedIds.size === 0"
                    >
                        Xóa {{ selectedIds.size }} mã khuyến mãi đã chọn
                    </button>

                    <div class="pagination">
                        <button
                            @click="goToPage(currentPage - 1)"
                            :disabled="currentPage === 1"
                        >
                            &lt;
                        </button>

                        <span class="page-numbers">
                            <button
                                v-for="page in totalPages"
                                :key="page"
                                :class="{ active: currentPage === page }"
                                @click="goToPage(page)"
                            >
                                {{ page }}
                            </button>
                        </span>

                        <button
                            @click="goToPage(currentPage + 1)"
                            :disabled="currentPage === totalPages"
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page-container {
    margin: 20px 50px;
    color: var(--black-color);
}

.title {
    font-weight: 600;
    font-size: 2rem;
    margin-bottom: 6px;
}

hr {
    border: none;
    border-top: 1px solid var(--dark-gray-color);
    margin-bottom: 30px;
}

.top-bar {
    margin-bottom: 35px;
}

.btn-add {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--dark-blue-color);
    border: none;
    border-radius: 8px;
    padding: 8px 14px;
    cursor: pointer;
    user-select: none;
    font-weight: 600;
    font-size: 1.4rem;
    color: var(--black-color);
    transition: background-color 0.3s ease;
    text-transform: uppercase;
}

.btn-add:hover {
    background: #a0b6c2;
}

.list-container {
    background-color: var(--white-color);
    box-shadow: 1px 1px 6px rgb(0 0 0 / 0.5);
    border: 1px solid var(--light-gray-color);
    padding: 20px 10px;
    border-radius: 6px;
}

/* Filter tabs */
.tabs {
    display: flex;
    justify-content: space-around;
    margin-bottom: 20px;
}

.tab {
    font-size: 1.4rem;
    font-weight: 600;
    cursor: pointer;
    padding: 10px;
    color: var(--dark-gray-color);
    border-bottom: 3px solid transparent;
    text-align: center;
    text-transform: uppercase;
}

.tab:hover {
    color: var(--black-color);
}

.tab.active {
    color: var(--blue-color);
    border-bottom: 3px solid var(--blue-color);
}

.list-content {
    padding: 0 10px;
}

/* Table */
.promotion-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.4rem;
    color: var(--black-color);
}

.promotion-table th,
.promotion-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}

.promotion-table tbody tr td:nth-child(5) {
    text-align: left;
    padding-left: 10px;
}

.promotion-table thead {
    background-color: var(--light-green-color);
    font-weight: 600;
}

.promo-image {
    max-width: 80px;
    max-height: 50px;
    object-fit: contain;
    border-radius: 4px;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}

.no-data {
    text-align: center;
    padding: 20px;
    font-style: italic;
    color: var(--dark-gray-color);
}

/* Bottom controls */
.bottom-controls {
    margin-top: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
}

.btn-delete-selected {
    padding: 8px 12px;
    background-color: #e53e3e;
    border: none;
    color: white;
    border-radius: 4px;
    cursor: pointer;
}

.btn-delete-selected:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Buttons chung */
.btn-detail,
.btn-delete {
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.25s ease, color 0.25s ease;
}

.btn-detail i,
.btn-delete i {
    font-size: 1.3rem;
    vertical-align: middle;
    transition: color 0.25s ease;
}

/* Nút chi tiết */
.btn-detail {
    background-color: #fff;
    color: #2f855a;
}

.btn-detail:hover {
    color: #276749;
}

/* Nút xóa */
.btn-delete {
    background-color: #fff;
    color: #e53e3e;
}

.btn-delete:hover {
    color: #9b2c2c;
}

/* Pagination */
.pagination {
    display: flex;
    align-items: center;
    gap: 6px;
}

.pagination button {
    padding: 6px 10px;
    border: 1px solid var(--dark-gray-color);
    background-color: white;
    cursor: pointer;
    border-radius: 4px;
    font-weight: 600;
    color: var(--dark-gray-color);
    transition: background-color 0.2s, color 0.2s;
}

.pagination button:hover {
    background-color: var(--light-blue-color);
    border-color: var(--blue-color);
}

.pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.pagination button.active {
    background-color: var(--light-blue-color);
    color: var(--blue-color);
    border-color: var(--blue-color);
}

.page-numbers {
    display: flex;
    gap: 6px;
}

/* Responsive */
@media (max-width: 1024px) {
    .page-container {
        margin: 20px 30px;
        font-size: 14px;
    }

    .title {
        font-size: 1.6rem;
    }

    .tab {
        font-size: 1.2rem;
        padding: 8px 6px;
    }

    .list-content {
        padding: 0 5px;
    }

    .promotion-table {
        font-size: 1.2rem;
    }

    .btn-detail i,
    .btn-delete i {
        font-size: 1rem;
    }

    .bottom-controls {
        flex-direction: column;
        gap: 12px;
    }

    .btn-delete-selected {
        font-size: 1.1rem;
        padding: 8px 10px;
        width: 100%;
    }

    .pagination {
        justify-content: center;
        flex-wrap: wrap;
    }

    .pagination button {
        font-size: 1rem;
        padding: 6px 10px;
    }
}

@media (max-width: 767px) {
    .page-container {
        margin: 15px 15px;
        font-size: 12px;
    }

    .title {
        font-size: 1.4rem;
        margin-bottom: 12px;
    }

    .tabs {
        flex-direction: column;
        gap: 10px;
    }

    .tab {
        font-size: 1rem;
        padding: 10px 8px;
        text-align: left;
        border-bottom: none;
        border-left: 4px solid transparent;
    }

    .tab.active {
        border-left: 4px solid var(--dark-gray-color);
        background-color: #f9f9f9;
        color: var(--blue-color);
    }

    .list-content {
        padding: 0;
    }

    .promotion-table {
        display: block;
        overflow-x: auto;
        white-space: nowrap;
        font-size: 1rem;
    }

    .promotion-table th,
    .promotion-table td {
        padding: 8px 6px;
    }

    .promotion-table tbody tr td:nth-child(5) {
        text-align: left;
        padding-left: 6px;
    }

    .btn-detail i,
    .btn-delete i {
        font-size: 1rem;
    }

    .bottom-controls {
        flex-direction: column;
        gap: 12px;
    }

    .btn-delete-selected {
        font-size: 1rem;
        padding: 10px 12px;
        width: 100%;
    }

    .pagination {
        justify-content: center;
        flex-wrap: wrap;
        gap: 8px;
    }

    .pagination button {
        font-size: 1rem;
        padding: 8px 12px;
        min-width: 36px;
    }
}
</style>
