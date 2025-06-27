<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useSearchStore } from "@/stores/search";
import Swal from "sweetalert2";
import moment from "moment";

import {
    fetchNguyenLieu,
    deleteNguyenLieu,
    addNguyenLieu,
    updateNguyenLieu,
} from "@/services/nguyenlieu";
import { fetchLoaiNL } from "@/services/loainguyenlieu";

const router = useRouter();

const searchStore = useSearchStore();
const searchText = computed(() => searchStore.getSearchText); // Lấy giá trị tìm kiếm từ store

const danhSachNguyenLieu = ref([]);
const danhSachLoaiNL = ref([]);
const selectedIds = ref(new Set());

const currentPage = ref(1);
const itemsPerPage = 20;

const showModal = ref(false);
const isEdit = ref(false);
const name = ref("");
const price = ref("");
const unit = ref("");
const remaining = ref("");
const Id = ref(null);
const categoryId = ref("");

// Mở modal để thêm mới
function onAddNew() {
    showModal.value = true;
    isEdit.value = false;
    name.value = "";
    price.value = "";
    unit.value = "";
    remaining.value = "";
    Id.value = null;
    categoryId.value = "";
}

// Mở modal để chỉnh sửa danh mục món ăn
function onEdit(maNguyenLieu) {
    showModal.value = true;
    isEdit.value = true;
    // Tìm đối tượng danh mục dựa trên maLoai
    const nguyenLieu = danhSachNguyenLieu.value.find(
        (item) => item.maNguyenLieu === maNguyenLieu
    );

    // Gán tên danh mục vào name
    if (nguyenLieu) {
        name.value = nguyenLieu.tenNguyenLieu;
        Id.value = nguyenLieu.maNguyenLieu;
        price.value = nguyenLieu.donGia;
        unit.value = nguyenLieu.donViTinh;
        remaining.value = nguyenLieu.soLuongCon;
        categoryId.value = nguyenLieu.maLoaiNL;
    }
}

// Đóng modal khi click ra ngoài
function closeModalOnClickOutside(event) {
    if (event.target === event.currentTarget) {
        closeModal();
    }
}

//Reset modal
function resetModal() {
    if (isEdit.value) {
        name.value = name.value;
        price.value = price.value;
        unit.value = unit.value;
        remaining.value = remaining.value;
    } else {
        name.value = "";
        price.value = "";
        unit.value = "";
        remaining.value = "";
    }
}

// Đóng modal
function closeModal() {
    showModal.value = false;
    name.value = "";
    price.value = "";
    unit.value = "";
    remaining.value = "";
    Id.value = null;
    categoryId.value = null;
}

// Lưu nguyên liệu (Thêm mới)
async function saveNL() {
    try {
        const newNguyenLieu = {
            tenNguyenLieu: name.value,
            donGia: price.value,
            soLuongCon: 0,
            donViTinh: unit.value,
            maLoaiNL: categoryId.value,
        };
        const response = await addNguyenLieu(newNguyenLieu);
        Swal.fire("Thành công", response.message, "success");
        closeModal();
        loadNguyenLieu();
    } catch (error) {
        Swal.fire(
            "Lỗi",
            error.message || "Không thể thêm nguyên liệu",
            "error"
        );
    }
}

// Cập nhật nguyên liệu
async function updateNL() {
    try {
        const updatedNguyenLieu = {
            tenNguyenLieu: name.value,
            donGia: price.value,
            soLuongCon: remaining.value,
            donViTinh: unit.value,
            maLoaiNL: categoryId.value,
        };
        const response = await updateNguyenLieu(Id.value, updatedNguyenLieu);
        Swal.fire("Thành công", response.message, "success");
        closeModal();
        loadNguyenLieu();
    } catch (error) {
        Swal.fire(
            "Lỗi",
            error.message || "Không thể cập nhật nguyên liệu",
            "error"
        );
    }
}

const loadNguyenLieu = async () => {
    try {
        const res = await fetchNguyenLieu();
        danhSachNguyenLieu.value = res.sort((a, b) => {
            const dateA = moment(a.created_at, "YYYY-MM-DD HH:mm:ss");
            const dateB = moment(b.created_at, "YYYY-MM-DD HH:mm:ss");
            return dateB.isBefore(dateA) ? 1 : -1;
        });
        selectedIds.value.clear();
    } catch (err) {
        console.error("Lỗi tải danh sách nguyên liệu:", err);
    }
};

const loadLoaiNL = async () => {
    try {
        const res = await fetchLoaiNL();
        danhSachLoaiNL.value = res;
        selectedIds.value.clear();
    } catch (err) {
        console.error("Lỗi tải danh sách loại nguyên liệu:", err);
    }
};

