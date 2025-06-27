<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Swal from "sweetalert2";
import BreadCrumb from "@/components/BreadCrumb.vue";
import BaseButton from "@/components/BaseButton.vue";
import { fetchHoaDon } from "@/services/hoadon";
import { addDanhGia } from "@/services/danhgia";
import { fetchTaiKhoan } from "@/services/taikhoan";
import { createThongBao } from "@/services/thongbao";

const { user } = useAuthStore();
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const maHoaDonStr = route.params.maHoaDon;
const maHoaDonNumber = Number(maHoaDonStr);
const danhSachMonAn = ref([]);
const danhSachTaiKhoan = ref([]);

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

function setStar(indexMonAn, star) {
    danhSachMonAn.value[indexMonAn].soSao = star;
}

async function submitDanhGia() {
    if (!danhSachMonAn.value.length) {
        Swal.fire({
            icon: "warning",
            title: "Chưa có món ăn để đánh giá!",
        });
        return;
    }

    try {
        for (const mon of danhSachMonAn.value) {
            if (!mon.soSao || mon.soSao < 1 || mon.soSao > 5) {
                Swal.fire({
                    icon: "warning",
                    title: `Vui lòng chọn số sao hợp lệ cho món: ${mon.tenMon}`,
                });
                return;
            }

            await addDanhGia({
                maTaiKhoan: user.id,
                maHoaDon: maHoaDonNumber,
                maMonAn: mon.maMonAn,
                soSao: mon.soSao,
                binhLuan: mon.binhLuan || "",
            });
        }

        // Tạo thông báo cho admin
        const adminEmail = "nhahangchaysen171@gmail.com";
        const maNguoiNhan = getMaTaiKhoanByEmail(adminEmail);
        if (maNguoiNhan) {
            const tieuDe = `Khách hàng ${user.username} đã gửi đánh giá cho đơn hàng #${maHoaDonNumber}`;
            const noiDung = `
        Người dùng ${user.username} (ID: ${user.id}) đã gửi đánh giá cho đơn đặt bàn #${maHoaDonNumber}.
        Vui lòng kiểm tra và phản hồi kịp thời.
      `;
            await createThongBao({
                maNguoiGui: user.id,
                maNguoiNhan,
                tieuDe,
                noiDung,
                loaiThongBao: "Xem đánh giá",
            });
        }

        await Swal.fire({
            icon: "success",
            title: "Gửi đánh giá thành công!",
            text: "Cảm ơn bạn đã đánh giá món ăn.",
            timer: 2000,
            showConfirmButton: false,
        });

        // Chuyển hướng sang trang ListDanhGiaFromLichSu
        router.push({
            name: "ListDanhGiaFromLichSu",
            params: { maHoaDon: maHoaDonNumber },
        });
    } catch (error) {
        console.error("Lỗi gửi đánh giá:", error);
        Swal.fire({
            icon: "error",
            title: "Lỗi gửi đánh giá",
            text: "Vui lòng thử lại sau.",
        });
    }
}

function getMaTaiKhoanByEmail(email) {
    return (
        danhSachTaiKhoan.value.find((tk) => tk.email === email)?.maTaiKhoan ||
        null
    );
}

