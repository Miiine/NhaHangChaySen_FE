<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useSearchStore } from "@/stores/search";
import Swal from "sweetalert2";
import moment from "moment";

import {
    fetchTaiKhoan,
    deleteTaiKhoan,
    updateTrangThaiTaiKhoan,
    createKhachHangQL,
    adminUpdateTaiKhoan,
} from "@/services/taikhoan";

const router = useRouter();

const searchStore = useSearchStore();
const searchText = computed(() => searchStore.getSearchText); // Lấy giá trị tìm kiếm từ store

const danhSachTaiKhoan = ref([]);
const selectedIds = ref(new Set());

const currentPage = ref(1);
const itemsPerPage = 8;

const roles = ref([{ key: "tat_ca", label: "Tất cả" }]);
const selectedRole = ref("tat_ca");

const vaiTroList = ref([
    { maVaiTro: 1, tenVaiTro: "Khách hàng" },
    { maVaiTro: 2, tenVaiTro: "Nhân Viên" },
    { maVaiTro: 3, tenVaiTro: "Quản trị viên" },
]);

const showModal = ref(false);
const isEdit = ref(false);
const name = ref("");
const email = ref("");
const sdt = ref("");
const roleID = ref("");
const Id = ref(null);

// Mở modal để thêm mới
function onAddNew() {
    showModal.value = true;
    isEdit.value = false;
    name.value = "";
    email.value = "";
    sdt.value = "";
    roleID.value = "";
    Id.value = null;
}

// Mở modal để chỉnh sửa thông tin
function onEdit(maTaiKhoan) {
    showModal.value = true;
    isEdit.value = true;
    // Tìm đối tượng danh mục dựa trên maLoai
    const taiKhoan = danhSachTaiKhoan.value.find(
        (item) => item.maTaiKhoan === maTaiKhoan
    );

    // Gán tên danh mục vào name
    if (taiKhoan) {
        name.value = taiKhoan.tenTaiKhoan;
        Id.value = taiKhoan.maTaiKhoan;
        email.value = taiKhoan.email;
        sdt.value = taiKhoan.SDT;
        roleID.value = taiKhoan.maVaiTro;
        console.log("Role ID:", roleID.value);
    }
}

// Đóng modal khi click ra ngoài
function closeModalOnClickOutside(event) {
    if (event.target === event.currentTarget) {
        closeModal();
    }
}

//Reset modal

// Đóng modal
function closeModal() {
    showModal.value = false;
    name.value = "";
    email.value = "";
    sdt.value = "";
    roleID.value = "";
    Id.value = null;
}

// Hàm này sẽ được gọi khi click vào icon ổ khóa
async function toggleKhoaTaiKhoan(maTaiKhoan, currentTrangThai) {
    if (currentTrangThai !== "hoat_dong" && currentTrangThai !== "khoa") {
        Swal.fire(
            "Trạng thái không hợp lệ",
            "Vui lòng kiểm tra lại trạng thái.",
            "error"
        );
        return;
    }
    console.log("currentTrangThai: ", currentTrangThai);

    const newTrangThai =
        currentTrangThai === "hoat_dong" ? "khoa" : "hoat_dong";
    try {
        const response = await updateTrangThaiTaiKhoan(maTaiKhoan, {
            trangThai: newTrangThai,
        });

        if (response.message === "Cập nhật trạng thái tài khoản thành công") {
            const taiKhoan = danhSachTaiKhoan.value.find(
                (tk) => tk.maTaiKhoan === maTaiKhoan
            );
            if (taiKhoan) {
                taiKhoan.trangThai = newTrangThai;
            }
            Swal.fire("Cập nhật trạng thái thành công!", "", "success");
        } else {
            Swal.fire("Cập nhật trạng thái thất bại", "", "error");
        }
    } catch (error) {
        Swal.fire("Lỗi khi cập nhật trạng thái!", "", "error");
        console.error(
            "Lỗi khi cập nhật trạng thái:",
            error.response ? error.response.data : error
        );
    }
}

// Thêm tài khoản khách hàng mới
const saveTK = async () => {
    if (!name.value || !roleID.value || (!email.value && !sdt.value)) {
        Swal.fire("Thông báo", "Vui lòng điền đầy đủ thông tin!", "warning");
        return;
    }

    try {
        const response = await createKhachHangQL({
            tenTaiKhoan: name.value,
            email: email.value,
            SDT: sdt.value,
            maVaiTro: roleID.value,
        });

        if (response.message === "Tạo khách hàng thành công") {
            Swal.fire(
                "Thành công!",
                "Tạo tài khoản khách hàng thành công",
                "success"
            );
            loadTaiKhoan();
            closeModal();
        } else {
            Swal.fire("Lỗi", "Không thể tạo tài khoản mới", "error");
        }
    } catch (error) {
        console.error("Lỗi tạo khách hàng:", error);
        Swal.fire("Lỗi", "Không thể tạo tài khoản mới", "error");
    }
};

