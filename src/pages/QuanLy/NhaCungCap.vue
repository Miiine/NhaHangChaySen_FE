<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useSearchStore } from "@/stores/search";
import Swal from "sweetalert2";
import moment from "moment";

import {
    fetchNhaCungCap,
    deleteNhaCungCap,
    addNhaCungCap,
    updateNhaCungCap,
} from "@/services/nhacungcap";
import {
    fetchTinhThanh,
    fetchQuanHuyen,
    fetchPhuongXa,
    fetchDiaChiDayDu,
} from "@/services/diachi";

const router = useRouter();

const searchStore = useSearchStore();
const searchText = computed(() => searchStore.getSearchText); // Lấy giá trị tìm kiếm từ store

const danhSachNCC = ref([]);

const currentPage = ref(1);
const itemsPerPage = 8;
const selectedIds = ref(new Set());

const showModal = ref(false);
const isEdit = ref(false);
const name = ref("");
const email = ref("");
const sdt = ref("");
const address = ref("");
const Id = ref(null);

const tinhThanhId = ref("");
const quanHuyenId = ref("");
const phuongXaId = ref("");

const tinhThanhList = ref([]);
const quanHuyenList = ref([]);
const phuongXaList = ref([]);

const initialNhaCungCap = ref({});

// Địa chỉ đầy đủ
const fullAddress = computed(() => {
    return `${address.value}, ${
        phuongXaList.value.find((item) => item.maPhuongXa === phuongXaId.value)
            ?.tenPhuongXa || ""
    }, ${
        quanHuyenList.value.find(
            (item) => item.maQuanHuyen === quanHuyenId.value
        )?.tenQuanHuyen || ""
    }, ${
        tinhThanhList.value.find(
            (item) => item.maTinhThanh === tinhThanhId.value
        )?.tenTinhThanh || ""
    }`;
});

// Mở modal để thêm mới
function onAddNew() {
    showModal.value = true;
    isEdit.value = false;
    name.value = "";
    email.value = "";
    sdt.value = "";
    address.value = "";
    Id.value = null;
    tinhThanhId.value = "";
    quanHuyenId.value = "";
    phuongXaId.value = "";
}

// Mở modal để chỉnh sửa danh mục món ăn
function onEdit(maNCC) {
    showModal.value = true;
    isEdit.value = true;
    // Tìm đối tượng danh mục dựa trên maLoai
    const nhaCungCap = danhSachNCC.value.find((item) => item.maNCC === maNCC);

    // Gán tên danh mục vào name
    if (nhaCungCap) {
        initialNhaCungCap.value = { ...nhaCungCap };

        name.value = nhaCungCap.tenNCC;
        Id.value = nhaCungCap.maNCC;
        email.value = nhaCungCap.email;
        sdt.value = nhaCungCap.SDT;
        address.value = nhaCungCap.diaChiChiTiet;
        tinhThanhId.value = nhaCungCap.maTinhThanh;
        quanHuyenId.value = nhaCungCap.maQuanHuyen;
        phuongXaId.value = nhaCungCap.maPhuongXa;

        loadQuanHuyen();
        loadPhuongXa();
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
        name.value = initialNhaCungCap.value.tenNCC || "";
        email.value = initialNhaCungCap.value.email || "";
        sdt.value = initialNhaCungCap.value.SDT || "";
        address.value = initialNhaCungCap.value.diaChiChiTiet || "";
        tinhThanhId.value = initialNhaCungCap.value.maTinhThanh || "";
        quanHuyenId.value = initialNhaCungCap.value.maQuanHuyen || "";
        phuongXaId.value = initialNhaCungCap.value.maPhuongXa || "";
    } else {
        name.value = "";
        email.value = "";
        sdt.value = "";
        address.value = "";
        tinhThanhId.value = "";
        quanHuyenId.value = "";
        phuongXaId.value = "";
    }
}

// Đóng modal
function closeModal() {
    showModal.value = false;
    name.value = "";
    email.value = "";
    sdt.value = "";
    address.value = "";
    tinhThanhId.value = "";
    quanHuyenId.value = "";
    phuongXaId.value = "";
    Id.value = null;
}

// Hàm lưu nhà cung cấp mới
async function saveNCC() {
    const nhaCungCapData = {
        tenNCC: name.value,
        email: email.value,
        SDT: sdt.value,
        diaChiChiTiet: address.value,
        maPhuongXa: phuongXaId.value,
    };

    try {
        await addNhaCungCap(nhaCungCapData);
        Swal.fire("Đã thêm nhà cung cấp!", "", "success");
        closeModal();
        loadNhaCungCap();
    } catch (error) {
        Swal.fire("Lỗi khi thêm nhà cung cấp!", error.message || "", "error");
    }
}