async function loadData() {
    try {
        const hdData = await fetchHoaDon();
        const tkData = await fetchTaiKhoan();

        danhSachTaiKhoan.value = tkData;

        const thisHoaDon = hdData.find((hd) => hd.maHoaDon === maHoaDonNumber);
        if (!thisHoaDon) {
            danhSachMonAn.value = [];
            console.error("Không tìm thấy hóa đơn với mã:", maHoaDonNumber);
            return;
        }
        danhSachMonAn.value = thisHoaDon.chiTietHoaDon.map((mon) => ({
            maMonAn: mon.maMonAn,
            tenMonAn: mon.tenMonAn,
            anhMonAn: mon.anhMonAn || [],
            soSao: 5,
            binhLuan: "",
        }));
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
                v-for="(mon, idx) in danhSachMonAn"
                :key="mon.tenMonAn"
                class="mon-an-item"
            >
                <div class="header">
                    <img
                        :src="getMainImage(mon.anhMonAn)"
                        alt="Ảnh món ăn"
                        class="anh-mon"
                    />
                    <p class="ten-mon">{{ mon.tenMonAn }}</p>
                </div>

                <div class="chat-luong">
                    <span>Chất lượng món ăn:</span>
                    <div class="stars">
                        <span
                            v-for="star in 5"
                            :key="star"
                            :class="[
                                'star',
                                star <= mon.soSao ? 'selected' : '',
                            ]"
                            @click="setStar(idx, star)"
                            >★</span
                        >
                    </div>
                </div>

                <textarea
                    v-model="mon.binhLuan"
                    placeholder="Thêm bình luận"
                    class="binh-luan"
                ></textarea>
            </div>

            <BaseButton
                @click="submitDanhGia"
                class="btn-submit"
                btnTitle="Gửi đánh giá"
                variant="primary"
            >
            </BaseButton>
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
    width: 500px;
}

h2 {
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 30px;
    font-size: 3rem;
    color: var(--brown-color);
}

/* phần đánh giá */
.mon-an-item {
    border: 1px solid var(--light-gray-color);
    background-color: var(--white-color);
    padding: 25px;
}

.header {
    display: flex;
    align-items: center;
    background-color: var(--light-gray-color);
    padding: 0px 15px;
    gap: 25px;
    margin-bottom: 15px;
}

.anh-mon {
    width: 60px;
    height: 60px;
    object-fit: cover;
}

.ten-mon {
    font-weight: 700;
    font-size: 1.6rem;
    color: var(--black-color);
}

.chat-luong {
    display: flex;
    align-items: baseline;
    gap: 15px;
    font-weight: 600;
    font-size: 1.2rem;
    margin-bottom: 10px;
}

.stars {
    font-size: 1.8rem;
    color: var(--light-gray-color);
    cursor: pointer;
}

.star {
    user-select: none;
    margin-right: 8px;
    transition: color 0.3s;
}

.star.selected {
    color: var(--light-yellow);
}

.binh-luan {
    width: 100%;
    min-height: 90px;
    border: 1px solid var(--light-gray-color);
    border-radius: 5px;
    padding: 10px;
    font-size: 1.4rem;
    font-family: inherit;
    resize: vertical;
}

.btn-submit {
    display: block;
    margin: 0 auto;
    margin-top: 30px;
}

@media (max-width: 1200px) {
    .right-content {
        padding: 40px 50px;
        width: auto;
    }

    .mon-an-item {
        padding: 20px;
    }

    .header {
        gap: 15px;
    }

    .anh-mon {
        width: 50px;
        height: 50px;
    }

    .ten-mon {
        font-size: 1.4rem;
    }

    .chat-luong {
        font-size: 1.1rem;
    }

    .stars {
        font-size: 1.5rem;
    }

    .binh-luan {
        font-size: 1.2rem;
    }
}

@media (max-width: 768px) {
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
        padding: 0;
        margin: 0;
    }

    .left-nav ul li {
        flex: 1 0 auto;
        text-align: center;
        white-space: nowrap;
        padding: 12px 10px;
        font-size: 1.4rem;
    }

    .right-content {
        padding: 30px 20px;
        width: 100%;
    }
}

@media (max-width: 480px) {
    h2 {
        font-size: 2.4rem;
    }

    .mon-an-item {
        padding: 15px;
    }

    .header {
        flex-direction: column;
        align-items: flex-start;
    }

    .anh-mon {
        width: 40px;
        height: 40px;
    }

    .ten-mon {
        font-size: 1.2rem;
    }

    .chat-luong {
        font-size: 1rem;
    }

    .stars {
        font-size: 1.3rem;
    }

    .binh-luan {
        font-size: 1rem;
    }

    .btn-submit {
        width: 100%;
        font-size: 1.4rem;
    }
}
</style>