// Cập nhật tài khoản admin
const updateTK = async () => {
    if (!name.value || !roleID.value || (!email.value && !sdt.value)) {
        Swal.fire("Thông báo", "Vui lòng điền đầy đủ thông tin!", "warning");
        return;
    }

    try {
        const response = await adminUpdateTaiKhoan(Id.value, {
            tenTaiKhoan: name.value,
            email: email.value,
            SDT: sdt.value,
            maVaiTro: roleID.value,
        });

        if (response.message === "Cập nhật tài khoản thành công") {
            Swal.fire(
                "Thành công!",
                "Cập nhật tài khoản thành công",
                "success"
            );
            loadTaiKhoan();
            closeModal();
        } else {
            Swal.fire("Lỗi", "Không thể cập nhật tài khoản", "error");
        }
    } catch (error) {
        console.error("Lỗi cập nhật tài khoản:", error);
        Swal.fire("Lỗi", "Không thể cập nhật tài khoản", "error");
    }
};

const loadTaiKhoan = async () => {
    try {
        const res = await fetchTaiKhoan();
        danhSachTaiKhoan.value = res.sort((a, b) => {
            const dateA = moment(a.created_at, "YYYY-MM-DD HH:mm:ss");
            const dateB = moment(b.created_at, "YYYY-MM-DD HH:mm:ss");
            return dateB.isBefore(dateA) ? 1 : -1;
        });
        // Lấy danh sách vai trò tự động từ dữ liệu
        const roleSet = new Set(res.map((u) => u.tenVaiTro));
        roles.value = [
            { key: "tat_ca", label: "Tất cả" },
            ...Array.from(roleSet).map((r) => ({ key: r, label: r })),
        ];
        selectedIds.value.clear();
    } catch (err) {
        console.error("Lỗi tải danh sách tài khoản:", err);
    }
};

const filteredTaiKhoan = computed(() => {
    const query = searchText.value.toLowerCase();

    // Lọc theo vai trò
    let filteredByRole =
        selectedRole.value === "tat_ca"
            ? danhSachTaiKhoan.value
            : danhSachTaiKhoan.value.filter(
                  (tk) => tk.tenVaiTro === selectedRole.value
              );

    // Lọc theo tìm kiếm (tên tài khoản, email, SDT)
    return filteredByRole.filter((tk) => {
        // Kiểm tra và chuyển đổi thành chuỗi nếu sdt và email tồn tại
        const sdt = tk.SDT ? String(tk.SDT).toLowerCase() : "";
        const email = tk.email ? tk.email.toLowerCase() : "";

        // Tránh trường hợp email hoặc SDT rỗng và lọc
        return (
            (tk.tenTaiKhoan && tk.tenTaiKhoan.toLowerCase().includes(query)) ||
            (email && email.includes(query)) ||
            (sdt && sdt.includes(query))
        );
    });
});

const totalPages = computed(() =>
    Math.ceil(filteredTaiKhoan.value.length / itemsPerPage)
);

const pagedTaiKhoan = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredTaiKhoan.value.slice(start, start + itemsPerPage);
});

function toggleSelect(id) {
    if (selectedIds.value.has(id)) selectedIds.value.delete(id);
    else selectedIds.value.add(id);
}

const allChecked = computed(() => {
    if (pagedTaiKhoan.value.length === 0) return false;
    return pagedTaiKhoan.value.every((item) =>
        selectedIds.value.has(item.maTaiKhoan)
    );
});

function toggleSelectAll() {
    if (allChecked.value) {
        pagedTaiKhoan.value.forEach((item) =>
            selectedIds.value.delete(item.maTaiKhoan)
        );
    } else {
        pagedTaiKhoan.value.forEach((item) =>
            selectedIds.value.add(item.maTaiKhoan)
        );
    }
}

function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        selectedIds.value.clear();
    }
}

