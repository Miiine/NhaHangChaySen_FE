<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import BaseButton from "@/components/BaseButton.vue";

import {
    fetchBan,
    addBan,
    updateBan,
    deleteBan,
    deleteMultipleBan,
} from "@/services/ban";
import { fetchKhuVuc } from "@/services/khuvuc";
import { fetchLoaiBan } from "@/services/loaiban";

const router = useRouter();

const khuVucList = ref([]);
const loaiBanList = ref([]);
const banList = ref([]);
const selectedKhuVuc = ref("");
const selectedLoaiBan = ref("");
const selectedItems = ref(new Set());

const currentPage = ref(1);
const pageSize = 8;

const modalVisible = ref(false);
const isEditMode = ref(false); // false = thêm mới, true = sửa
const originalBan = ref(null); // Lưu bàn gốc khi sửa

const form = ref({
    soBan: "",
    maKhuVuc: "",
    maLoaiBan: "",
    trangThai: "",
});

const goBack = () => {
    router.back();
};

const trangThaiList = [
    { value: "dat_cho", label: "Đã đặt trước" },
    { value: "dang_phuc_vu", label: "Đang sử dụng" },
    { value: "trong", label: "Bàn trống" },
];
function getTrangThaiLabel(value) {
    const item = trangThaiList.find((tt) => tt.value === value);
    return item ? item.label : value;
}

const openAddModal = () => {
    isEditMode.value = false;
    originalBan.value = null;
    form.value = {
        soBan: "",
        maKhuVuc: "",
        maLoaiBan: "",
        trangThai: "",
    };
    modalVisible.value = true;
};

const openEditModal = (ban) => {
    isEditMode.value = true;
    originalBan.value = { ...ban };
    form.value = {
        soBan: ban.maBan,
        maKhuVuc: ban.maKhuVuc,
        maLoaiBan: ban.maLoaiBan,
        trangThai: ban.trangThai,
    };
    modalVisible.value = true;
};

const resetForm = () => {
    if (isEditMode.value && originalBan.value) {
        // Reset về dữ liệu gốc khi sửa
        form.value = {
            soBan: originalBan.value.maBan,
            maKhuVuc: originalBan.value.maKhuVuc,
            maLoaiBan: originalBan.value.maLoaiBan,
            trangThai: originalBan.value.trangThai,
        };
    } else {
        // Reset form trống khi thêm mới
        form.value = {
            soBan: "",
            maKhuVuc: "",
            maLoaiBan: "",
            trangThai: "",
        };
    }
};

const cancelModal = () => {
    resetForm();
};

const closeModal = () => {
    resetForm();
    modalVisible.value = false;
};

const saveBan = async () => {
    // validate
    if (
        !form.value.maKhuVuc ||
        !form.value.maLoaiBan ||
        !form.value.trangThai
    ) {
        Swal.fire({
            icon: "warning",
            title: "Thiếu thông tin",
            text: "Vui lòng nhập đủ thông tin!",
        });
        return;
    }

    try {
        if (isEditMode.value) {
            // Sửa bàn
            await updateBan({
                maBan: form.value.soBan,
                maKhuVuc: form.value.maKhuVuc,
                maLoaiBan: form.value.maLoaiBan,
                trangThai: form.value.trangThai,
            });
            Swal.fire({
                icon: "success",
                title: "Cập nhật thành công",
                text: `Bàn ${form.value.soBan} đã được cập nhật.`,
            });
        } else {
            // Thêm bàn
            await addBan({
                maKhuVuc: form.value.maKhuVuc,
                maLoaiBan: form.value.maLoaiBan,
                trangThai: form.value.trangThai,
            });
            Swal.fire({
                icon: "success",
                title: "Thêm thành công",
                text: `Bàn mới đã được thêm.`,
            });
        }

        closeModal();
        await loadData();
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: error.response?.data?.message || "Đã xảy ra lỗi khi lưu bàn.",
        });
    }
};

