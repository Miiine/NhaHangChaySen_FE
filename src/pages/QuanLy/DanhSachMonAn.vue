<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useSearchStore } from "@/stores/search";
import Swal from "sweetalert2";
import moment from "moment";

import { fetchMonAn, deleteMonAn } from "@/services/monan";
import { fetchLoaiMonAn } from "@/services/loaimonan";

const router = useRouter();

const searchStore = useSearchStore();
const searchText = computed(() => searchStore.getSearchText); // Lấy giá trị tìm kiếm từ store

const danhSachMonAn = ref([]);
const danhSachLoaiMonAn = ref([]);

const activeTab = ref("tat_ca");
const currentPage = ref(1);
const itemsPerPage = 12;
const selectedIds = ref(new Set());

const tabs = ref([{ maLoai: "tat_ca", tenLoai: "Tất cả" }]); // mặc định có "Tất cả"

const toPage = (page) => {
    router.push({ name: page });
    window.scrollTo(0, 0);
};

const loadLoaiMonAn = async () => {
    try {
        const res = await fetchLoaiMonAn();
        danhSachLoaiMonAn.value = res;
        tabs.value = [
            { maLoai: "tat_ca", tenLoai: "Tất cả" },
            ...danhSachLoaiMonAn.value,
        ];
    } catch (err) {
        console.error("Lỗi tải loại món ăn:", err);
    }
};

