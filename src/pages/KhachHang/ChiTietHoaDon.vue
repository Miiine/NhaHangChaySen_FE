<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Swal from "sweetalert2";
import BaseButton from "@/components/BaseButton.vue";
import BreadCrumb from "@/components/BreadCrumb.vue";
import { fetchHoaDon, updateHoaDonStatus } from "@/services/hoadon";
import { fetchTaiKhoan } from "@/services/taikhoan";
import { createThongBao } from "@/services/thongbao";

const { user } = useAuthStore();
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const danhSachTaiKhoan = ref([]);

const maHoaDonStr = route.params.maHoaDon;
const maHoaDonNumber = Number(maHoaDonStr);

const hoaDonChiTiet = ref(null);

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

const thanhToan = () => {
    router.push({
        name: "ThanhToanFromLichSu",
        params: { maHoaDon: maHoaDonNumber },
    });
};

const danhGia = () => {
    if (!hoaDonChiTiet.value) return;

    if (hoaDonChiTiet.value.trangThaiDG === "da_danh_gia") {
        router.push({
            name: "ListDanhGiaFromLichSu",
            params: { maHoaDon: maHoaDonNumber },
        });
    } else if (hoaDonChiTiet.value.trangThaiDG === "chua_danh_gia") {
        router.push({
            name: "DanhGiaFromLichSu",
            params: { maHoaDon: maHoaDonNumber },
        });
    } else {
        Swal.fire({
            icon: "info",
            title: "Thông báo",
            text: "Trạng thái đánh giá không xác định.",
        });
    }
};

function tinhSoTienCanHoan(
    trangThaiTruocKhiHuy,
    trangThaiTT,
    daThanhToan,
    thanhTien
) {
    let soTienCanHoan = 0;

    if (trangThaiTruocKhiHuy === "cho_duyet") {
        soTienCanHoan = daThanhToan;
    } else if (trangThaiTruocKhiHuy === "da_duyet") {
        if (trangThaiTT === "coc") {
            soTienCanHoan = 0;
        } else if (trangThaiTT === "toan_bo") {
            soTienCanHoan = daThanhToan * 0.75;
        }
    }

    return soTienCanHoan;
}

const huyDon = async () => {
    if (!hoaDonChiTiet.value) return;

    const trangThaiTruocKhiHuy = hoaDonChiTiet.value.trangThai;
    const trangThaiTT = hoaDonChiTiet.value.trangThaiTT;
    const daThanhToan = hoaDonChiTiet.value.daThanhToan;
    const thanhTien = hoaDonChiTiet.value.thanhTien;

    const soTienCanHoan = tinhSoTienCanHoan(
        trangThaiTruocKhiHuy,
        trangThaiTT,
        daThanhToan,
        thanhTien
    );

    let messageHtml = "";

    if (trangThaiTruocKhiHuy === "cho_duyet") {
        messageHtml = `
    <p>Nếu bạn hủy đơn, bạn sẽ được hoàn số tiền đã thanh toán trong vòng 24 giờ.</p>
    <p>Bạn có chắc chắn muốn hủy đơn?</p>
  `;
    } else if (trangThaiTruocKhiHuy === "da_duyet") {
        messageHtml = `
    <p>Nếu bạn hủy đơn, bạn sẽ bị mất tiền cọc (25%) đã thanh toán.</p>
  `;

        if (hoaDonChiTiet.value.trangThaiTT === "toan_bo") {
            messageHtml += `
      <p>Bạn sẽ được hoàn 75% số tiền đã thanh toán trong vòng 24 giờ.</p>
    `;
        }

        messageHtml += `
    <p>Bạn có chắc chắn muốn hủy đơn?</p>
  `;
    }

    const result = await Swal.fire({
        title: "Xác nhận hủy đơn",
        html: messageHtml,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Đồng ý",
        cancelButtonText: "Hủy",
        reverseButtons: true,
    });

    if (result.isConfirmed) {
        try {
            await updateHoaDonStatus(hoaDonChiTiet.value.maHoaDon, "da_huy");

            hoaDonChiTiet.value.trangThai = "da_huy";

            // Tạo thông báo gửi admin
            const adminEmail = "nhahangchaysen171@gmail.com";
            const maNguoiNhan = getMaTaiKhoanByEmail(adminEmail);
            if (maNguoiNhan) {
                const tieuDe = `Đơn hàng đã bị hủy! Vui lòng hoàn tiền cho khách hàng ${user.username}`;

                const formatCurrency = (value) => {
                    if (!value && value !== 0) return "";
                    const num = Number(value);
                    if (isNaN(num)) return "";
                    return num.toLocaleString("vi-VN") + " đ";
                };

                const noiDung = `
                    Người dùng ${user.username} (ID: ${
                    user.id
                }) đã hủy đơn đặt bàn #${hoaDonChiTiet.value.maHoaDon}.
                    Trạng thái đơn hàng trước khi hủy: ${trangThaiTruocKhiHuy}.
                    Trạng thái thanh toán: ${
                        hoaDonChiTiet.value.trangThaiTT || "Chưa thanh toán"
                    }.
                    Phương thức thanh toán: ${
                        hoaDonChiTiet.value.phuongThucTT || "Chưa xác định"
                    }.
                    Tổng hóa đơn: ${formatCurrency(thanhTien)}.
                    Đã thanh toán: ${formatCurrency(daThanhToan)}.
                    Số tiền cần hoàn: ${formatCurrency(soTienCanHoan)}.
                `;
                await createThongBao({
                    maNguoiGui: user.id,
                    maNguoiNhan,
                    tieuDe,
                    noiDung,
                    loaiThongBao: "Hoàn tiền",
                });
            }

            Swal.fire(
                "Đã hủy đơn!",
                "Đơn hàng của bạn đã được hủy.",
                "success"
            );
        } catch (error) {
            Swal.fire("Lỗi", "Không thể hủy đơn. Vui lòng thử lại.", "error");
        }
    }
};

