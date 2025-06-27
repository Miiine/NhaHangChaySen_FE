<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useSearchStore } from "@/stores/search";
import Swal from "sweetalert2";
import moment from "moment";

import {
    fetchLoaiNL,
    deleteLoaiNL,
    addLoaiNL,
    updateLoaiNL,
} from "@/services/loainguyenlieu";

const router = useRouter();

const searchStore = useSearchStore();
const searchText = computed(() => searchStore.getSearchText); // Lấy giá trị tìm kiếm từ store

const danhSachLoaiNL = ref([]);
const selectedIds = ref(new Set());

const currentPage = ref(1);
const itemsPerPage = 10;

const showModal = ref(false);
const isEdit = ref(false);
const categoryName = ref("");
const categoryId = ref(null);

// Mở modal để thêm mới
function onAddNew() {
    showModal.value = true;
    isEdit.value = false;
    categoryName.value = "";
    categoryId.value = null;
}

// Mở modal để chỉnh sửa danh mục món ăn
function onEdit(maLoaiNL) {
    showModal.value = true;
    isEdit.value = true;
    // Tìm đối tượng danh mục dựa trên maLoai
    const category = danhSachLoaiNL.value.find(
        (item) => item.maLoaiNL === maLoaiNL
    );

    // Gán tên danh mục vào categoryName
    if (category) {
        categoryName.value = category.tenLoaiNL;
        categoryId.value = category.maLoaiNL;
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
        categoryName.value = categoryName.value;
    } else {
        categoryName.value = "";
    }
}

// Đóng modal
function closeModal() {
    showModal.value = false;
    categoryName.value = "";
    categoryId.value = null;
}

const saveCategory = async () => {
    if (categoryName.value.trim() === "") {
        Swal.fire("Lỗi", "Vui lòng nhập tên loại nguyên liệu!", "error");
        return;
    }

    try {
        const response = await addLoaiNL(categoryName.value);
        Swal.fire("Thành công", response.message, "success");
        loadLoaiNL();
        closeModal();
    } catch (error) {
        Swal.fire("Lỗi", "Không thể thêm loại nguyên liệu!", "error");
    }
};

const updateCategory = async () => {
    if (categoryName.value.trim() === "") {
        Swal.fire("Lỗi", "Vui lòng nhập tên loại nguyên liệu!", "error");
        return;
    }

    try {
        const response = await updateLoaiNL(
            categoryId.value,
            categoryName.value
        );
        Swal.fire("Thành công", response.message, "success");
        loadLoaiNL();
        closeModal();
    } catch (error) {
        Swal.fire("Lỗi", "Không thể cập nhật loại nguyên liệu!", "error");
    }
};

const loadLoaiNL = async () => {
    try {
        const res = await fetchLoaiNL();
        danhSachLoaiNL.value = res.sort((a, b) => {
            const dateA = moment(a.created_at, "YYYY-MM-DD HH:mm:ss");
            const dateB = moment(b.created_at, "YYYY-MM-DD HH:mm:ss");
            return dateB.isBefore(dateA) ? 1 : -1;
        });
        selectedIds.value.clear();
    } catch (err) {
        console.error("Lỗi tải danh sách loại nguyên liệu:", err);
    }
};

const filteredDanhSachLoaiNL = computed(() => {
    const search = searchText.value.toLowerCase();

    return danhSachLoaiNL.value.filter((item) => {
        // Lọc theo tên loại nguyên liệu
        const tenLoaiNLMatch =
            typeof item.tenLoaiNL === "string" &&
            item.tenLoaiNL.toLowerCase().includes(search);

        return tenLoaiNLMatch;
    });
});

const totalPages = computed(() =>
    Math.ceil(filteredDanhSachLoaiNL.value.length / itemsPerPage)
);

const pagedLoaiNL = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredDanhSachLoaiNL.value.slice(start, start + itemsPerPage);
});

function toggleSelect(id) {
    if (selectedIds.value.has(id)) selectedIds.value.delete(id);
    else selectedIds.value.add(id);
}

const allChecked = computed(() => {
    if (pagedLoaiNL.value.length === 0) return false;
    return pagedLoaiNL.value.every((item) =>
        selectedIds.value.has(item.maLoaiNL)
    );
});

function toggleSelectAll() {
    if (allChecked.value) {
        pagedLoaiNL.value.forEach((item) =>
            selectedIds.value.delete(item.maLoaiNL)
        );
    } else {
        pagedLoaiNL.value.forEach((item) =>
            selectedIds.value.add(item.maLoaiNL)
        );
    }
}