const onDeleteMonAn = async (maMonAn) => {
    const result = await Swal.fire({
        title: "Bạn có chắc muốn xóa món ăn này?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
        try {
            await deleteMonAn(maMonAn);
            Swal.fire("Đã xóa!", "", "success");
            await loadMonAn();
        } catch (error) {
            Swal.fire("Lỗi khi xóa!", error.message || "", "error");
        }
    }
};

async function onDeleteSelected() {
    if (selectedIds.value.size === 0) return;

    const result = await Swal.fire({
        title: `Bạn có chắc muốn xóa ${selectedIds.value.size} món ăn đã chọn?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
        try {
            // Lặp qua từng món ăn đã chọn và xóa từng món ăn một
            for (const id of selectedIds.value) {
                await deleteMonAn(id);
                danhSachMonAn.value = danhSachMonAn.value.filter(
                    (item) => item.maMonAn !== id
                );
            }

            selectedIds.value.clear();

            Swal.fire("Đã xóa!", "", "success");

            await loadMonAn();
        } catch (error) {
            Swal.fire(
                "Lỗi khi xóa!",
                error.message || "Không thể xóa món ăn",
                "error"
            );
        }
    }
}
const loadMonAn = async () => {
    try {
        const res = await fetchMonAn();
        danhSachMonAn.value = res.sort((a, b) => {
            const dateA = moment(a.created_at, "YYYY-MM-DD HH:mm:ss");
            const dateB = moment(b.created_at, "YYYY-MM-DD HH:mm:ss");
            return dateB.isBefore(dateA) ? 1 : -1;
        });
        selectedIds.value.clear();
    } catch (err) {
        console.error("Lỗi tải danh sách món ăn:", err);
    }
};

const filteredMonAn = computed(() => {
    const search = searchText.value.toLowerCase();

    // Lọc theo tên món ăn hoặc tên loại món ăn
    const filteredBySearch = danhSachMonAn.value.filter((item) => {
        const tenMonAnMatch =
            item.tenMonAn && item.tenMonAn.toLowerCase().includes(search);
        const tenLoaiMatch =
            item.tenLoai && item.tenLoai.toLowerCase().includes(search);

        return tenMonAnMatch || tenLoaiMatch;
    });

    // Nếu đang ở tab "Tất cả" (all items), trả về kết quả lọc theo tên món ăn hoặc tên loại món ăn
    if (activeTab.value === "tat_ca") {
        return filteredBySearch;
    }

    // Nếu đang ở tab loại món ăn, kết hợp với lọc theo tab và tìm kiếm
    return filteredBySearch.filter((item) => item.maLoai === activeTab.value);
});

const totalPages = computed(() =>
    Math.ceil(filteredMonAn.value.length / itemsPerPage)
);

const pagedMonAn = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredMonAn.value.slice(start, start + itemsPerPage);
});

function changeTab(maLoai) {
    activeTab.value = maLoai;
    currentPage.value = 1;
    selectedIds.value.clear();
}

function toggleSelect(id) {
    if (selectedIds.value.has(id)) selectedIds.value.delete(id);
    else selectedIds.value.add(id);
}

const allChecked = computed(() => {
    if (pagedMonAn.value.length === 0) return false;
    return pagedMonAn.value.every((item) =>
        selectedIds.value.has(item.maMonAn)
    );
});

function toggleSelectAll() {
    if (allChecked.value) {
        pagedMonAn.value.forEach((item) =>
            selectedIds.value.delete(item.maMonAn)
        );
    } else {
        pagedMonAn.value.forEach((item) => selectedIds.value.add(item.maMonAn));
    }
}

function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        selectedIds.value.clear();
    }
}

function goToChiTietMonAn(maMonAn) {
    router.push({
        name: "ChiTietMonAnQL",
        params: { maMonAn },
    });
    window.scrollTo(0, 0);
}

function onAddNew() {
    router.push({ name: "ThemMoiMonAn" });
}

onMounted(async () => {
    await loadLoaiMonAn();
    await loadMonAn();
});
</script>

<template>
    <div class="page-container">
        <h3 class="title">Danh sách món ăn</h3>
        <hr />
        <div class="top-bar">
            <button class="btn-add" @click="toPage('ThemMonAn')">
                <i class="fas fa-plus"></i> Thêm mới
            </button>
        </div>

        <div class="tabs">
            <div
                v-for="tab in tabs"
                :key="tab.maLoai"
                class="tab"
                :class="{ active: activeTab === tab.maLoai }"
                @click="changeTab(tab.maLoai)"
            >
                {{ tab.tenLoai }}
            </div>
        </div>

        <div class="list-content">
            <table class="dish-table">
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
                        <th>Danh mục</th>
                        <th>Tên món</th>
                        <th>Hình ảnh</th>
                        <th>Giá gốc</th>
                        <th>Giá bán</th>
                        <th>Số lượng còn</th>
                        <th>Đơn vị tính</th>
                        <th>Chi tiết</th>
                        <th>Xóa</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in pagedMonAn" :key="item.maMonAn">
                        <td>
                            <input
                                type="checkbox"
                                :checked="selectedIds.has(item.maMonAn)"
                                @change="toggleSelect(item.maMonAn)"
                            />
                        </td>
                        <td>
                            {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                        </td>
                        <td>{{ item.tenLoai }}</td>
                        <td>{{ item.tenMonAn }}</td>
                        <td>
                            <img
                                v-if="item.anhMonAn.length > 0"
                                :src="item.anhMonAn[0].url"
                                alt="Hình món ăn"
                                class="dish-image"
                            />
                            <span v-else>-</span>
                        </td>
                        <td>{{ item.giaGoc.toLocaleString("vi-VN") }}đ</td>
                        <td>{{ item.donGia.toLocaleString("vi-VN") }}đ</td>
                        <td>{{ item.soLuongMonCon }}</td>
                        <td>{{ item.donViTinh }}</td>
                        <td>
                            <button
                                class="btn-detail"
                                @click="goToChiTietMonAn(item.maMonAn)"
                                title="Xem chi tiết"
                            >
                                <i class="fas fa-file-lines"></i>
                            </button>
                        </td>
                        <td>
                            <button
                                class="btn-delete"
                                @click="onDeleteMonAn(item.maMonAn)"
                                title="Xóa món ăn"
                            >
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                    <tr v-if="pagedMonAn.length === 0">
                        <td colspan="11" class="no-data">Không có món ăn</td>
                    </tr>
                </tbody>
            </table>

            <div class="bottom-controls">
                <button
                    class="btn-delete-selected"
                    @click="onDeleteSelected"
                    :disabled="selectedIds.size === 0"
                >
                    Xóa {{ selectedIds.size }} món ăn đã chọn
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
.dish-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.4rem;
    color: var(--black-color);
}

.dish-table th,
.dish-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}

.dish-table tbody tr td:nth-child(5) {
    text-align: left;
    padding-left: 10px;
}

.dish-table thead {
    background-color: var(--light-green-color);
    font-weight: 600;
}

.dish-image {
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

    .dish-table {
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

    .dish-table {
        display: block;
        overflow-x: auto;
        white-space: nowrap;
        font-size: 1rem;
    }

    .dish-table th,
    .dish-table td {
        padding: 8px 6px;
    }

    .dish-table tbody tr td:nth-child(5) {
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
