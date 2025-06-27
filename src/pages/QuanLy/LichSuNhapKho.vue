<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useSearchStore } from "@/stores/search";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import moment from "moment";

import { fetchPhieuNhapKho, deletePhieuNhapKho } from "@/services/phieunhapkho";

const router = useRouter();

const searchStore = useSearchStore();
const searchText = computed(() => searchStore.getSearchText); // Lấy giá trị tìm kiếm từ store

const danhSachPhieuNhapKho = ref([]);

const currentPage = ref(1);
const itemsPerPage = 8;
const selectedIds = ref(new Set());

const toPage = (page) => {
    router.push({ name: page });
    window.scrollTo(0, 0);
};

const formatDateTime = (datetime) => {
    if (!datetime) return "";
    return dayjs(datetime).format("HH:mm DD/MM/YYYY");
};

const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return "0đ";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
    }).format(value);
};

// Lấy dữ liệu phiếu nhập kho
const loadNhaCungCap = async () => {
    try {
        const res = await fetchPhieuNhapKho();
        danhSachPhieuNhapKho.value = res.sort((a, b) => {
            const dateA = moment(a.created_at, "YYYY-MM-DD HH:mm:ss");
            const dateB = moment(b.created_at, "YYYY-MM-DD HH:mm:ss");
            return dateB.isBefore(dateA) ? 1 : -1;
        });
        selectedIds.value.clear();
    } catch (err) {
        console.error("Lỗi tải dữ liệu phiếu nhập kho:", err);
    }
};

const filteredDanhSachPhieuNhapKho = computed(() => {
    const search = searchText.value.toLowerCase();

    // Kiểm tra nếu giá trị tìm kiếm là một ngày hợp lệ
    const isDateSearch = /^\d{2}\/\d{2}\/\d{4}$/.test(search); // Kiểm tra định dạng dd/mm/yyyy

    return danhSachPhieuNhapKho.value.filter((item) => {
        // Lọc theo mã phiếu nhập kho và chuyển nó thành chuỗi
        const maNhapKhoMatch =
            item.maNhapKho &&
            typeof item.maNhapKho !== "undefined" &&
            item.maNhapKho.toString().toLowerCase().includes(search);

        // Lọc theo nhà cung cấp
        const nhaCungCapMatch =
            item.nhaCungCap?.tenNCC &&
            typeof item.nhaCungCap?.tenNCC === "string" &&
            item.nhaCungCap?.tenNCC.toLowerCase().includes(search);

        // Lọc theo nhân viên nhập
        const nhanVienMatch =
            item.taiKhoan?.tenTaiKhoan &&
            typeof item.taiKhoan?.tenTaiKhoan === "string" &&
            item.taiKhoan?.tenTaiKhoan.toLowerCase().includes(search);

        // Lọc theo ngày nhập kho nếu giá trị tìm kiếm là một ngày
        const dateMatch =
            isDateSearch &&
            moment(item.thoiGianNhapKho).format("DD/MM/YYYY") === search;

        return maNhapKhoMatch || nhaCungCapMatch || nhanVienMatch || dateMatch;
    });
});

// Phân trang
const totalPages = computed(() =>
    Math.ceil(filteredDanhSachPhieuNhapKho.value.length / itemsPerPage)
);

const pagedPNK = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredDanhSachPhieuNhapKho.value.slice(
        start,
        start + itemsPerPage
    );
});

// Chọn / bỏ chọn từng checkbox
function toggleSelect(maNhapKho) {
    if (selectedIds.value.has(maNhapKho)) selectedIds.value.delete(maNhapKho);
    else selectedIds.value.add(maNhapKho);
}

// Chọn / bỏ chọn tất cả
const allChecked = computed(() => {
    if (pagedPNK.value.length === 0) return false;
    return pagedPNK.value.every((item) =>
        selectedIds.value.has(item.maNhapKho)
    );
});

function toggleSelectAll() {
    if (allChecked.value) {
        pagedPNK.value.forEach((item) =>
            selectedIds.value.delete(item.maNhapKho)
        );
    } else {
        pagedPNK.value.forEach((item) => selectedIds.value.add(item.maNhapKho));
    }
}

// Chuyển trang
function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        selectedIds.value.clear();
    }
}

// Xem chi tiết
function goToChiTiet(maNhapKho) {
    router.push({
        name: "ChiTietPhieuNhapKho",
        params: { maNhapKho },
    });
    window.scrollTo(0, 0);
}

