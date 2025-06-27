<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Swal from "sweetalert2";
import BreadCrumb from "@/components/BreadCrumb.vue";
import BaseButton from "@/components/BaseButton.vue";
import { fetchDanhGia, addDanhGia, updateDanhGia } from "@/services/danhgia";

const { user } = useAuthStore();
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const maHoaDonStr = route.params.maHoaDon;
const maHoaDonNumber = Number(maHoaDonStr);

const danhGiaList = ref([]);
const showModal = ref(false);
const editItem = ref(null);

const toPage = (page) => {
    router.push({ name: page });
    window.scrollTo(0, 0);
};

const logout = async () => {
    const result = await Swal.fire({
        title: "Bạn có chắc chắn muốn đăng xuất không?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Đăng xuất",
        cancelButtonText: "Hủy",
        reverseButtons: true,
    });

    if (result.isConfirmed) {
        auth.logout(); // Xoá token, user trong store
        await Swal.fire({
            icon: "success",
            title: "Bạn đã đăng xuất thành công!",
            timer: 1500,
            showConfirmButton: false,
        });
        router.push("/DangNhap"); // Chuyển về trang đăng nhập
    }
};

function getMainImage(images) {
    const main = images.find((i) => i.anhChinh) || images[0] || {};
    return main.url || "";
}

function openEditModal(item) {
    editItem.value = { ...item }; // copy để chỉnh sửa riêng
    showModal.value = true;
}

function closeModal() {
    showModal.value = false;
    editItem.value = null;
}

function setStar(star) {
    if (editItem.value) {
        editItem.value.soSao = star;
    }
}

async function submitUpdate() {
    if (!editItem.value) return;

    const { maDanhGia, soSao, binhLuan } = editItem.value;

    if (!soSao || soSao < 1 || soSao > 5) {
        Swal.fire({
            icon: "warning",
            title: "Vui lòng chọn số sao hợp lệ (1-5).",
        });
        return;
    }

    try {
        await updateDanhGia({
            maDanhGia,
            soSao,
            binhLuan,
            maTaiKhoan: user.id,
        });

        Swal.fire({
            icon: "success",
            title: "Cập nhật đánh giá thành công!",
            timer: 1500,
            showConfirmButton: false,
        });

        await loadData();
        closeModal();
    } catch (error) {
        console.error("Lỗi cập nhật đánh giá:", error);
        Swal.fire({
            icon: "error",
            title: "Cập nhật thất bại, vui lòng thử lại.",
        });
    }
}

async function loadData() {
    try {
        const dgData = await fetchDanhGia();
        danhGiaList.value = dgData.filter(
            (dg) => dg.maHoaDon === maHoaDonNumber && dg.maTaiKhoan === user.id
        );
        console.log("This list đánh giá: ", danhGiaList.value);
    } catch (error) {
        console.error("Lỗi load dữ liệu:", error);
    }
}

onMounted(async () => {
    await loadData();
});
</script>