const deleteBanById = async (maBan) => {
    const result = await Swal.fire({
        title: "Xác nhận xóa",
        text: `Bạn có chắc chắn muốn xóa bàn ${maBan}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
        try {
            await deleteBan(maBan);
            Swal.fire({
                icon: "success",
                title: "Đã xóa",
                text: `Bàn ${maBan} đã được xóa.`,
            });
            selectedItems.value.delete(maBan);
            await loadData();
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.response?.data?.message || "Xóa bàn thất bại.",
            });
        }
    }
};

const deleteSelected = async () => {
    if (selectedItems.value.size === 0) return;

    const result = await Swal.fire({
        title: "Xác nhận xóa các bàn",
        text: `Bạn có chắc chắn muốn xóa ${selectedItems.value.size} bàn đã chọn?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
        try {
            await deleteMultipleBan(Array.from(selectedItems.value));
            Swal.fire({
                icon: "success",
                title: "Đã xóa",
                text: `${selectedItems.value.size} bàn đã được xóa.`,
            });
            selectedItems.value.clear();
            await loadData();
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.response?.data?.message || "Xóa bàn thất bại.",
            });
        }
    }
};

//ds bàn sau khi lọc
const filteredBanList = computed(() => {
    let result = banList.value;
    if (selectedKhuVuc.value)
        result = result.filter((b) => b.maKhuVuc === selectedKhuVuc.value);
    if (selectedLoaiBan.value)
        result = result.filter((b) => b.maLoaiBan === selectedLoaiBan.value);
    return result;
});

//dữ liệu của trang hiện tại
const pagedBanList = computed(() => {
    const start = (currentPage.value - 1) * pageSize;
    return filteredBanList.value.slice(start, start + pageSize);
});

// / tổng số trang
const totalPages = computed(() =>
    Math.ceil(filteredBanList.value.length / pageSize)
);

//chọn/bỏ chọn
const toggleSelect = (id) => {
    if (selectedItems.value.has(id)) selectedItems.value.delete(id);
    else selectedItems.value.add(id);
};

//chọn/bỏ chọn tất cả
const toggleSelectAll = (event) => {
    if (event.target.checked) {
        pagedBanList.value.forEach((b) => selectedItems.value.add(b.maBan));
    } else {
        pagedBanList.value.forEach((b) => selectedItems.value.delete(b.maBan));
    }
};

//kiểm tra chọn tất cả
const isAllSelected = computed(() => {
    return (
        pagedBanList.value.length > 0 &&
        pagedBanList.value.every((b) => selectedItems.value.has(b.maBan))
    );
});

const loadData = async () => {
    try {
        const kv = await fetchKhuVuc();
        const lb = await fetchLoaiBan();
        const b = await fetchBan();

        khuVucList.value = kv;
        loaiBanList.value = lb;
        banList.value = b;

        selectedKhuVuc.value = "";
        selectedLoaiBan.value = "";
    } catch (err) {
        console.error(err);
    }
};

onMounted(() => loadData());
</script>

