<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import Swal from "sweetalert2";

import { fetchLoaiNL } from "@/services/loainguyenlieu";
import { fetchNguyenLieu } from "@/services/nguyenlieu";
import { fetchTaiKhoan } from "@/services/taikhoan";
import { fetchNhaCungCap } from "@/services/nhacungcap";
import {
    fetchPhieuNhapKho,
    addPhieuNhapKho,
    updatePhieuNhapKho,
} from "@/services/phieunhapkho";

const router = useRouter();
const route = useRoute();

const maNhapKho = Number(route.params.maNhapKho);
const thisPNK = ref("");

const danhSachLoaiNL = ref([]);
const danhSachNguyenLieu = ref([]);
const danhSachTaiKhoan = ref([]);
const danhSachNhaCungCap = ref([]);
const danhSachPhieuNhapKho = ref([]);
const danhSachNguyenLieuChon = ref([]);

const selectedLoaiNL = ref("");
const searchTermNL = ref("");
const currentPageNL = ref(1);
const itemsPerPageNL = 5;

const selectedMaNCC = ref("");
const selectedMaTaiKhoan = ref("");

const selectedNCC = ref(null); // object nhà cung cấp đã chọn
const selectedNhanVien = ref(null); // object nhân viên nhập kho đã chọn

const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return "0đ";
    return Number(value).toLocaleString("vi-VN") + "đ";
};

// Lọc danh sách nhân viên có mã vai trò = 2
const danhSachNhanVienNhapKho = computed(() =>
    danhSachTaiKhoan.value.filter((tk) => tk.maVaiTro === 2)
);

const tongThanhTien = computed(() => {
    return danhSachNguyenLieuChon.value.reduce((sum, item) => {
        const thanhTien = (item.soLuongSuDung || 0) * (item.donGia || 0);
        return sum + thanhTien;
    }, 0);
});

const filteredNguyenLieu = computed(() => {
    let list = danhSachNguyenLieu.value || [];

    if (selectedLoaiNL.value) {
        list = list.filter((nl) => nl.maLoaiNL === selectedLoaiNL.value);
    }

    if (searchTermNL.value.trim() !== "") {
        const term = searchTermNL.value.trim().toLowerCase();
        list = list.filter((nl) =>
            nl.tenNguyenLieu.toLowerCase().includes(term)
        );
    }

    return list;
});

const totalPagesNL = computed(() => {
    return Math.ceil(filteredNguyenLieu.value.length / itemsPerPageNL) || 1;
});

const pagedNguyenLieu = computed(() => {
    const start = (currentPageNL.value - 1) * itemsPerPageNL;
    return filteredNguyenLieu.value.slice(start, start + itemsPerPageNL);
});

const goToPageNL = (page) => {
    if (page < 1) page = 1;
    else if (page > totalPagesNL.value) page = totalPagesNL.value;
    currentPageNL.value = page;
};

const addNguyenLieu = (nl) => {
    if (
        danhSachNguyenLieuChon.value.find(
            (item) => item.maNguyenLieu === nl.maNguyenLieu
        )
    ) {
        Swal.fire("Thông báo", "Nguyên liệu đã được chọn.", "info");
        return;
    }
    danhSachNguyenLieuChon.value.push({
        ...nl,
        soLuongSuDung: 1,
    });
};

const removeNguyenLieu = (maNguyenLieu) => {
    const index = danhSachNguyenLieuChon.value.findIndex(
        (item) => item.maNguyenLieu === maNguyenLieu
    );
    if (index !== -1) danhSachNguyenLieuChon.value.splice(index, 1);
};
const resetForm = () => {
    selectedMaNCC.value = thisPNK.value.maNCC;
    selectedMaTaiKhoan.value = thisPNK.value.maTaiKhoan;

    danhSachNguyenLieuChon.value = thisPNK.value.chiTietNhapKho.map((ct) => ({
        maNguyenLieu: ct.maNguyenLieu,
        tenNguyenLieu: ct.tenNguyenLieu,
        tenLoaiNL: ct.tenLoaiNL,
        donGia: ct.donGia,
        donViTinh: ct.donViTinh,
        soLuongSuDung: ct.soLuong,
    }));

    selectedLoaiNL.value = "";
    searchTermNL.value = "";
    currentPageNL.value = 1;
};