<template>
    <BreadCrumb />
    <div class="page-container">
        <div class="left-nav">
            <ul>
                <li @click="toPage('ThongTinCaNhan')">Thông tin tài khoản</li>
                <li @click="toPage('DanhSachYeuThich')">Món ăn yêu thích</li>
                <li class="active" @click="toPage('LichSuDatBan')">
                    Lịch sử đặt bàn
                </li>
                <li @click="toPage('ThongBao')">Thông báo</li>
                <li @click="logout">Đăng xuất</li>
            </ul>
        </div>

        <div class="right-content">
            <h2>ĐÁNH GIÁ</h2>
            <div
                v-for="item in danhGiaList"
                :key="item.maDanhGia"
                class="danh-gia-item"
            >
                <div class="header">
                    <img
                        :src="
                            item.anhTaiKhoan ||
                            '/assets/images/taikhoan/avatar.png'
                        "
                        alt="avatar"
                        class="avatar"
                    />
                    <div class="user-info">
                        <p class="username">
                            {{ item.tenTaiKhoan || "Người dùng" }}
                        </p>
                        <p class="datetime">
                            {{
                                new Date(item.thoiGianDanhGia).toLocaleString()
                            }}
                        </p>
                    </div>
                    <button class="btn-sua" @click="openEditModal(item)">
                        Sửa
                    </button>
                </div>

                <div class="rating">
                    <div class="stars">
                        <span
                            v-for="star in 5"
                            :key="star"
                            :class="[
                                'star',
                                star <= item.soSao ? 'selected' : '',
                            ]"
                            >★</span
                        >
                    </div>
                    <p class="comment">{{ item.binhLuan }}</p>
                </div>

                <div class="mon-an-box">
                    <img
                        :src="getMainImage(item.anhMonAn)"
                        alt="Ảnh món ăn"
                        class="anh-mon"
                    />
                    <p class="ten-mon">{{ item.tenMonAn }}</p>
                </div>
            </div>
        </div>
        <!-- Modal sửa đánh giá -->
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Sửa đánh giá</h3>
                    <button class="close-btn" @click="closeModal">✕</button>
                </div>
                <div class="modal-body" v-if="editItem">
                    <div class="mon-an-box">
                        <img
                            :src="getMainImage(editItem.anhMonAn)"
                            alt="Ảnh món ăn"
                            class="anh-mon"
                        />
                        <p class="ten-mon">{{ editItem.tenMonAn }}</p>
                    </div>

                    <div class="rating-edit">
                        <span>Chất lượng món ăn:</span>
                        <div class="stars">
                            <span
                                v-for="star in 5"
                                :key="star"
                                :class="[
                                    'star',
                                    star <= editItem.soSao ? 'selected' : '',
                                ]"
                                @click="setStar(star)"
                                >★</span
                            >
                        </div>
                    </div>

                    <textarea
                        v-model="editItem.binhLuan"
                        placeholder="Nhập bình luận..."
                        rows="4"
                        class="binh-luan-edit"
                    ></textarea>

                    <div class="modal-actions">
                        <BaseButton
                            btnTitle="Cập nhật"
                            variant="primary"
                            @click="submitUpdate"
                        ></BaseButton>
                        <BaseButton
                            btnTitle="Hủy"
                            variant="cancel-btn-color"
                            @click="closeModal"
                        ></BaseButton>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page-container {
    padding: 0px;
    width: 100%;
    background-image: url("/assets/images/cream-bg.png");
    background-size: cover;
    background-repeat: no-repeat;
    background-position: top top;
    margin-bottom: 10px;
    padding-bottom: 0;

    display: flex;
    justify-content: space-between;
}

.left-nav {
    width: 300px;
    background-color: var(--yellow-color);
}

.left-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.left-nav ul li {
    padding: 15px 30px;
    color: var(--cream-color);
    cursor: pointer;
    text-transform: uppercase;
    border-bottom: 1px solid var(--brown-color);
    transition: background-color 0.3s;
    font-size: 1.6rem;
    font-weight: 600;
}

.left-nav ul li:hover,
.left-nav ul li.active {
    background-color: #7e5525;
}

.right-content {
    flex: 1;
    padding: 50px 200px;
    width: 700px;
}

h2 {
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 30px;
    font-size: 3rem;
    color: var(--brown-color);
}

/* phần đánh giá */
.danh-gia-item {
    background: var(--white-color);
    border: 1px solid var(--light-gray-color);
    padding: 25px 50px;
    box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.05);
}

.header {
    display: flex;
    align-items: center;
    position: relative;
    margin-bottom: 15px;
}

.avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 15px;
    border: 2px solid var(--yellow-color);
}

.user-info {
    flex-grow: 1;
}

.username {
    font-weight: 700;
    font-size: 1.6rem;
}

.datetime {
    font-size: 1.2rem;
    color: var(--dark-gray-color);
    margin-top: 5px;
}

.btn-sua {
    position: absolute;
    right: 10px;
    top: 5px;
    background: transparent;
    border: none;
    color: var(--dark-gray-color);
    font-size: 1.2rem;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 4px;
    transition: background-color 0.2s;
}
.btn-sua:hover {
    background-color: var(--dark-gray-color);
    color: var(--white-color);
}

.rating {
    margin-bottom: 15px;
}