<template>
    <div class="page-container">
        <h3 class="title">Sơ đồ bàn</h3>
        <hr />

        <div class="top-bar">
            <button class="btn-back" @click="goBack">
                <i class="fas fa-chevron-left"></i>
                <span>Quay lại trang trước</span>
            </button>

            <div class="page-title">Danh sách bàn</div>

            <button @click="openAddModal" class="btn-add">
                <i class="fas fa-plus"></i>
                Thêm mới
            </button>
        </div>

        <div class="filters">
            <select v-model="selectedKhuVuc">
                <option value="">-- Chọn khu vực --</option>
                <option
                    v-for="kv in khuVucList"
                    :key="kv.maKhuVuc"
                    :value="kv.maKhuVuc"
                >
                    {{ kv.tenKhuVuc }}
                </option>
            </select>

            <select v-model="selectedLoaiBan">
                <option value="">-- Chọn loại bàn --</option>
                <option
                    v-for="lb in loaiBanList"
                    :key="lb.maLoaiBan"
                    :value="lb.maLoaiBan"
                >
                    {{ lb.tenLoai }}
                </option>
            </select>
        </div>

        <table class="ban-table">
            <thead>
                <tr>
                    <th>
                        <input
                            type="checkbox"
                            :checked="isAllSelected"
                            @change="toggleSelectAll"
                        />
                    </th>
                    <th>STT</th>
                    <th>Mã bàn</th>
                    <th>Khu vực</th>
                    <th>Loại bàn</th>
                    <th>Trạng thái</th>
                    <th>Sửa</th>
                    <th>Xóa</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(ban, index) in pagedBanList" :key="ban.maBan">
                    <td>
                        <input
                            type="checkbox"
                            :value="ban.maBan"
                            :checked="selectedItems.has(ban.maBan)"
                            @change="toggleSelect(ban.maBan)"
                        />
                    </td>
                    <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                    <td>{{ ban.maBan }}</td>
                    <td>{{ ban.tenKhuVuc }}</td>
                    <td>{{ ban.tenLoai }}</td>
                    <td>
                        {{ getTrangThaiLabel(ban.trangThai) }}
                    </td>
                    <td>
                        <button @click="openEditModal(ban)" class="btn-edit">
                            <i class="fas fa-pen"></i>
                        </button>
                    </td>
                    <td>
                        <button
                            @click="deleteBanById(ban.maBan)"
                            class="btn-delete"
                        >
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
                <tr v-if="pagedBanList.length === 0">
                    <td colspan="8" style="text-align: center">
                        Không có dữ liệu
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="bottom-bar">
            <button
                class="btn-delete-selected"
                :disabled="selectedItems.size === 0"
                @click="deleteSelected"
            >
                Xóa các mục đã chọn ({{ selectedItems.size }})
            </button>

            <div class="pagination">
                <button :disabled="currentPage === 1" @click="currentPage--">
                    &lt;
                </button>
                <button
                    v-for="page in totalPages"
                    :key="page"
                    :class="{ active: page === currentPage }"
                    @click="currentPage = page"
                >
                    {{ page }}
                </button>
                <button
                    :disabled="currentPage === totalPages"
                    @click="currentPage++"
                >
                    &gt;
                </button>
            </div>
        </div>
        <!-- Modal -->
        <div v-if="modalVisible" class="modal-overlay" @click.self="closeModal">
            <div class="modal-content">
                <header class="modal-header">
                    <h2>
                        {{ isEditMode ? "SỬA THÔNG TIN BÀN" : "THÊM BÀN MỚI" }}
                    </h2>
                    <button class="btn-close" @click="closeModal">✕</button>
                </header>

                <div class="modal-body">
                    <input
                        v-model="form.soBan"
                        type="text"
                        placeholder="Nhập số Bàn"
                        disabled
                        v-if="isEditMode"
                    />

                    <select v-model="form.maKhuVuc">
                        <option value="" disabled>Chọn Khu vực</option>
                        <option
                            v-for="kv in khuVucList"
                            :key="kv.maKhuVuc"
                            :value="kv.maKhuVuc"
                        >
                            {{ kv.tenKhuVuc }}
                        </option>
                    </select>

                    <select v-model="form.maLoaiBan">
                        <option value="" disabled>Chọn Loại bàn</option>
                        <option
                            v-for="lb in loaiBanList"
                            :key="lb.maLoaiBan"
                            :value="lb.maLoaiBan"
                        >
                            {{ lb.tenLoai }}
                        </option>
                    </select>

                    <select v-model="form.trangThai">
                        <option value="" disabled>Chọn Trạng thái</option>
                        <option
                            v-for="tt in trangThaiList"
                            :key="tt.value"
                            :value="tt.value"
                        >
                            {{ tt.label }}
                        </option>
                    </select>
                </div>

                <footer class="modal-footer">
                    <!-- <button class="btn-save" @click="saveBan">LƯU</button> -->
                    <BaseButton
                        class="btn-save"
                        @click="saveBan"
                        btnTitle="LƯU"
                        variant="admin-btn-color"
                    />
                    <!-- <button class="btn-cancel" @click="closeModal">HỦY</button> -->
                    <BaseButton
                        class="btn-cancel"
                        @click="cancelModal"
                        btnTitle="HỦY"
                        variant="cancel-btn-color"
                    />
                </footer>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page-container {
    margin: 20px 200px;
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

/* list bàn */

.top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 25px;
}