const submitEdit = async () => {
    if (!selectedMaNCC.value || !selectedMaTaiKhoan.value) {
        return Swal.fire("Thiếu dữ liệu", "Chọn NCC và nhân viên", "warning");
    }
    if (danhSachNguyenLieuChon.value.length === 0) {
        return Swal.fire("Thiếu dữ liệu", "Chưa chọn nguyên liệu", "warning");
    }

    try {
        await updatePhieuNhapKho(maNhapKho, {
            maTaiKhoan: selectedMaTaiKhoan.value,
            maNCC: selectedMaNCC.value,
            chiTietNhapKho: danhSachNguyenLieuChon.value.map((item) => ({
                maNguyenLieu: item.maNguyenLieu,
                donGia: item.donGia,
                soLuong: item.soLuongSuDung,
                donViTinh: item.donViTinh,
            })),
        });
        Swal.fire(
            "Thành công",
            "Cập nhật phiếu nhập kho thành công",
            "success"
        );
        router.push({
            name: "ChiTietPhieuNhapKho",
            params: { maNhapKho },
        });
    } catch (err) {
        console.error(err);
        const msg =
            err.response?.data?.message ||
            "Không thể cập nhật phiếu nhập kho, vui lòng thử lại";
        Swal.fire("Lỗi", msg, "error");
    }
};

const loadData = async () => {
    danhSachLoaiNL.value = await fetchLoaiNL();
    danhSachNguyenLieu.value = await fetchNguyenLieu();
    danhSachTaiKhoan.value = await fetchTaiKhoan();
    danhSachNhaCungCap.value = await fetchNhaCungCap();
    danhSachPhieuNhapKho.value = await fetchPhieuNhapKho();

    const pnk = danhSachPhieuNhapKho.value.find(
        (x) => x.maNhapKho === maNhapKho
    );
    if (!pnk) {
        console.error("Không tìm thấy phiếu số", maNhapKho);
        return;
    }

    thisPNK.value = pnk;

    selectedMaNCC.value = pnk.maNCC;
    selectedMaTaiKhoan.value = pnk.maTaiKhoan;

    danhSachNguyenLieuChon.value = pnk.chiTietNhapKho.map((ct) => ({
        maNguyenLieu: ct.maNguyenLieu,
        tenNguyenLieu: ct.tenNguyenLieu,
        tenLoaiNL: ct.tenLoaiNL,
        donViTinh: ct.donViTinh,
        donGia: ct.donGia,
        soLuongSuDung: ct.soLuong,
    }));
};
onMounted(loadData);

watch(selectedMaNCC, (newVal) => {
    selectedNCC.value =
        danhSachNhaCungCap.value.find((ncc) => ncc.maNCC === Number(newVal)) ||
        null;
});

watch(selectedMaTaiKhoan, (newVal) => {
    selectedNhanVien.value =
        danhSachNhanVienNhapKho.value.find(
            (nv) => nv.maTaiKhoan === Number(newVal)
        ) || null;
});
</script>