// Hàm cập nhật nhà cung cấp
async function updateNCC() {
    const nhaCungCapData = {
        tenNCC: name.value,
        email: email.value,
        SDT: sdt.value,
        diaChiChiTiet: address.value,
        maPhuongXa: phuongXaId.value,
    };

    try {
        await updateNhaCungCap(Id.value, nhaCungCapData);
        Swal.fire("Đã cập nhật nhà cung cấp!", "", "success");
        closeModal();
        loadNhaCungCap();
    } catch (error) {
        Swal.fire(
            "Lỗi khi cập nhật nhà cung cấp!",
            error.message || "",
            "error"
        );
    }
}

// Lấy dữ liệu nhà cung cấp
const loadNhaCungCap = async () => {
    try {
        const res = await fetchNhaCungCap();
        danhSachNCC.value = res.sort((a, b) => {
            const dateA = moment(a.created_at, "YYYY-MM-DD HH:mm:ss");
            const dateB = moment(b.created_at, "YYYY-MM-DD HH:mm:ss");
            return dateB.isBefore(dateA) ? 1 : -1;
        });
        selectedIds.value.clear();
    } catch (err) {
        console.error("Lỗi tải dữ liệu nhà cung cấp:", err);
    }
};

// Lấy danh sách Tỉnh Thành
const loadTinhThanh = async () => {
    try {
        const res = await fetchTinhThanh();
        tinhThanhList.value = res;
    } catch (err) {
        console.error("Lỗi tải danh sách tỉnh thành:", err);
    }
};

// Lấy danh sách Quận Huyện khi chọn Tỉnh Thành
const loadQuanHuyen = async () => {
    if (!tinhThanhId.value) return;
    try {
        const res = await fetchQuanHuyen(tinhThanhId.value);
        quanHuyenList.value = res;
    } catch (err) {
        console.error("Lỗi tải danh sách quận huyện:", err);
    }
};

// Lấy danh sách Phường Xã khi chọn Quận Huyện
const loadPhuongXa = async () => {
    if (!quanHuyenId.value) return;
    try {
        const res = await fetchPhuongXa(quanHuyenId.value);
        phuongXaList.value = res;
    } catch (err) {
        console.error("Lỗi tải danh sách phường xã:", err);
    }
};

// Lọc danh sách nhà cung cấp theo giá trị tìm kiếm
const filteredNCC = computed(() => {
    return danhSachNCC.value.filter(
        (item) =>
            item.tenNCC
                .toLowerCase()
                .includes(searchText.value.toLowerCase()) ||
            item.email.toLowerCase().includes(searchText.value.toLowerCase()) ||
            item.SDT.toLowerCase().includes(searchText.value.toLowerCase())
    );
});

// Phân trang
const totalPages = computed(() =>
    Math.ceil(filteredNCC.value.length / itemsPerPage)
);

const pagedNCC = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredNCC.value.slice(start, start + itemsPerPage);
});

// Chọn / bỏ chọn từng checkbox
function toggleSelect(id) {
    if (selectedIds.value.has(id)) selectedIds.value.delete(id);
    else selectedIds.value.add(id);
}

// Chọn / bỏ chọn tất cả
const allChecked = computed(() => {
    if (pagedNCC.value.length === 0) return false;
    return pagedNCC.value.every((item) => selectedIds.value.has(item.maNCC));
});

function toggleSelectAll() {
    if (allChecked.value) {
        pagedNCC.value.forEach((item) => selectedIds.value.delete(item.maNCC));
    } else {
        pagedNCC.value.forEach((item) => selectedIds.value.add(item.maNCC));
    }
}

// Chuyển trang
function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        selectedIds.value.clear();
    }
}

