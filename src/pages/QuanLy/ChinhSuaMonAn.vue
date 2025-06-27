<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import Swal from "sweetalert2";

import { fetchLoaiNL } from "@/services/loainguyenlieu";
import { fetchNguyenLieu } from "@/services/nguyenlieu";
import { fetchLoaiMonAn } from "@/services/loaimonan";
import { fetchMonAn, updateMonAn } from "@/services/monan";

const router = useRouter();
const route = useRoute();

const maMonAn = Number(route.params.maMonAn);
const thisMonAn = ref([]);

const tenMonAn = ref("");
const maLoaiMonAn = ref("");
const donGia = ref("");
const giaGoc = ref("");
const donViTinh = ref("");
const moTa = ref("");
const anhMonAn = ref("");

const danhSachLoaiNL = ref([]);
const danhSachLoaiMonAn = ref([]);
const danhSachNguyenLieu = ref([]);
const danhSachNguyenLieuChon = ref([]);
const danhSachMonAn = ref([]);

const existingUrls = ref([]); // chỉ chứa các string URL từ API
const uploadedFiles = ref([]); // chứa File do user chọn
const previewUrls = ref([]); // chứa tất cả URL để render

const fileInput = ref(null);

const selectedLoaiNL = ref("");
const searchTermNL = ref("");
const currentPageNL = ref(1);
const itemsPerPageNL = 5;

const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return "0đ";
    return Number(value).toLocaleString("vi-VN") + "đ";
};

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
        soLuongSuDung: 0,
    });
};

const removeNguyenLieu = (maNguyenLieu) => {
    const index = danhSachNguyenLieuChon.value.findIndex(
        (item) => item.maNguyenLieu === maNguyenLieu
    );
    if (index !== -1) danhSachNguyenLieuChon.value.splice(index, 1);
};

const resetForm = () => {
    loadData();
    uploadedFiles.value = [];
};

//hàm cập nhật món ăn
const submitMonAn = async () => {
    try {
        const formData = new FormData();

        // 1. Các trường text/number
        formData.append("tenMonAn", tenMonAn.value);
        formData.append("maLoai", maLoaiMonAn.value);
        formData.append("donGia", donGia.value);
        formData.append("giaGoc", giaGoc.value);
        formData.append("donViTinh", donViTinh.value);
        formData.append("moTa", moTa.value);

        // 2. Danh sách nguyên liệu
        if (danhSachNguyenLieuChon.value.length) {
            formData.append(
                "chiTietNguyenLieu",
                JSON.stringify(
                    danhSachNguyenLieuChon.value.map((ct) => ({
                        maNguyenLieu: ct.maNguyenLieu,
                        soLuongNL: ct.soLuongNL,
                    }))
                )
            );
        }

        // 3. Danh sách URL ảnh cũ còn giữ lại
        formData.append("existingUrls", JSON.stringify(existingUrls.value));

        // 4. Các file mới user vừa upload
        uploadedFiles.value.forEach((file) => {
            formData.append("images", file);
        });

        // Gọi API
        await updateMonAn(maMonAn, formData);

        Swal.fire("Thành công", "Cập nhật món ăn thành công!", "success");

        router.push({ name: "DanhSachMonAn" });
    } catch (err) {
        console.error(err);
        Swal.fire(
            "Lỗi",
            "Cập nhật món ăn thất bại. Vui lòng thử lại.",
            "error"
        );
    }
};

const loadData = async () => {
    danhSachLoaiNL.value = await fetchLoaiNL();
    danhSachNguyenLieu.value = await fetchNguyenLieu();
    danhSachLoaiMonAn.value = await fetchLoaiMonAn();

    const monArr = await fetchMonAn();
    danhSachMonAn.value = monArr;

    const mon = danhSachMonAn.value.find((m) => m.maMonAn === maMonAn);
    if (!mon) return console.error("Không tìm thấy món ăn với mã: ", maMonAn);
    thisMonAn.value = mon;

    tenMonAn.value = mon.tenMonAn;
    donGia.value = mon.donGia;
    giaGoc.value = mon.giaGoc;
    donViTinh.value = mon.donViTinh;
    moTa.value = mon.moTa;
    maLoaiMonAn.value = mon.maLoai;

    existingUrls.value = Array.isArray(mon.anhMonAn)
        ? mon.anhMonAn.map((i) => i.url)
        : [];

    updatePreviews();

    danhSachNguyenLieuChon.value = Array.isArray(mon.chiTietMonAn)
        ? mon.chiTietMonAn.map((ct) => ({ ...ct }))
        : [];
};
onMounted(loadData);

const onFilesChange = (e) => {
    uploadedFiles.value.push(...e.target.files);
    updatePreviews();
};