function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        selectedIds.value.clear();
    }
}

// Xóa 1 loại nguyên liệu
async function onDelete(maLoaiNL) {
    const result = await Swal.fire({
        title: "Bạn có chắc muốn xóa loại nguyên liệu này?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
        try {
            await deleteLoaiNL(maLoaiNL);
            selectedIds.value.delete(maLoaiNL);
            Swal.fire("Đã xóa!", "", "success");
            loadLoaiNL();
        } catch (error) {
            Swal.fire("Lỗi khi xóa!", error.message || "", "error");
        }
    }
}

// Xóa nhiều loại nguyên liệu đã chọn (sử dụng deleteLoaiNL)
async function onDeleteSelected() {
    if (selectedIds.value.size === 0) return;

    const result = await Swal.fire({
        title: `Bạn có chắc muốn xóa ${selectedIds.value.size} loại nguyên liệu đã chọn?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
        try {
            // Chuyển Set thành mảng để lặp qua từng ID
            const selectedIdsArray = Array.from(selectedIds.value);
            // Xóa từng loại nguyên liệu
            for (const id of selectedIdsArray) {
                await deleteLoaiNL(id);
                // Cập nhật lại danh sách sau khi xóa
                danhSachLoaiNL.value = danhSachLoaiNL.value.filter(
                    (item) => item.maLoaiNL !== id
                );
            }
            selectedIds.value.clear();
            Swal.fire("Đã xóa!", "", "success");
            loadLoaiNL();
        } catch (error) {
            Swal.fire("Lỗi khi xóa!", error.message || "", "error");
        }
    }
}

onMounted(() => {
    loadLoaiNL();
});
</script>

<template>
    <div class="page-container">
        <h3 class="title">Danh mục loại nguyên liệu</h3>
        <hr />
        <div class="top-bar">
            <button class="btn-add" @click="onAddNew">
                <i class="fas fa-plus"></i> Thêm mới
            </button>
        </div>

        <div class="list-content">
            <table class="category-table">
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
                        <th>Tên loại nguyên liệu</th>
                        <th>Sửa</th>
                        <th>Xóa</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(item, index) in pagedLoaiNL"
                        :key="item.maLoaiNL"
                    >
                        <td>
                            <input
                                type="checkbox"
                                :checked="selectedIds.has(item.maLoaiNL)"
                                @change="toggleSelect(item.maLoaiNL)"
                            />
                        </td>
                        <td>
                            {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                        </td>
                        <td>{{ item.tenLoaiNL }}</td>
                        <td>
                            <button
                                class="btn-edit"
                                @click="onEdit(item.maLoaiNL)"
                                title="Sửa loại nguyên liệu"
                            >
                                <i class="fas fa-pen"></i>
                            </button>
                        </td>
                        <td>
                            <button
                                class="btn-delete"
                                @click="onDelete(item.maLoaiNL)"
                                title="Xóa loại nguyên liệu"
                            >
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                    <tr v-if="pagedLoaiNL.length === 0">
                        <td colspan="5" class="no-data">
                            Không có loại nguyên liệu
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
                    Xóa {{ selectedIds.size }} loại nguyên liệu đã chọn
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
                                ? "Chỉnh sửa danh mục nguyên liệu"
                                : "Thêm danh mục nguyên liệu mới"
                        }}
                    </h3>
                    <button class="close-btn" @click="closeModal">×</button>
                </div>
                <div class="modal-body">
                    <input
                        v-model="categoryName"
                        placeholder="Nhập tên danh mục"
                    />
                </div>
                <div class="modal-footer">
                    <button
                        class="btn-save"
                        @click="isEdit ? updateCategory() : saveCategory()"
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
    margin: 20px 300px;
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
.category-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.4rem;
    color: var(--black-color);
}

.category-table th,
.category-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}

.category-table thead {
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
.btn-edit,
.btn-delete {
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.25s ease, color 0.25s ease;
}

.btn-edit i,
.btn-delete i {
    font-size: 1.3rem;
    vertical-align: middle;
    transition: color 0.25s ease;
}

/* Nút sửa */
.btn-edit {
    background-color: #fff;
    color: #2f855a;
}

.btn-edit:hover {
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

    .category-table {
        font-size: 1.2rem;
    }

    .btn-edit i,
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

    .category-table {
        display: block;
        overflow-x: auto;
        white-space: nowrap;
        font-size: 1rem;
    }

    .category-table th,
    .category-table td {
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

.modal-body input {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--dark-gray-color);
    border-radius: 5px;
    margin-top: 10px;
    font-size: 1.6rem;
    color: var(--black-color);
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