const formatDate = (datetimeStr) => {
    if (!datetimeStr) return "";
    const date = new Date(datetimeStr);
    return date.toLocaleDateString("vi-VN");
};

const formatTime = (datetimeStr) => {
    if (!datetimeStr) return "";
    const date = new Date(datetimeStr);
    return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatCurrency = (value) =>
    Number(value).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
    });

const getStatusLabel = (hd) => {
    if (hd.trangThai === "da_huy") return "Đã hủy";
    if (hd.trangThai == "da_hoan_thanh") return "Đã hoàn thành";
    if (hd.trangThaiTT === "chua_thanh_toan") return "Chưa thanh toán";
    if (hd.trangThai === "cho_duyet") return "Chờ duyệt";
    if (hd.trangThai === "da_duyet") return "Đã duyệt";
    if (!hd.trangThai || hd.trangThai === "") return "Chưa thanh toán";
    return "Khác";
};
const getTTLabel = (hd) => {
    if (hd.trangThaiTT === "coc") return "Đã cọc";
    if (hd.trangThaiTT == "toan_bo") return "Đã thanh toán";
    if (hd.trangThaiTT == "chua_thanh_toan") return "Chưa thanh toán";
    return "Khác";
};

function getMaTaiKhoanByEmail(email) {
    return (
        danhSachTaiKhoan.value.find((tk) => tk.email === email)?.maTaiKhoan ||
        null
    );
}

async function loadData(maHoaDonNumber) {
    try {
        const hdData = await fetchHoaDon();
        const tkData = await fetchTaiKhoan();
        danhSachTaiKhoan.value = tkData;

        const foundHoaDon = hdData.find((hd) => hd.maHoaDon === maHoaDonNumber);

        if (foundHoaDon) {
            hoaDonChiTiet.value = foundHoaDon;
            console.log("Hóa đơn chi tiết: ", hoaDonChiTiet.value);
        } else {
            console.error("Không tìm thấy hóa đơn với mã:", maHoaDonNumber);
            hoaDonChiTiet.value = null;
        }
    } catch (err) {
        console.error("Lỗi loadData:", err);
        hoaDonChiTiet.value = null;
    }
}