const filteredDanhSachNguyenLieu = computed(() => {
    const search = searchText.value.toLowerCase();

    return danhSachNguyenLieu.value.filter((item) => {
        // Lọc theo tên nguyên liệu
        const tenNguyenLieuMatch =
            typeof item.tenNguyenLieu === "string" &&
            item.tenNguyenLieu.toLowerCase().includes(search);

        // Lọc theo tên loại nguyên liệu
        const tenLoaiNLMatch =
            typeof item.tenLoaiNL === "string" &&
            item.tenLoaiNL.toLowerCase().includes(search);

        return tenNguyenLieuMatch || tenLoaiNLMatch;
    });
});

const totalPages = computed(() =>
    Math.ceil(filteredDanhSachNguyenLieu.value.length / itemsPerPage)
);

const pagedNguyenLieu = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredDanhSachNguyenLieu.value.slice(start, start + itemsPerPage);
});

function toggleSelect(id) {
    if (selectedIds.value.has(id)) selectedIds.value.delete(id);
    else selectedIds.value.add(id);
}

const allChecked = computed(() => {
    if (pagedNguyenLieu.value.length === 0) return false;
    return pagedNguyenLieu.value.every((item) =>
        selectedIds.value.has(item.maNguyenLieu)
    );
});

function toggleSelectAll() {
    if (allChecked.value) {
        pagedNguyenLieu.value.forEach((item) =>
            selectedIds.value.delete(item.maNguyenLieu)
        );
    } else {
        pagedNguyenLieu.value.forEach((item) =>
            selectedIds.value.add(item.maNguyenLieu)
        );
    }
}

function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        selectedIds.value.clear();
    }
}

