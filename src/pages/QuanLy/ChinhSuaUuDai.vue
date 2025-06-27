<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import Swal from "sweetalert2";

import { fetchKhuyenMai, updateKhuyenMai } from "@/services/khuyenmai";

const router = useRouter();
const route = useRoute();

const maKhuyenMai = Number(route.params.maKhuyenMai);

const tenKhuyenMai = ref("");
const dieuKienApDung = ref("");
const thoiGianApDung = ref("");
const thoiGianHetHan = ref("");
const phanTram = ref("");
const soLuong = ref("");
const moTa = ref("");
const hinhAnh = ref(null);
const fileInput = ref(null);
const previewImageUrl = ref("");
const danhSachKhuyenMai = ref("");
const thisKhuyenMai = ref("");

// Lấy ngày hiện tại để làm min date cho ngày áp dụng
const today = new Date().toISOString().split("T")[0];

// Kiểm tra xem ngày hết hạn có sau ngày áp dụng không
const isValidDate = computed(() => {
    if (!thoiGianApDung.value || !thoiGianHetHan.value) return true;
    return thoiGianHetHan.value > thoiGianApDung.value;
});

// Format giá trị tiền
const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return "0đ";
    return Number(value).toLocaleString("vi-VN") + "đ";
};

const resetForm = async () => {
    await loadData();

    tenKhuyenMai.value = thisKhuyenMai.value.tenKhuyenMai;
    dieuKienApDung.value = thisKhuyenMai.value.dieuKienApDung;
    thoiGianApDung.value = thisKhuyenMai.value.thoiGianApDung.slice(0, 10);
    thoiGianHetHan.value = thisKhuyenMai.value.thoiGianHetHan.slice(0, 10);
    phanTram.value = thisKhuyenMai.value.phanTram;
    soLuong.value = thisKhuyenMai.value.soLuong;
    moTa.value = thisKhuyenMai.value.moTa || "";
    previewImageUrl.value = thisKhuyenMai.value.hinhAnh || "";
    hinhAnh.value = null;
};

// Hàm cập nhật khuyến mãi
const submitKhuyenMai = async () => {
    if (
        !tenKhuyenMai.value ||
        !dieuKienApDung.value ||
        !thoiGianApDung.value ||
        !thoiGianHetHan.value ||
        !phanTram.value ||
        !soLuong.value
    ) {
        Swal.fire("Lỗi", "Vui lòng điền đầy đủ thông tin", "error");
        return;
    }

    // Kiểm tra ngày hết hạn có hợp lệ không
    if (!isValidDate.value) {
        Swal.fire("Lỗi", "Ngày hết hạn phải sau ngày áp dụng", "error");
        return;
    }

    const formData = new FormData();
    formData.append("tenKhuyenMai", tenKhuyenMai.value);
    formData.append("dieuKienApDung", dieuKienApDung.value);
    formData.append("thoiGianApDung", thoiGianApDung.value);
    formData.append("thoiGianHetHan", thoiGianHetHan.value);
    formData.append("phanTram", phanTram.value);
    formData.append("soLuong", soLuong.value);
    formData.append("moTa", moTa.value);

    // Nếu không chọn ảnh mới, thì giữ lại ảnh cũ
    if (hinhAnh.value) {
        formData.append("hinhAnh", hinhAnh.value);
    } else {
        // Giữ lại ảnh cũ
        formData.append("hinhAnh", thisKhuyenMai.value.hinhAnh);
    }

    try {
        const res = await updateKhuyenMai(maKhuyenMai, formData);
        if (res.data.success) {
            Swal.fire("Thành công", "Khuyến mãi đã được cập nhật!", "success");
            router.push("/admin/uudai");
        } else {
            Swal.fire(
                "Lỗi",
                res.data.message || "Có lỗi khi cập nhật khuyến mãi",
                "error"
            );
        }
    } catch (error) {
        console.error("Lỗi khi gửi dữ liệu:", error);
        Swal.fire("Lỗi", "Có lỗi xảy ra khi gửi dữ liệu", "error");
    }
};

const loadData = async () => {
    const km = await fetchKhuyenMai();
    danhSachKhuyenMai.value = km;
    console.log("Mã khuyến mãi: ", maKhuyenMai);

    thisKhuyenMai.value = km.find((km) => km.maKhuyenMai === maKhuyenMai);

    if (!thisKhuyenMai.value) {
        console.error("Không tìm thấy khuyến mãi với mã:", maKhuyenMai);
    }

    tenKhuyenMai.value = thisKhuyenMai.value.tenKhuyenMai;
    dieuKienApDung.value = thisKhuyenMai.value.dieuKienApDung;
    thoiGianApDung.value = thisKhuyenMai.value.thoiGianApDung.slice(0, 10); // “YYYY-MM-DD”
    thoiGianHetHan.value = thisKhuyenMai.value.thoiGianHetHan.slice(0, 10);
    phanTram.value = thisKhuyenMai.value.phanTram;
    soLuong.value = thisKhuyenMai.value.soLuong;
    moTa.value = thisKhuyenMai.value.moTa || "";
    previewImageUrl.value = thisKhuyenMai.value.hinhAnh || "";
};
onMounted(loadData);

// Hàm kích hoạt chọn tệp ảnh
const handleClickUpload = () => {
    fileInput.value.click();
};

// Hàm xử lý thay đổi tệp ảnh
const onFileChange = (e) => {
    const files = e.target.files;
    if (files.length) {
        hinhAnh.value = files[0];
        previewImageUrl.value = URL.createObjectURL(hinhAnh.value);
    }
};
</script>