<template>
    <div class="page-container">
        <h3 class="title">Lịch sử nhập kho</h3>
        <hr />

        <div class="top-bar">
            <button class="btn-back" @click="router.back()">
                <i class="fas fa-chevron-left"></i>
                <span>Quay lại trang trước</span>
            </button>
            <div class="page-title">Chỉnh sửa phiếu nhập kho</div>
        </div>

        <div class="form-main">
            <!-- Bên trái: thông tin nhà cung cấp -->
            <div class="form-left">
                <h4>Thông tin nhà cung cấp</h4>
                <select v-model="selectedMaNCC">
                    <option value="">-- Chọn nhà cung cấp --</option>
                    <option
                        v-for="ncc in danhSachNhaCungCap"
                        :key="ncc.maNCC"
                        :value="ncc.maNCC"
                    >
                        {{ ncc.tenNCC }}
                    </option>
                </select>

                <div v-if="selectedNCC" class="ncc-info">
                    <a href="#" class="ncc-name">{{ selectedNCC.tenNCC }}</a>
                    <p class="ncc-address">{{ selectedNCC.diaChiChiTiet }}</p>
                </div>
            </div>

            <!-- Bên phải: chọn nhân viên nhập kho -->
            <div class="form-right">
                <h4>Thông tin đơn nhập hàng</h4>
                <select v-model="selectedMaTaiKhoan">
                    <option value="">-- Chọn nhân viên nhập kho --</option>
                    <option
                        v-for="nv in danhSachNhanVienNhapKho"
                        :key="nv.maTaiKhoan"
                        :value="nv.maTaiKhoan"
                    >
                        {{ nv.tenTaiKhoan }}
                    </option>
                </select>

                <div v-if="selectedNhanVien" class="nhanvien-info">
                    <a href="#" class="nv-name">{{
                        selectedNhanVien.tenTaiKhoan
                    }}</a>
                    <p class="nv-email">Email: {{ selectedNhanVien.email }}</p>
                </div>
            </div>
        </div>
        <div class="ingredients-container">
            <div class="left-panel">
                <div class="filter-types">
                    <select v-model="selectedLoaiNL">
                        <option value="">Tất cả loại nguyên liệu</option>
                        <option
                            v-for="loai in danhSachLoaiNL"
                            :key="loai.maLoaiNL"
                            :value="loai.maLoaiNL"
                        >
                            {{ loai.tenLoaiNL }}
                        </option>
                    </select>
                </div>

                <div class="search-box">
                    <input
                        type="text"
                        v-model="searchTermNL"
                        placeholder="Tìm kiếm nguyên liệu"
                        autocomplete="off"
                    />
                    <i class="fas fa-search"></i>
                </div>

                <!-- Danh sách nguyên liệu -->
                <div class="nguyen-lieu-list">
                    <div
                        v-for="nl in pagedNguyenLieu"
                        :key="nl.maNguyenLieu"
                        class="nguyen-lieu-item"
                        :class="{
                            'selected-item': danhSachNguyenLieuChon.some(
                                (item) => item.maNguyenLieu === nl.maNguyenLieu
                            ),
                        }"
                        @click="addNguyenLieu(nl)"
                    >
                        <div class="nguyen-lieu-left">
                            <div class="nguyen-lieu-loai">
                                {{ nl.tenLoaiNL }}
                            </div>
                            <div class="nguyen-lieu-ten">
                                {{ nl.tenNguyenLieu }}
                            </div>
                        </div>
                        <div class="nguyen-lieu-right">
                            <div>Đơn giá: {{ formatCurrency(nl.donGia) }}</div>
                            <div>Số lượng còn: {{ nl.soLuongCon }}</div>
                            <div>Đơn vị tính: {{ nl.donViTinh }}</div>
                        </div>
                    </div>
                </div>

                <!-- Phân trang -->
                <div class="pagination">
                    <button
                        :disabled="currentPageNL === 1"
                        @click="goToPageNL(currentPageNL - 1)"
                    >
                        &lt;
                    </button>
                    <span>{{ currentPageNL }} / {{ totalPagesNL }}</span>
                    <button
                        :disabled="currentPageNL === totalPagesNL"
                        @click="goToPageNL(currentPageNL + 1)"
                    >
                        &gt;
                    </button>
                </div>
            </div>

            <div class="right-panel">
                <h4>Danh sách nguyên liệu:</h4>
                <table class="main-ingredients-table">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Danh mục</th>
                            <th>Tên NL</th>
                            <th>Đơn giá</th>
                            <th>Số lượng nhập</th>
                            <th>Đơn vị</th>
                            <th>Thành tiền</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(item, index) in danhSachNguyenLieuChon"
                            :key="item.maNguyenLieu"
                        >
                            <td>{{ index + 1 }}</td>
                            <td>{{ item.tenLoaiNL }}</td>
                            <td>{{ item.tenNguyenLieu }}</td>
                            <td>
                                {{
                                    parseInt(item.donGia).toLocaleString(
                                        "vi-VN"
                                    )
                                }}đ
                            </td>
                            <td>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    :max="item.soLuongCon"
                                    v-model.number="item.soLuongSuDung"
                                />
                            </td>
                            <td>{{ item.donViTinh }}</td>
                            <td>
                                {{
                                    (
                                        item.soLuongSuDung * item.donGia
                                    ).toLocaleString("vi-VN")
                                }}đ
                            </td>
                            <td>
                                <button
                                    @click="removeNguyenLieu(item.maNguyenLieu)"
                                    class="btn-remove"
                                >
                                    ✕
                                </button>
                            </td>
                        </tr>
                        <tr v-if="danhSachNguyenLieuChon.length === 0">
                            <td colspan="6" class="no-data">
                                Chưa có nguyên liệu nào được chọn.
                            </td>
                        </tr>
                        <tr v-if="danhSachNguyenLieuChon.length > 0">
                            <td
                                colspan="6"
                                style="text-align: right; font-weight: 700"
                            >
                                Tổng cộng:
                            </td>
                            <td style="font-weight: 700">
                                {{ tongThanhTien.toLocaleString("vi-VN") }}đ
                            </td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="form-actions">
            <button type="button" class="btn-save" @click="submitEdit">
                Lưu
            </button>
            <button type="button" class="btn-cancel" @click="resetForm">
                Hủy
            </button>
        </div>
    </div>