onMounted(async () => {
    await loadData(maHoaDonNumber);
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
            <h2>Chi tiết đơn đặt bàn</h2>

            <div v-if="hoaDonChiTiet">
                <div class="chi-tiet-don">
                    <div class="thong-tin-chung">
                        <div class="left-col">
                            <div>
                                <strong>Trạng thái đơn: </strong>
                                <span class="status">{{
                                    getStatusLabel(hoaDonChiTiet)
                                }}</span>
                            </div>
                            <div>
                                <strong>Tên khách hàng:</strong>
                                {{ hoaDonChiTiet.hoTen }}
                            </div>
                            <div>
                                <strong>Số lượng khách:</strong>
                                {{ hoaDonChiTiet.soLuongKhach }}
                            </div>
                            <div>
                                <strong>Phương thức thanh toán:</strong>
                                {{ hoaDonChiTiet.phuongThucTT }}
                            </div>
                            <div>
                                <strong>Tình trạng thanh toán:</strong>
                                {{ getTTLabel(hoaDonChiTiet) }}
                            </div>
                        </div>

                        <div class="right-col">
                            <div>
                                <strong>Số HD:</strong>
                                {{ hoaDonChiTiet.maHoaDon }}
                            </div>
                            <div>
                                <strong>Nhân viên duyệt đơn:</strong>
                                {{ hoaDonChiTiet.nhanVienDuyet || "NULL" }}
                            </div>
                            <div>
                                <strong>Khu vực:</strong>
                                {{ hoaDonChiTiet.tenKhuVuc }}
                            </div>
                            <div>
                                <strong>Bàn:</strong>
                                {{ hoaDonChiTiet.maBan || "" }}
                            </div>
                            <div>
                                <strong>Thời gian sử dụng:</strong>
                                {{ formatDate(hoaDonChiTiet.thoiGianSuDung) }}
                                ({{ formatTime(hoaDonChiTiet.thoiGianSuDung) }})
                            </div>
                        </div>
                    </div>

                    <table class="chi-tiet-table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Món ăn</th>
                                <th>Đơn giá</th>
                                <th>Số lượng</th>
                                <th>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="(
                                    item, index
                                ) in hoaDonChiTiet.chiTietHoaDon"
                                :key="item.maMonAn"
                            >
                                <td>{{ index + 1 }}</td>
                                <td>{{ item.tenMonAn }}</td>
                                <td>{{ formatCurrency(item.donGia) }}</td>
                                <td>{{ item.soLuong }}</td>
                                <td>
                                    {{
                                        formatCurrency(
                                            item.donGia * item.soLuong
                                        )
                                    }}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="4" class="text-right">
                                    Tổng cộng:
                                </td>
                                <td>
                                    {{
                                        formatCurrency(
                                            hoaDonChiTiet.tongTienMonAn
                                        )
                                    }}
                                </td>
                            </tr>
                            <tr>
                                <td colspan="4" class="text-right">
                                    Phụ phí khu vực:
                                </td>
                                <td>
                                    {{ formatCurrency(hoaDonChiTiet.phuPhiKV) }}
                                </td>
                            </tr>
                            <tr>
                                <td colspan="4" class="text-right">
                                    Khuyến mãi:
                                </td>
                                <td>
                                    {{ formatCurrency(hoaDonChiTiet.tienGiam) }}
                                </td>
                            </tr>
                            <tr>
                                <td colspan="4" class="text-right">
                                    Thuế VAT:
                                </td>
                                <td>
                                    {{ formatCurrency(hoaDonChiTiet.thue) }}
                                </td>
                            </tr>
                            <tr>
                                <td colspan="4" class="text-right">
                                    Thành tiền:
                                </td>
                                <td>
                                    {{
                                        formatCurrency(hoaDonChiTiet.thanhTien)
                                    }}
                                </td>
                            </tr>
                            <tr>
                                <td colspan="4" class="text-right">
                                    Đã thanh toán:
                                </td>
                                <td>
                                    {{
                                        formatCurrency(
                                            hoaDonChiTiet.daThanhToan
                                        )
                                    }}
                                </td>
                            </tr>
                            <tr>
                                <td colspan="4" class="text-right">Còn lại:</td>
                                <td>
                                    {{
                                        formatCurrency(
                                            hoaDonChiTiet.thanhTien -
                                                hoaDonChiTiet.daThanhToan
                                        )
                                    }}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <!-- Nút hành động -->
                <div
                    v-if="
                        hoaDonChiTiet.trangThaiTT === 'chua_thanh_toan' ||
                        !hoaDonChiTiet.trangThai ||
                        hoaDonChiTiet.trangThai === ''
                    "
                    class="group-btn"
                >
                    <BaseButton
                        @click="thanhToan"
                        btnTitle="THANH TOÁN"
                        variant="payment-btn-color"
                    >
                    </BaseButton>
                    <BaseButton
                        @click="huyDon"
                        btnTitle="HỦY ĐƠN"
                        variant="delete-btn-color"
                    >
                    </BaseButton>
                </div>
                <div
                    v-else-if="hoaDonChiTiet.trangThai === 'da_hoan_thanh'"
                    class="group-btn"
                >
                    <BaseButton
                        @click="danhGia"
                        btnTitle="ĐÁNH GIÁ"
                        variant="primary"
                    >
                    </BaseButton>
                </div>
                <div
                    v-else-if="hoaDonChiTiet.trangThai === 'cho_duyet'"
                    class="group-btn"
                >
                    <BaseButton
                        @click="huyDon"
                        btnTitle="HỦY ĐƠN"
                        variant="delete-btn-color"
                    >
                    </BaseButton>
                </div>
                <div
                    v-else-if="hoaDonChiTiet.trangThai === 'da_duyet'"
                    class="group-btn"
                >
                    <BaseButton
                        @click="huyDon"
                        btnTitle="HỦY ĐƠN"
                        variant="delete-btn-color"
                    >
                    </BaseButton>
                </div>
            </div>

            <div v-else>
                <p>Đang tải dữ liệu hoặc không tìm thấy hóa đơn.</p>
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
}