// Xóa 1 phiếu nhập kho
const onDeletePhieuNhapKho = async (maNhapKho) => {
    const result = await Swal.fire({
        title: "Bạn có chắc muốn xóa phiếu nhập kho này?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
        try {
            await deletePhieuNhapKho(maNhapKho);

            await loadNhaCungCap();

            Swal.fire("Đã xóa!", "", "success");
        } catch (error) {
            Swal.fire("Lỗi khi xóa!", error.message || "", "error");
        }
    }
};

// Xóa nhiều phiếu nhập kho đã chọn
const onDeleteSelected = async () => {
    if (selectedIds.value.size === 0) {
        return Swal.fire(
            "Thông báo",
            "Bạn chưa chọn phiếu nhập kho nào để xóa.",
            "info"
        );
    }

    const result = await Swal.fire({
        title: `Bạn có chắc muốn xóa ${selectedIds.value.size} phiếu nhập kho đã chọn?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
        try {
            const selectedIdsArray = Array.from(selectedIds.value);

            for (const maNhapKho of selectedIdsArray) {
                await deletePhieuNhapKho(maNhapKho);
            }

            await loadNhaCungCap();

            selectedIds.value.clear();

            Swal.fire("Đã xóa!", "", "success");
        } catch (error) {
            Swal.fire("Lỗi khi xóa!", error.message || "", "error");
        }
    }
};

onMounted(() => {
    loadNhaCungCap();
});
</script>

<template>
    <div class="page-container">
        <h3 class="title">Lịch sử nhập kho</h3>
        <hr />
        <div class="top-bar">
            <button class="btn-add" @click="toPage('ThemPhieuNhapKho')">
                <i class="fas fa-plus"></i> Thêm mới
            </button>
        </div>

        <div class="list-content">
            <table class="ncc-table">
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
                        <th>Mã phiếu nhập</th>
                        <th>Thời gian nhập kho</th>
                        <th>Nhà cung cấp</th>
                        <th>Nhân viên nhập</th>
                        <th>Tổng tiền</th>
                        <th>Chi tiết</th>
                        <th>Xóa</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in pagedPNK" :key="item.maNhapKho">
                        <td>
                            <input
                                type="checkbox"
                                :checked="selectedIds.has(item.maNhapKho)"
                                @change="toggleSelect(item.maNhapKho)"
                            />
                        </td>
                        <td>
                            {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                        </td>
                        <td>{{ item.maNhapKho }}</td>
                        <td>{{ formatDateTime(item.thoiGianNhapKho) }}</td>
                        <td>{{ item.nhaCungCap.tenNCC }}</td>
                        <td>{{ item.taiKhoan.tenTaiKhoan }}</td>
                        <td>{{ formatCurrency(item.tongTien) }}</td>
                        <td>
                            <button
                                class="btn-detail"
                                @click="goToChiTiet(item.maNhapKho)"
                                title="Xem chi tiết"
                            >
                                <i class="fas fa-file-lines"></i>
                            </button>
                        </td>
                        <td>
                            <button
                                class="btn-delete"
                                @click="onDeletePhieuNhapKho(item.maNhapKho)"
                                title="Xóa phiếu nhập kho"
                            >
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                    <tr v-if="pagedPNK.length === 0">
                        <td colspan="7" class="no-data">
                            Không có phiếu nhập kho
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
                    Xóa {{ selectedIds.size }} phiếu nhập kho đã chọn
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

.list-content {
    padding: 0 10px;
}

/* Table */
.ncc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.4rem;
    color: var(--black-color);
}

.ncc-table th,
.ncc-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}

.ncc-table thead {
    background-color: var(--light-green-color);
    font-weight: 600;
}

.ncc-table tbody tr td:nth-child(5),
.ncc-table tbody tr td:nth-child(6) {
    text-align: left;
    padding-left: 12px;
}

.ncc-table tbody tr td:nth-child(7) {
    text-align: right;
    padding-left: 12px;
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

    .list-content {
        padding: 0 5px;
    }

    .ncc-table {
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

    .list-content {
        padding: 0;
    }

    .ncc-table {
        display: block;
        overflow-x: auto;
        white-space: nowrap;
        font-size: 1rem;
    }

    .ncc-table th,
    .ncc-table td {
        padding: 8px 6px;
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