.stars {
    font-size: 1.6rem;
    color: var(--light-gray-color);
    margin-bottom: 10px;
}

.star {
    user-select: none;
    margin-right: 5px;
}

.star.selected {
    color: var(--light-yellow);
}

.comment {
    font-size: 1.4rem;
    line-height: 1.3;
    color: var(--black-color);
}

.mon-an-box {
    display: flex;
    align-items: center;
    background-color: var(--light-gray-color);
    padding: 0px 15px;
    gap: 25px;
}

.anh-mon {
    width: 60px;
    height: 60px;
    object-fit: cover;
}

.ten-mon {
    font-weight: 600;
    font-size: 1.2rem;
    color: var(--black-color);
}

/* phần modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(30, 30, 30, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.modal-content {
    background-color: var(--white-color);
    border-radius: 5px;
    width: 700px;
    max-width: 90vw;
    padding: 0px 0px 30px 0px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
    position: relative;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    background-color: var(--light-green-color);
    padding: 25px;
}

.close-btn {
    border: none;
    background: transparent;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--black-color);
    font-weight: 600;
    line-height: 1;
}

h3 {
    font-size: 2rem;
    color: var(--black-color);
    font-weight: 700;
    text-transform: uppercase;
    display: block;
    margin: 0 auto;
}

.close-btn:hover {
    color: var(--red-color);
    font-weight: 700;
}

.modal-body {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 30px;
}

.rating-edit {
    display: flex;
    align-items: baseline;
    gap: 10px;
    color: var(--black-color);
    font-size: 1.6rem;
}

.rating-edit .stars {
    font-size: 1.8rem;
}

.binh-luan-edit {
    width: 100%;
    resize: vertical;
    font-size: 1.6rem;
    padding: 8px;
    color: var(--black-color);
}

.modal-actions {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 10px;
}

@media (max-width: 1200px) {
    .right-content {
        padding: 40px 30px;
        width: 100%;
        max-width: 700px;
    }

    .danh-gia-item {
        padding: 20px 30px;
    }

    .modal-content {
        width: 90vw;
        padding: 0 10px 20px 10px;
    }
}

@media (max-width: 992px) {
    .page-container {
        flex-direction: column;
    }

    .left-nav {
        width: 100%;
        display: flex;
        overflow-x: auto;
    }

    .left-nav ul {
        display: flex;
        width: 100%;
        padding: 0;
        margin: 0;
    }

    .left-nav ul li {
        flex: 1 0 auto;
        text-align: center;
        white-space: nowrap;
    }

    .right-content {
        padding: 30px 20px;
    }

    .modal-content {
        width: 95vw;
    }
}

@media (max-width: 768px) {
    .right-content {
        padding: 20px 15px;
    }

    h2 {
        font-size: 2.4rem;
    }

    .danh-gia-item {
        padding: 15px 20px;
    }

    .header {
        flex-wrap: wrap;
    }

    .btn-sua {
        position: static;
        margin-top: 10px;
        align-self: flex-start;
    }

    .username {
        font-size: 1.4rem;
    }

    .datetime {
        font-size: 1rem;
    }

    .rating {
        margin-bottom: 10px;
    }

    .stars {
        font-size: 1.4rem;
    }

    .comment {
        font-size: 1.2rem;
    }

    .mon-an-box {
        padding: 0 10px;
    }

    .anh-mon {
        width: 50px;
        height: 50px;
    }

    .ten-mon {
        font-size: 1rem;
    }

    .modal-body {
        padding: 15px;
    }

    .rating-edit {
        font-size: 1.4rem;
    }

    .rating-edit .stars {
        font-size: 1.6rem;
    }

    .binh-luan-edit {
        font-size: 1.4rem;
        padding: 6px;
    }
}

@media (max-width: 576px) {
    .left-nav ul li {
        font-size: 1.2rem;
        padding: 12px 15px;
    }

    .right-content {
        padding: 15px 10px;
    }

    h2 {
        font-size: 2rem;
    }

    .btn-sua {
        font-size: 1rem;
        padding: 4px 8px;
    }
}
</style>