// Xóa 1 nguyên liệu
async function onDelete(maNguyenLieu) {
    const result = await Swal.fire({
        title: "Bạn có chắc muốn xóa nguyên liệu này?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
        try {
            await deleteNguyenLieu(maNguyenLieu);
            danhSachNguyenLieu.value = danhSachNguyenLieu.value.filter(
                (item) => item.maNguyenLieu !== maNguyenLieu
            );
            selectedIds.value.delete(maNguyenLieu);
            Swal.fire("Đã xóa!", "", "success");
        } catch (error) {
            Swal.fire("Lỗi khi xóa!", error.message || "", "error");
        }
    }
}

// Xóa nhiều nguyên liệu đã chọn
async function onDeleteSelected() {
    if (selectedIds.value.size === 0) return;

    const result = await Swal.fire({
        title: `Bạn có chắc muốn xóa ${selectedIds.value.size} nguyên liệu đã chọn?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
        try {
            // Chuyển đổi Set thành Array và xóa từng nguyên liệu
            const selectedIdsArray = Array.from(selectedIds.value);

            // Xóa từng nguyên liệu
            for (const id of selectedIdsArray) {
                await deleteNguyenLieu(id);
                danhSachNguyenLieu.value = danhSachNguyenLieu.value.filter(
                    (item) => item.maNguyenLieu !== id
                );
            }

            selectedIds.value.clear();
            Swal.fire("Đã xóa!", "", "success");
            loadNguyenLieu();
        } catch (error) {
            Swal.fire("Lỗi khi xóa!", error.message || "", "error");
        }
    }
}

onMounted(() => {
    loadNguyenLieu();
    loadLoaiNL();
});
</script>

<template>
    <div class="page-container">
        <h3 class="title">Danh sách nguyên liệu</h3>
        <hr />
        <div class="top-bar">
            <button class="btn-add" @click="onAddNew">
                <i class="fas fa-plus"></i> Thêm mới
            </button>
        </div>

        <div class="list-content">
            <table class="ingredient-table">
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
                        <th>Tên NL</th>
                        <th>Danh mục</th>
                        <th>Đơn giá</th>
                        <th>SL còn</th>
                        <th>Đơn vị tính</th>
                        <th>Chi tiết</th>
                        <th>Xóa</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(item, index) in pagedNguyenLieu"
                        :key="item.maNguyenLieu"
                    >
                        <td>
                            <input
                                type="checkbox"
                                :checked="selectedIds.has(item.maNguyenLieu)"
                                @change="toggleSelect(item.maNguyenLieu)"
                            />
                        </td>
                        <td>
                            {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                        </td>
                        <td>{{ item.tenNguyenLieu }}</td>
                        <td>{{ item.tenLoaiNL }}</td>
                        <td>{{ item.donGia.toLocaleString("vi-VN") }}đ</td>
                        <td>{{ item.soLuongCon }}</td>
                        <td>{{ item.donViTinh }}</td>
                        <td>
                            <button
                                class="btn-detail"
                                @click="onEdit(item.maNguyenLieu)"
                                title="Sửa nguyên liệu"
                            >
                                <i class="fas fa-pen"></i>
                            </button>
                        </td>
                        <td>
                            <button
                                class="btn-delete"
                                @click="onDelete(item.maNguyenLieu)"
                                title="Xóa nguyên liệu"
                            >
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                    <tr v-if="pagedNguyenLieu.length === 0">
                        <td colspan="9" class="no-data">
                            Không có nguyên liệu
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
                    Xóa {{ selectedIds.size }} nguyên liệu đã chọn
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
        <!-- Modal Thêm/Sửa danh mục nguyên liệu -->
        <div v-if="showModal" class="modal" @click="closeModalOnClickOutside">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>
                        {{
                            isEdit
                                ? "Chỉnh sửa nguyên liệu"
                                : "Thêm nguyên liệu mới"
                        }}
                    </h3>
                    <button class="close-btn" @click="closeModal">×</button>
                </div>
                <div class="modal-body">
                    <label for="categoryId">Chọn loại nguyên liệu</label>
                    <select id="categoryId" v-model="categoryId">
                        <option value="" disabled>Chọn loại nguyên liệu</option>
                        <option
                            v-for="category in danhSachLoaiNL"
                            :key="category.maLoaiNL"
                            :value="category.maLoaiNL"
                        >
                            {{ category.tenLoaiNL }}
                        </option>
                    </select>

                    <label for="name">Tên nguyên liệu</label>
                    <input
                        id="name"
                        v-model="name"
                        type="text"
                        placeholder="Nhập tên nguyên liệu"
                    />

                    <label for="price">Đơn giá</label>
                    <input
                        id="price"
                        v-model="price"
                        type="number"
                        placeholder="Nhập đơn giá"
                    />

                    <label v-if="isEdit" for="remaining">Số lượng còn</label>
                    <input
                        v-if="isEdit"
                        id="remaining"
                        v-model="remaining"
                        type="number"
                        placeholder="Nhập số lượng còn"
                    />

                    <label for="unit">Đơn vị tính</label>
                    <input
                        id="unit"
                        v-model="unit"
                        type="text"
                        placeholder="Nhập đơn vị tính"
                    />
                </div>
                <div class="modal-footer">
                    <button
                        class="btn-save"
                        @click="isEdit ? updateNL() : saveNL()"
                    >
                        {{ isEdit ? "Cập nhật" : "Lưu" }}
                    </button>
                    <button class="btn-cancel" @click="closeModal">Hủy</button>
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

/* Table */
.ingredient-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.4rem;
    color: var(--black-color);
}

.ingredient-table th,
.ingredient-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}

.ingredient-table thead {
    background-color: var(--light-green-color);
    font-weight: 600;
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

    .ingredient-table {
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

    .ingredient-table {
        display: block;
        overflow-x: auto;
        white-space: nowrap;
        font-size: 1rem;
    }

    .ingredient-table th,
    .ingredient-table td {
        padding: 8px 6px;
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
/* Modal Styles */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background: white;
    width: 400px;
    color: var(--black-color);
    width: 500px;
}

.modal-header {
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--light-green-color);
    text-transform: uppercase;
}

.modal-header h3 {
    display: block;
    margin: 0 auto;
}

.close-btn {
    background: none;
    border: none;
    font-size: 2.6rem;
    cursor: pointer;
}

.close-btn:hover {
    color: var(--red-color);
    transform: scale(1.03);
}

.modal-body {
    padding: 20px;
}

.modal-body label {
    display: block;
    margin-bottom: 6px;
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--black-color);
}

.modal-body input,
.modal-body select {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--dark-gray-color);
    border-radius: 5px;
    font-size: 1.6rem;
    color: var(--black-color);
    margin-bottom: 20px;
}

.modal-body input:hover,
.modal-body select:hover {
    border-color: var(--blue-color);
}

.modal-footer {
    display: flex;
    padding: 20px;
    justify-content: center;
    gap: 20px;
}

.btn-save,
.btn-cancel {
    display: flex;
    align-items: center;
    justify-content: center;
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
    min-width: 100px;
}

.btn-save:hover {
    background: #a0b6c2;
}

.btn-cancel {
    background-color: var(--light-gray-color);
    color: var(--black-color);
}

.btn-cancel:hover {
    background-color: var(--dark-gray-color);
}
</style>