const handleClickUpload = () => {
    if (fileInput.value) {
        fileInput.value.click();
    }
};

// Khi previewUrls thay đổi, cập nhật previewUrls
watch(
    [uploadedFiles, existingUrls],
    ([newUploaded, newExisting], [oldUploaded, oldExisting]) => {
        // 1) Revoke hết blob URL cũ
        previewUrls.value.forEach((u) => {
            if (u.startsWith("blob:")) URL.revokeObjectURL(u);
        });

        // 2) Sinh blob URL mới từ uploadedFiles
        const newBlobUrls = newUploaded
            .filter((f) => f instanceof Blob)
            .map((file) => URL.createObjectURL(file));

        // 3) Gộp ảnh cũ + blob mới
        previewUrls.value = [
            ...newExisting, // chuỗi URL gốc
            ...newBlobUrls, // các blob:... mới
        ];
    },
    { deep: true, immediate: true }
);

// Xóa ảnh
function removeImage(idx) {
    // nếu idx nằm trong ảnh cũ
    if (idx < existingUrls.value.length) {
        existingUrls.value.splice(idx, 1);
    } else {
        // là ảnh mới: bù bù offset = existingUrls.length
        const fileIdx = idx - existingUrls.value.length;
        uploadedFiles.value.splice(fileIdx, 1);
    }
    updatePreviews();
}

function updatePreviews() {
    // Giải phóng các objectURL cũ
    previewUrls.value.forEach((u) => {
        // chỉ revoke những URL do createObjectURL tạo ra
        // bạn có thể đánh dấu hoặc so sánh xem nó có phải blob URL không
        if (u.startsWith("blob:")) URL.revokeObjectURL(u);
    });
    // Kết hợp ảnh cũ + ảnh mới
    previewUrls.value = [
        ...existingUrls.value,
        ...uploadedFiles.value.map((file) => URL.createObjectURL(file)),
    ];
}
</script>

<template>
    <div class="page-container">
        <h3 class="title">Danh sách món ăn</h3>
        <hr />

        <div class="top-bar">
            <button class="btn-back" @click="router.back()">
                <i class="fas fa-chevron-left"></i>
                <span>Quay lại trang trước</span>
            </button>
            <div class="page-title">Chỉnh sửa món ăn</div>
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
                        @change="onFilesChange"
                        hidden
                    />
                    <img
                        v-if="anhMonAn"
                        :src="anhMonAn"
                        alt="Ảnh món ăn"
                        class="preview"
                    />
                </div>
                <div class="listImage">
                    <div
                        v-for="(src, index) in previewUrls"
                        :key="index"
                        class="preview-wrapper"
                    >
                        <img :src="src" alt="Ảnh món ăn" class="preview" />
                        <button
                            type="button"
                            class="btn-remove-image"
                            @click="removeImage(index)"
                        >
                            ×
                        </button>
                    </div>
                </div>
            </div>

            <div class="form-right">
                <div class="form-group">
                    <label> Tên món ăn <span class="required">*</span> </label>
                    <input
                        type="text"
                        placeholder="Tên món ăn"
                        v-model="tenMonAn"
                        required
                    />
                </div>

                <div class="form-group">
                    <label> Loại món <span class="required">*</span> </label>
                    <select v-model="maLoaiMonAn" required>
                        <option value="" disabled>--Chọn loại món--</option>
                        <option
                            v-for="loai in danhSachLoaiMonAn"
                            :key="loai.maLoai"
                            :value="loai.maLoai"
                        >
                            {{ loai.tenLoai }}
                        </option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Giá gốc</label>
                    <input
                        type="number"
                        min="0"
                        v-model="giaGoc"
                        placeholder="Giá gốc"
                    />
                </div>

                <div class="form-group">
                    <label> Giá bán <span class="required">*</span> </label>
                    <input
                        type="number"
                        min="0"
                        v-model="donGia"
                        placeholder="Giá bán"
                        required
                    />
                </div>

                <div class="form-group">
                    <label> Đơn vị tính <span class="required">*</span> </label>
                    <input
                        type="text"
                        placeholder="vd: kg, cái"
                        v-model="donViTinh"
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
                <h4>Thành phần chính:</h4>
                <table class="main-ingredients-table">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Danh mục</th>
                            <th>Tên NL</th>
                            <th>Số lượng sử dụng</th>
                            <th>Đơn vị</th>
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
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    :max="item.soLuongCon"
                                    v-model.number="item.soLuongNL"
                                />
                            </td>
                            <td>{{ item.donViTinh }}</td>
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
                    </tbody>
                </table>
            </div>
        </div>
        <div class="form-actions">
            <button type="button" class="btn-save" @click="submitMonAn">
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
    padding: 0 100px;
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
    width: 26%;
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