.btn-back {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    font-size: 1.4rem;
    color: var(--black-color);
}
.btn-back:hover {
    text-decoration: underline;
}

.page-title {
    font-weight: 700;
    font-size: 1.8rem;
    text-transform: uppercase;
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

.filters {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.filters select {
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid var(--light-gray-color);
    font-size: 1.4rem;
}

/* --- Căn giữa tất cả các ô trong bảng --- */
:deep(.ban-table) th,
:deep(.ban-table) td {
    text-align: center;
}

/* Cột Khu vực và Trạng thái căn trái */
:deep(.ban-table) td:nth-child(4),
:deep(.ban-table) td:nth-child(6) {
    text-align: left;
}

.ban-table {
    width: 100%;
    border-collapse: collapse;
    box-shadow: 0 0 8px rgb(0 0 0 / 0.1);
    border-radius: 8px;
    overflow: hidden;
}

.ban-table th,
.ban-table td {
    padding: 10px 12px;
    border: 1px solid var(--light-gray-color);
    font-size: 1.4rem;
    user-select: none;
}

.ban-table th {
    background: var(--light-green-color);
    font-weight: 600;
}

.ban-table tbody tr {
    background-color: var(--white-color);
}

.ban-table tbody tr:hover {
    background-color: var(--light-blue-color);
}

.btn-edit,
.btn-delete {
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 2px 6px;
    font-size: 1.4rem;
    color: var(--dark-gray-color);
    transition: color 0.2s ease;
}

.btn-edit {
    color: var(--blue-color);
}

.btn-edit:hover {
    color: #68b0f7;
}

.btn-delete {
    color: var(--red-color);
}

.btn-delete:hover {
    color: #e95b5b;
}

.bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 25px;
    gap: 10px;
    flex-wrap: wrap;
}

.btn-delete-selected {
    background-color: var(--red-color);
    color: var(--white-color);
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    cursor: pointer;
    font-weight: 600;
    font-size: 1.2rem;
    user-select: none;
    transition: background-color 0.3s ease;
}

.btn-delete-selected:disabled {
    background-color: #f3a1a1;
    cursor: not-allowed;
}

.btn-delete-selected:hover:enabled {
    background-color: var(--red-color);
}

.pagination {
    margin-top: 0;
    display: flex;
    justify-content: center;
    gap: 6px;
    flex-wrap: nowrap;
    flex-grow: 1;
}

.pagination button {
    border: none;
    background: #eee;
    cursor: pointer;
    font-weight: 600;
    font-size: 1rem;
    padding: 6px 12px;
    border-radius: 6px;
    user-select: none;
    transition: background-color 0.3s ease;
}

.pagination button:hover:not(:disabled) {
    background: #ccc;
}

.pagination button:disabled {
    cursor: not-allowed;
    color: #999;
}

.pagination button.active {
    background: #a5bed1;
    color: #fff;
}

/* modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}
.modal-content {
    background: var(--white-color);
    /* border-radius: 8px; */
    width: 500px;
    padding: 0 0 20px 0;
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    gap: 20px;
    color: var(--black-color);
}
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background-color: var(--light-green-color);
}
.modal-header h2 {
    font-weight: 700;
    font-size: 1.8rem;
    display: block;
    margin: 0 auto;
}
.btn-close {
    background: transparent;
    border: none;
    font-size: 1.6rem;
    cursor: pointer;
    font-weight: 800;
}
.btn-close:hover {
    color: var(--red-color);
}