// Xóa 1 nhà cung cấp
async function onDeleteNCC(maNCC) {
    const result = await Swal.fire({
        title: "Bạn có chắc muốn xóa nhà cung cấp này?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
        try {
            await deleteNhaCungCap(maNCC);
            danhSachNCC.value = danhSachNCC.value.filter(
                (item) => item.maNCC !== maNCC
            );
            selectedIds.value.delete(maNCC);
            Swal.fire("Đã xóa!", "", "success");
        } catch (error) {
            Swal.fire("Lỗi khi xóa!", error.message || "", "error");
        }
    }
}

// Xóa nhiều nhà cung cấp đã chọn
async function onDeleteSelected() {
    if (selectedIds.value.size === 0) return;

    const result = await Swal.fire({
        title: `Bạn có chắc muốn xóa ${selectedIds.value.size} nhà cung cấp đã chọn?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
        try {
            // Xóa từng nhà cung cấp đã chọn
            for (const id of selectedIds.value) {
                await deleteNhaCungCap(id);
                danhSachNCC.value = danhSachNCC.value.filter(
                    (item) => item.maNCC !== id
                );
            }
            selectedIds.value.clear();
            Swal.fire("Đã xóa!", "", "success");
        } catch (error) {
            Swal.fire("Lỗi khi xóa!", error.message || "", "error");
        }
    }
}

onMounted(() => {
    loadNhaCungCap();
    loadTinhThanh();
    loadQuanHuyen();
    loadPhuongXa();
});

// Cập nhật khi thay đổi tỉnh thành
function handleTinhThanhChange() {
    loadQuanHuyen();
    quanHuyenId.value = "";
    phuongXaId.value = "";
}

// Cập nhật khi thay đổi quận huyện
function handleQuanHuyenChange() {
    loadPhuongXa();
    phuongXaId.value = "";
}

// Watch để theo dõi thay đổi của searchText
watch(searchText, async () => {
    currentPage.value = 1;
});
</script>

<template>
    <div class="page-container">
        <h3 class="title">Nhà cung cấp</h3>
        <hr />
        <div class="top-bar">
            <button class="btn-add" @click="onAddNew">
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
                        <th>Tên NCC</th>
                        <th>Email</th>
                        <th>SĐT</th>
                        <th>Chi tiết</th>
                        <th>Xóa</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in pagedNCC" :key="item.maNCC">
                        <td>
                            <input
                                type="checkbox"
                                :checked="selectedIds.has(item.maNCC)"
                                @change="toggleSelect(item.maNCC)"
                            />
                        </td>
                        <td>
                            {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                        </td>
                        <td>{{ item.tenNCC }}</td>
                        <td>{{ item.email }}</td>
                        <td>{{ item.SDT }}</td>
                        <td>
                            <button
                                class="btn-detail"
                                @click="onEdit(item.maNCC)"
                                title="Xem chi tiết"
                            >
                                <i class="fas fa-file-lines"></i>
                            </button>
                        </td>
                        <td>
                            <button
                                class="btn-delete"
                                @click="onDeleteNCC(item.maNCC)"
                                title="Xóa nhà cung cấp"
                            >
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                    <tr v-if="pagedNCC.length === 0">
                        <td colspan="7" class="no-data">
                            Không có nhà cung cấp
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
                    Xóa {{ selectedIds.size }} nhà cung cấp đã chọn
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
        <!-- Modal Thêm/Sửa nhà cung cấp -->
        <div v-if="showModal" class="modal" @click="closeModalOnClickOutside">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>
                        {{
                            isEdit
                                ? "Chỉnh sửa thông tin nhà cung cấp"
                                : "Thêm nhà cung cấp mới"
                        }}
                    </h3>
                    <button class="close-btn" @click="closeModal">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="name">Tên nhà cung cấp</label>
                        <input
                            id="name"
                            v-model="name"
                            type="text"
                            placeholder="Nhập tên nhà cung cấp"
                        />
                    </div>

                    <div class="form-group">
                        <label for="email">Email</label>
                        <input
                            id="email"
                            v-model="email"
                            type="email"
                            placeholder="Nhập email"
                        />
                    </div>

                    <div class="form-group">
                        <label for="sdt">Số điện thoại</label>
                        <input
                            id="sdt"
                            v-model="sdt"
                            type="text"
                            placeholder="Nhập số điện thoại"
                        />
                    </div>

                    <div class="form-group">
                        <label for="address">Địa chỉ cụ thể</label>
                        <input
                            id="address"
                            v-model="address"
                            type="text"
                            placeholder="Nhập địa chỉ cụ thể"
                        />
                    </div>

                    <div class="form-group">
                        <label for="tinhThanh">Tỉnh Thành</label>
                        <select
                            id="tinhThanh"
                            v-model="tinhThanhId"
                            @change="handleTinhThanhChange"
                        >
                            <option value="" disabled>Chọn tỉnh thành</option>
                            <option
                                v-for="tinh in tinhThanhList"
                                :key="tinh.maTinhThanh"
                                :value="tinh.maTinhThanh"
                            >
                                {{ tinh.tenTinhThanh }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="quanHuyen">Quận Huyện</label>
                        <select
                            id="quanHuyen"
                            v-model="quanHuyenId"
                            @change="handleQuanHuyenChange"
                        >
                            <option value="" disabled>Chọn quận huyện</option>
                            <option
                                v-for="quan in quanHuyenList"
                                :key="quan.maQuanHuyen"
                                :value="quan.maQuanHuyen"
                            >
                                {{ quan.tenQuanHuyen }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="phuongXa">Phường Xã</label>
                        <select id="phuongXa" v-model="phuongXaId">
                            <option value="" disabled>Chọn phường xã</option>
                            <option
                                v-for="phuong in phuongXaList"
                                :key="phuong.maPhuongXa"
                                :value="phuong.maPhuongXa"
                            >
                                {{ phuong.tenPhuongXa }}
                            </option>
                        </select>
                    </div>

                    <p class="full-address">
                        Địa chỉ đầy đủ: {{ fullAddress }}
                    </p>
                </div>

                <div class="modal-footer">
                    <button
                        class="btn-save"
                        @click="isEdit ? updateNCC() : saveNCC()"
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
    color: var(--black-color);
    width: 700px !important;
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
    display: flex;
    flex-wrap: wrap;
    gap: 20px 40px;
    padding: 20px 30px;
    align-items: center;
    justify-content: flex-start;
}

.form-group {
    width: 45%;
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

.full-address {
    width: 100%;
    word-wrap: break-word;
    font-size: 1.6rem;
    padding: 10px 0;
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