<template>
    <div class="page-container">
        <h3 class="title">Quản lý mã khuyến mãi</h3>
        <hr />

        <div class="top-bar">
            <button class="btn-back" @click="router.back()">
                <i class="fas fa-chevron-left"></i>
                <span>Quay lại trang trước</span>
            </button>
            <div class="page-title">Chỉnh sửa mã khuyến mãi</div>
        </div>

        <form class="form-main">
            <!-- Upload ảnh -->
            <div class="form-left">
                <div class="inputImage" @click="handleClickUpload">
                    <div class="upload-icon">
                        <img
                            src="/assets/images/upload-icon.png"
                            alt="Upload icon"
                        />
                    </div>
                    <div>Tải ảnh lên</div>
                    <input
                        id="file-upload"
                        ref="fileInput"
                        type="file"
                        accept="image/*"
                        @change="onFileChange"
                        hidden
                    />
                    <img
                        v-if="previewImageUrl"
                        :src="previewImageUrl"
                        alt="Ảnh khuyến mãi"
                        class="preview"
                    />
                </div>
            </div>

            <div class="form-right">
                <div class="form-group">
                    <label>
                        Tên khuyến mãi <span class="required">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Nhập tên khuyến mãi"
                        v-model="tenKhuyenMai"
                        required
                    />
                </div>

                <div class="form-group">
                    <label>
                        Điều kiện áp dụng <span class="required">*</span>
                    </label>
                    <input
                        type="number"
                        min="0"
                        v-model="dieuKienApDung"
                        placeholder="Giá trị hóa đơn tối thiều được áp dụng"
                        required
                    />
                </div>

                <div class="form-group">
                    <label>
                        Thời gian áp dụng <span class="required">*</span>
                    </label>
                    <input
                        type="date"
                        placeholder="Thời gian áp dụng"
                        v-model="thoiGianApDung"
                        :min="today"
                        required
                    />
                </div>
                <div class="form-group">
                    <label>
                        Thời gian hết hạn <span class="required">*</span>
                    </label>
                    <input
                        type="date"
                        placeholder="Thời gian hết hạn"
                        v-model="thoiGianHetHan"
                        :min="thoiGianApDung"
                        required
                    />
                </div>

                <div class="form-group">
                    <label>
                        Phần trăm giảm <span class="required">*</span>
                    </label>
                    <input
                        type="number"
                        placeholder="Phần trăm giảm"
                        v-model="phanTram"
                        required
                    />
                </div>

                <div class="form-group">
                    <label> Số lượng<span class="required">*</span> </label>
                    <input
                        type="number"
                        placeholder="Số lượng"
                        v-model="soLuong"
                        required
                    />
                </div>

                <div class="form-group">
                    <label>Mô tả</label>
                    <textarea
                        rows="3"
                        placeholder="Mô tả món ăn"
                        v-model="moTa"
                    ></textarea>
                </div>
            </div>
        </form>

        <div class="form-actions">
            <button type="button" class="btn-save" @click="submitKhuyenMai">
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
    background-color: var(--white-color);
    border: 1px solid var(--light-gray-color);
    box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.1);
    padding: 20px 100px;
    border-radius: 10px;
}

/* upload ảnh */
.form-left {
    flex-shrink: 0;
    width: 30%;
}

.inputImage {
    width: 200px;
    height: 200px;
    border-radius: 10px;
    background: var(--light-blue-color);
    border: 1px solid var(--dark-blue-color);
    color: var(--black-color);
    font-weight: 600;
    font-size: 1.6rem;
    text-align: center;
    cursor: pointer;
    padding: 20px 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    user-select: none;
    transition: background-color 0.3s ease;
    position: relative;
}

.inputImage:hover {
    background-color: #c3defd;
}

.inputImage input[type="file"] {
    display: none;
}

.upload-icon {
    width: 70px;
    height: 70px;
    margin: 0 auto 10px;
}

.upload-icon img {
    max-width: 100%;
    max-height: 100%;
}

.preview {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 200px;
    height: 200px;
    border-radius: 10px;
    object-fit: cover;
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.15);
    pointer-events: none;
}

/* danh sách ảnh preview */
.listImage {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
}

.preview-wrapper {
    position: relative;
    width: 70px;
    height: 70px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.preview-wrapper img.preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

/* nút xóa ảnh */
.btn-remove-image {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: none;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    font-weight: bold;
    font-size: 1.2rem;
    line-height: 18px;
    text-align: center;
    cursor: pointer;
    user-select: none;
    padding: 0;
    transition: background-color 0.3s ease;
}
.btn-remove-image:hover {
    background-color: rgba(255, 0, 0, 0.85);
}

/* bên phải */
.form-right {
    flex: 1;
    display: flex;
    gap: 15px;
    align-items: flex-start;
    flex-wrap: nowrap;
    flex-direction: column;
    padding: 0 50px;
}

.form-group {
    flex: 1;
    min-width: 120px;
    display: flex;
    flex-direction: column;
    width: 100%;
}

.form-group label {
    font-weight: 600;
    margin-bottom: 5px;
    color: var(--black-color);
}

.form-group label .required {
    color: #e03131;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #ccc;
    font-size: 1.4rem;
    box-sizing: border-box;
    font-family: inherit;
}

.form-group textarea {
    height: 72px;
    resize: none;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #339af0;
    box-shadow: 0 0 5px rgba(51, 154, 240, 0.5);
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