h2 {
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 30px;
    font-size: 3rem;
    color: var(--brown-color);
}

/* Phần chi tiết đơn */
.chi-tiet-don {
    background: var(--white-color);
    padding: 50px;
    border-radius: 10px;
    box-shadow: 0 3px 10px rgb(0 0 0 / 0.1);
    margin-top: 20px;
}

.thong-tin-chung {
    display: flex;
    justify-content: space-between;
    font-size: 1.6rem;
    margin-bottom: 20px;
    gap: 150px;
}

.left-col,
.right-col {
    flex: 1;
}

.left-col > div,
.right-col > div {
    margin-bottom: 15px;
}

.status {
    font-weight: 700;
    color: var(--red-color);
}

.chi-tiet-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
}

.chi-tiet-table th,
.chi-tiet-table td {
    border: 1px solid var(--light-gray-color);
    padding: 8px 12px;
    font-size: 1.4rem;
    text-align: center;
}

.chi-tiet-table th:nth-child(2),
.chi-tiet-table td:nth-child(2) {
    text-align: left;
}

.chi-tiet-table thead th {
    background-color: var(--light-green-color);
    font-weight: 600;
}

.chi-tiet-table tfoot td {
    border: none;
    font-weight: 600;
    font-size: 1.4rem;
    padding: 8px 12px;
}

.chi-tiet-table tfoot td:first-child {
    text-align: right;
    padding-right: 15px;
}

.chi-tiet-table tfoot td:last-child {
    text-align: right;
    padding-left: 15px;
    white-space: nowrap;
}

.text-right {
    text-align: right;
}

.group-btn {
    display: flex;
    justify-content: center;
    gap: 30px;
    margin-top: 30px;
}

@media (max-width: 1200px) {
    .right-content {
        padding: 40px 50px;
    }

    .chi-tiet-don {
        padding: 30px;
    }

    .thong-tin-chung {
        gap: 50px;
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
        padding: 12px 10px;
        font-size: 1.4rem;
    }

    .right-content {
        padding: 30px 20px;
    }

    .thong-tin-chung {
        flex-direction: column;
        gap: 20px;
    }

    .left-col,
    .right-col {
        width: 100%;
    }
}

@media (max-width: 768px) {
    h2 {
        font-size: 2.4rem;
    }

    .chi-tiet-don {
        padding: 20px;
    }

    .thong-tin-chung > div {
        margin-bottom: 10px;
    }

    .chi-tiet-table th,
    .chi-tiet-table td {
        font-size: 1.2rem;
        padding: 6px 8px;
    }

    .chi-tiet-table tfoot td {
        font-size: 1.2rem;
        padding: 6px 8px;
    }

    .group-btn {
        flex-direction: column;
        gap: 15px;
    }
}

@media (max-width: 480px) {
    .right-content {
        padding: 15px 10px;
    }

    .chi-tiet-table {
        font-size: 1rem;
    }

    .chi-tiet-table th,
    .chi-tiet-table td {
        padding: 5px 6px;
    }

    .status {
        font-size: 1.2rem;
    }

    .group-btn {
        gap: 10px;
    }
}
</style>
