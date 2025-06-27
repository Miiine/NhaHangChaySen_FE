<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import Swal from "sweetalert2";
import dayjs from "dayjs";

import { fetchPhieuNhapKho } from "@/services/phieunhapkho";

const router = useRouter();
const route = useRoute();

const maNhapKho = Number(route.params.maNhapKho);
const thisPNK = ref("");

const danhSachPhieuNhapKho = ref([]);
const danhSachNguyenLieuChon = ref([]);

const tenNCC = ref("");
const tenNhanVien = ref("");
const thoiGianNhapKho = ref("");
const tongTien = ref("");

const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return "0đ";
    return Number(value).toLocaleString("vi-VN") + "đ";
};

const formattedTime = computed(() => {
    return thoiGianNhapKho.value
        ? dayjs(thoiGianNhapKho.value).format("HH:mm DD/MM/YYYY")
        : "";
});

function goToEditPage() {
    router.push({
        name: "ChinhSuaPhieuNhapKho",
        params: { maNhapKho },
    });
}

const loadData = async () => {
    danhSachPhieuNhapKho.value = await fetchPhieuNhapKho();
    const pnk = danhSachPhieuNhapKho.value.find(
        (x) => x.maNhapKho === maNhapKho
    );
    if (!pnk) {
        console.error("Không tìm thấy phiếu số", maNhapKho);
        return;
    }

    thisPNK.value = pnk;
    tenNCC.value = pnk.nhaCungCap.tenNCC;
    tenNhanVien.value = pnk.taiKhoan.tenTaiKhoan;
    thoiGianNhapKho.value = pnk.thoiGianNhapKho;
    tongTien.value = pnk.tongTien;
    danhSachNguyenLieuChon.value = pnk.chiTietNhapKho;
};
onMounted(loadData);
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
            <div class="page-title">Chi tiết phiếu nhập kho</div>
        </div>

        <div class="form-main">
            <h4>Thông tin nhập kho</h4>
            <div class="form-container">
                <div class="form-left">
                    <div class="form-group">
                        <label>Thời gian nhập kho:</label>
                        <input
                            type="text"
                            v-model="formattedTime"
                            readonly
                            class="readonly-input"
                        />
                    </div>
                    <div class="form-group">
                        <label>Tổng tiền:</label>
                        <input
                            type="text"
                            :value="formatCurrency(tongTien)"
                            readonly
                            class="readonly-input"
                        />
                    </div>
                </div>

                <div class="form-right">
                    <div class="form-group">
                        <label>Nhà cung cấp:</label>
                        <input
                            type="text"
                            v-model="tenNCC"
                            readonly
                            class="readonly-input"
                        />
                    </div>
                    <div class="form-group">
                        <label>Nhân viên nhập kho:</label>
                        <input
                            type="text"
                            v-model="tenNhanVien"
                            readonly
                            class="readonly-input"
                        />
                    </div>
                </div>
            </div>
        </div>
        <div class="ingredients-container">
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
                                {{ item.soLuong }}
                            </td>
                            <td>{{ item.donViTinh }}</td>
                            <td>
                                {{
                                    (item.soLuong * item.donGia).toLocaleString(
                                        "vi-VN"
                                    )
                                }}đ
                            </td>
                        </tr>

                        <tr>
                            <td
                                colspan="6"
                                style="text-align: right; font-weight: 700"
                            >
                                Tổng cộng:
                            </td>
                            <td style="font-weight: 700">
                                {{ formatCurrency(tongTien) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="form-actions">
            <button type="button" class="btn-save" @click="goToEditPage()">
                Chỉnh sửa
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
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    background-color: var(--white-color);
    border: 1px solid var(--light-gray-color);
    border-radius: 8px;
}

.form-container {
    display: flex;
    gap: 20px;
    min-height: 150px;
}

.form-left,
.form-right {
    flex: 1;
    padding: 15px;
}

.form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
}
.form-group label {
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: var(--black-color);
}
.readonly-input {
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    background-color: #f9f9f9;
    color: #333;
    font-size: 1.6rem;
}
.readonly-input[readonly] {
    cursor: default;
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