.modal-body {
    padding: 15px 40px;
}

.modal-body input,
.modal-body select {
    width: 100%;
    padding: 10px 15px;
    border-radius: 6px;
    border: 1px solid var(--light-gray-color);
    font-size: 1.4rem;
    color: var(--black-color);
    user-select: none;
    margin-bottom: 15px;
}
.modal-footer {
    padding: 0 40px;
    display: flex;
    justify-content: center;
    gap: 15px;
}
.btn-save,
.btn-cancel {
    border: none;
    border-radius: 6px;
    padding: 8px 20px;
    font-weight: 600;
    cursor: pointer;
    font-size: 1.2rem;
    color: var(--black-color);
    user-select: none;
    transition: background-color 0.3s ease;
}
.btn-save {
    background-color: #b5ccd7;
}
.btn-save:hover {
    background-color: #a0b6c2;
}
.btn-cancel {
    background-color: #ddd;
}
.btn-cancel:hover {
    background-color: #bbb;
}

/* Responsive cho tablet (768px đến 1024px) */
@media (max-width: 1024px) and (min-width: 768px) {
    .page-container {
        margin: 20px 40px;
    }

    .title {
        font-size: 1.6rem;
    }

    .top-bar {
        flex-wrap: wrap;
        gap: 12px;
        justify-content: center;
    }

    .btn-back,
    .btn-add {
        font-size: 1.2rem;
        padding: 6px 12px;
    }

    .page-title {
        font-size: 1.4rem;
        text-align: center;
        flex-grow: 1;
    }

    .filters {
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
    }

    .filters select {
        font-size: 1.2rem;
        padding: 5px 8px;
    }

    .ban-table th,
    .ban-table td {
        font-size: 1.2rem;
        padding: 8px 10px;
    }

    .btn-edit,
    .btn-delete {
        font-size: 1.2rem;
        padding: 2px 4px;
    }

    .bottom-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }

    .btn-delete-selected {
        font-size: 1.1rem;
        padding: 8px 12px;
    }

    .pagination {
        justify-content: center;
        gap: 4px;
    }

    .pagination button {
        font-size: 0.9rem;
        padding: 5px 10px;
    }
}

/* Responsive cho mobile (dưới 768px) */
@media (max-width: 767px) {
    .page-container {
        margin: 15px 15px;
    }

    .title {
        font-size: 1.4rem;
        margin-bottom: 10px;
    }

    .top-bar {
        flex-direction: column;
        gap: 10px;
        align-items: stretch;
    }

    .btn-back,
    .btn-add {
        font-size: 1rem;
        padding: 6px 10px;
        width: 100%;
        justify-content: center;
    }

    .page-title {
        font-size: 1.2rem;
        text-align: center;
    }

    .filters {
        flex-direction: column;
        gap: 10px;
    }

    .filters select {
        font-size: 1rem;
        padding: 6px 10px;
        width: 100%;
    }

    .ban-table {
        display: block;
        overflow-x: auto;
        border-radius: 8px;
    }

    .ban-table th,
    .ban-table td {
        font-size: 1rem;
        padding: 8px 8px;
        white-space: nowrap;
    }

    .btn-edit,
    .btn-delete {
        font-size: 1rem;
        padding: 4px 6px;
    }

    .bottom-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }

    .btn-delete-selected {
        width: 100%;
        font-size: 1.1rem;
        padding: 10px 12px;
    }

    .pagination {
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px;
    }

    .pagination button {
        font-size: 1rem;
        padding: 6px 10px;
        min-width: 36px;
    }
}
</style>