async function onDelete(maTaiKhoan) {
    const result = await Swal.fire({
        title: "Bạn có chắc muốn xóa tài khoản này?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
        try {
            await deleteTaiKhoan(maTaiKhoan);

            danhSachTaiKhoan.value = danhSachTaiKhoan.value.filter(
                (item) => item.maTaiKhoan !== maTaiKhoan
            );
            selectedIds.value.delete(maTaiKhoan);
            Swal.fire("Đã xóa!", "", "success");
            loadTaiKhoan();
        } catch (error) {
            Swal.fire(
                "Lỗi khi xóa!",
                error.message || "Không thể xóa tài khoản",
                "error"
            );
        }
    }
}

async function onDeleteSelected() {
    if (selectedIds.value.size === 0) return;

    const result = await Swal.fire({
        title: `Bạn có chắc muốn xóa ${selectedIds.value.size} tài khoản đã chọn?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
        try {
            const selectedIdsArray = Array.from(selectedIds.value);

            for (const id of selectedIdsArray) {
                await deleteTaiKhoan(id);
                danhSachTaiKhoan.value = danhSachTaiKhoan.value.filter(
                    (item) => item.maTaiKhoan !== id
                );
            }

            selectedIds.value.clear();
            loadTaiKhoan();
            Swal.fire("Đã xóa!", "", "success");
        } catch (error) {
            Swal.fire(
                "Lỗi khi xóa!",
                error.message || "Không thể xóa tài khoản",
                "error"
            );
        }
    }
}

function maskPassword(pwd) {
    return "********";
}

onMounted(() => {
    loadTaiKhoan();
});
</script>

<template>
    <div class="page-container">
        <h3 class="title">Quản lý tài khoản</h3>
        <hr />
        <div class="top-bar">
            <button class="btn-add" @click="onAddNew">
                <i class="fas fa-plus"></i> Thêm mới
            </button>
            <select v-model="selectedRole" class="role-filter">
                <option v-for="role in roles" :key="role.key" :value="role.key">
                    {{ role.label }}
                </option>
            </select>
        </div>

        <div class="list-content">
            <table class="account-table">
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
                        <th>Email</th>
                        <th>Tên tài khoản</th>
                        <th>Ngày tạo TK</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Khóa</th>
                        <th>Chi tiết</th>
                        <th>Xóa</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(item, index) in pagedTaiKhoan"
                        :key="item.maTaiKhoan"
                    >
                        <td>
                            <input
                                type="checkbox"
                                :checked="selectedIds.has(item.maTaiKhoan)"
                                @change="toggleSelect(item.maTaiKhoan)"
                            />
                        </td>
                        <td>
                            {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                        </td>
                        <td>{{ item.email || item.SDT }}</td>
                        <td>{{ item.tenTaiKhoan }}</td>
                        <td>
                            {{
                                new Date(item.ngayTaoTK).toLocaleDateString(
                                    "vi-VN"
                                )
                            }}
                        </td>
                        <td>{{ item.tenVaiTro }}</td>
                        <td>{{ item.trangThai }}</td>
                        <td>
                            <span
                                v-if="item.trangThai === 'khoa'"
                                title="Mở khóa"
                            >
                                <i
                                    class="fas fa-lock locked"
                                    @click="
                                        toggleKhoaTaiKhoan(
                                            item.maTaiKhoan,
                                            item.trangThai
                                        )
                                    "
                                ></i>
                            </span>
                            <span v-else title="Khóa">
                                <i
                                    class="fas fa-lock unlocked"
                                    @click="
                                        toggleKhoaTaiKhoan(
                                            item.maTaiKhoan,
                                            item.trangThai
                                        )
                                    "
                                ></i>
                            </span>
                        </td>
                        <td>
                            <button
                                class="btn-detail"
                                @click="onEdit(item.maTaiKhoan)"
                                title="Sửa tài khoản"
                            >
                                <i class="fas fa-pen"></i>
                            </button>
                        </td>
                        <td>
                            <button
                                class="btn-delete"
                                @click="onDelete(item.maTaiKhoan)"
                                title="Xóa tài khoản"
                            >
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                    <tr v-if="pagedTaiKhoan.length === 0">
                        <td colspan="9" class="no-data">Không có tài khoản</td>
                    </tr>
                </tbody>
            </table>

            <div class="bottom-controls">
                <button
                    class="btn-delete-selected"
                    @click="onDeleteSelected"
                    :disabled="selectedIds.size === 0"
                >
                    Xóa {{ selectedIds.size }} tài khoản đã chọn
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
        <!-- Modal Thêm/Sửa tài khoản -->
        <div v-if="showModal" class="modal" @click="closeModalOnClickOutside">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>
                        {{
                            isEdit
                                ? "Chỉnh sửa thông tin tài khoản"
                                : "Thêm tài khoản mới"
                        }}
                    </h3>
                    <button class="close-btn" @click="closeModal">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="name">Tên tài khoản</label>
                        <input
                            id="name"
                            v-model="name"
                            type="text"
                            placeholder="Nhập tên tài khoản"
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
                        <label for="vaitro">Vai trò</label>
                        <select id="vaitro" v-model="roleID">
                            <option value="" disabled>Chọn vai trò</option>
                            <option
                                v-for="role in vaiTroList"
                                :key="role.maVaiTro"
                                :value="role.maVaiTro"
                            >
                                {{ role.tenVaiTro }}
                            </option>
                        </select>
                    </div>
                </div>

                <div class="modal-footer">
                    <button
                        class="btn-save"
                        @click="isEdit ? updateTK() : saveTK()"
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
    margin-bottom: 25px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.role-filter {
    padding: 6px 12px;
    font-size: 1.4rem;
    border-radius: 4px;
    border: 1px solid var(--light-gray-color);
    background-color: var(--white-color);
    cursor: pointer;
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
.account-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.4rem;
    color: var(--black-color);
}

.account-table th,
.account-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}
.account-table td:nth-child(3),
.account-table td:nth-child(4) {
    text-align: left;
}

.account-table thead {
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

.locked {
    color: var(--light-yellow);
}

.unlocked {
    color: var(--light-gray-color);
}

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

    .account-table {
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

    .account-table {
        display: block;
        overflow-x: auto;
        white-space: nowrap;
        font-size: 1rem;
    }

    .account-table th,
    .account-table td {
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