</template>

<style scoped>
.page-container {
    margin: 20px 100px;
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

/* form container */
.form-main {
    display: flex;
    gap: 20px;
    padding: 20px;
    background-color: var(--white-color);
    border: 1px solid var(--light-gray-color);
    border-radius: 8px;
    min-height: 200px;
}

.form-left,
.form-right {
    flex: 1;
    background: var(--white-color);
    padding: 15px;
    border-radius: 8px;
    box-shadow: 1px 2px 6px rgb(0 0 0 / 0.1);
}

select {
    width: 100%;
    padding: 8px 10px;
    font-size: 1.4rem;
    border-radius: 6px;
    border: 1px solid #ccc;
    margin-bottom: 15px;
    cursor: pointer;
}

.ncc-info,
.nhanvien-info {
    margin-top: 10px;
}

.ncc-name,
.nv-name {
    color: #0056b3;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
    display: block;
    margin-bottom: 6px;
    text-decoration: none;
}

.ncc-name:hover,
.nv-name:hover {
    text-decoration: underline;
}

.ncc-address,
.nv-email {
    font-size: 1.2rem;
    color: #555;
}

/* phần nguyên liệu */
.ingredients-container {
    display: flex;
    gap: 20px;
    margin-top: 20px;
}

.left-panel,
.right-panel {
    flex: 1;
    background: var(--white-color);
    border: 1px solid var(--light-gray-color);
    box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 15px;
    max-height: 600px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}
.left-panel {
    flex: 0 0 40%;
}

.filter-types select {
    width: 100%;
    padding: 6px 10px;
    font-size: 1.4rem;
    margin-bottom: 10px;
    color: var(--black-color);
}

.search-box {
    position: relative;
    margin-bottom: 10px;
}

.search-box input {
    width: 100%;
    padding: 8px 35px 8px 10px;
    font-size: 1.4rem;
    border: 1px solid #ccc;
    border-radius: 5px;
}

.search-box i {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #888;
    pointer-events: none;
}

.nguyen-lieu-list {
    flex-grow: 1;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
    overflow-y: auto;
}

.nguyen-lieu-item {
    padding: 12px 16px;
    border: 1px solid #ccc;
    border-radius: 6px;
    margin: 8px 0;
    cursor: pointer;
    user-select: none;
    font-size: 1.4rem;
    background-color: var(--light-blue-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nguyen-lieu-left {
    display: flex;
    flex-direction: column;
}

.nguyen-lieu-loai {
    font-size: 1.2rem;
    font-style: italic;
    color: #6b7a6b;
    margin-bottom: 8px;
}

.nguyen-lieu-ten {
    font-size: 1.6rem;
    font-weight: 700;
    color: #384638;
}

.nguyen-lieu-right {
    display: flex;
    flex-direction: column;
    font-size: 1.2rem;
    color: #4a554a;
    text-align: left;
    gap: 4px;
    width: 30%;
}

.nguyen-lieu-item:hover {
    background-color: var(--dark-blue-color);
}

.selected-item {
    background-color: var(--light-green-color) !important;
}

.main-ingredients-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.4rem;
}

.main-ingredients-table th,
.main-ingredients-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}

.main-ingredients-table th {
    background-color: var(--light-green-color);
    font-weight: 700;
}

.main-ingredients-table input[type="number"] {
    width: 80px;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid #ccc;
    font-size: 1.4rem;
    text-align: center;
    box-sizing: border-box;
    transition: border-color 0.3s ease;
}

.main-ingredients-table input[type="number"]:focus {
    outline: none;
    border-color: #339af0;
    box-shadow: 0 0 5px rgba(51, 154, 240, 0.5);
}

.btn-remove {
    background: transparent;
    border: none;
    color: #d32f2f;
    cursor: pointer;
    font-weight: 700;
    font-size: 1.4rem;
}

.no-data {
    text-align: center;
    font-style: italic;
    color: #666;
}

/* action form */
.form-actions {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    gap: 20px;
}

.btn-save,
.btn-cancel {
    padding: 10px 40px;
    font-size: 1.4rem;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    user-select: none;
    border: none;
    text-transform: uppercase;
}

.btn-save {
    background-color: var(--dark-blue-color);
    color: #333;
    transition: background-color 0.3s ease;
}

.btn-save:hover {
    background-color: #6c9c96;
}

.btn-cancel {
    background-color: #ddd;
    color: #666;
    transition: background-color 0.3s ease;
}

.btn-cancel:hover {
    background-color: #bbb;
}

/* phân trang */
.pagination {
    margin-top: 10px;
    text-align: center;
    user-select: none;
    font-size: 1.4rem;
}

.pagination button {
    background-color: var(--dark-blue-color);
    color: white;
    border: none;
    padding: 6px 14px;
    margin: 0 6px;
    border-radius: 5px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.pagination button:disabled {
    background-color: var(--light-gray-color);
    cursor: not-allowed;
    color: #999;
}

.pagination span {
    font-weight: 600;
    color: var(--black-color);
}

@media screen and (max-width: 768px) {
    .form-main {
        flex-direction: column;
    }
    .form-left {
        width: 100%;
        height: auto;
        padding: 20px 0;
    }
    .form-right {
        flex-wrap: wrap;
        flex-direction: row;
    }
    .form-group {
        flex: 1 1 100% !important;
        min-width: auto !important;
        margin-bottom: 15px;
    }
}

/* Desktop (≥ 992px and < 1200px) */
@media screen and (max-width: 1199px) and (min-width: 992px) {
    .page-container {
        margin: 20px 60px;
    }
    .form-main {
        padding: 20px 40px;
    }
    .form-right {
        padding: 0 40px;
    }
}

/* Tablet (≥ 768px and < 992px) */
@media screen and (max-width: 991px) and (min-width: 768px) {
    .page-container {
        margin: 15px 40px;
    }
    .form-main {
        flex-direction: column;
        padding: 15px 20px;
    }
    .form-left {
        width: 100%;
        height: auto;
        padding: 0 0 20px 0;
    }
    .form-right {
        padding: 0;
        flex-wrap: wrap;
        flex-direction: row;
        gap: 10px;
    }
    .form-group {
        flex: 1 1 48%;
        min-width: auto !important;
        margin-bottom: 15px;
    }
}

/* Mobile (≥ 480px and < 768px) */
@media screen and (max-width: 767px) and (min-width: 480px) {
    .page-container {
        margin: 10px 20px;
    }
    .form-main {
        flex-direction: column;
        padding: 10px 15px;
    }
    .form-left {
        width: 100%;
        height: auto;
        padding: 0 0 15px 0;
    }
    .form-right {
        padding: 0;
        flex-wrap: wrap;
        flex-direction: row;
        gap: 8px;
    }
    .form-group {
        flex: 1 1 100%;
        min-width: auto !important;
        margin-bottom: 12px;
    }
}

/* Small mobile (< 480px) */
@media screen and (max-width: 479px) {
    .page-container {
        margin: 5px 10px;
    }
    .form-main {
        flex-direction: column;
        padding: 8px 10px;
    }
    .form-left {
        width: 100%;
        height: auto;
        padding: 0 0 10px 0;
    }
    .form-right {
        padding: 0;
        flex-wrap: wrap;
        flex-direction: row;
        gap: 5px;
    }
    .form-group {
        flex: 1 1 100%;
        min-width: auto !important;
        margin-bottom: 10px;
    }

    .btn-save,
    .btn-cancel {
        padding: 8px 30px;
        font-size: 1.2rem;
    }

    .btn-back {
        font-size: 1.2rem;
    }

    .title {
        font-size: 1.6rem;
    }
}
</style>
