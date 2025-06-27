<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import slugify from "slugify";
import Swal from "sweetalert2";
import { format } from "date-fns";
import BreadCrumb from "@/components/BreadCrumb.vue";
import BaseButton from "@/components/BaseButton.vue";

import { fetchHoaDon, updatePayment, createVNPayUrl } from "@/services/hoadon";
import { fetchTaiKhoan } from "@/services/taikhoan";
import { createThongBao } from "@/services/thongbao";

const props = defineProps({
    maHoaDon: String,
});
const router = useRouter();
const auth = useAuthStore();
const maHoaDonNumber = ref(Number(props.maHoaDon));
const danhSachHoaDon = ref([]);
const thisHoaDon = ref([]);
const danhSachTaiKhoan = ref([]);

const paymentType = ref("toan_bo");
const paymentMethod = ref("VNPay");
const transactionCode = ref("");

const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return format(d, "dd/MM/yyyy HH:mm");
};

function getMainImage(images = []) {
    if (!Array.isArray(images)) return "";
    const main = images.find((i) => i.anhChinh) || images[0] || {};
    return main.url || "";
}

async function submitForm() {
    console.log(typeof maHoaDonNumber.value, maHoaDonNumber.value);

    if (paymentMethod.value === "bank" && !transactionCode.value) {
        Swal.fire({
            icon: "warning",
            title: "Thiếu mã giao dịch",
            text: "Bạn phải nhập mã tham chiếu/giao dịch chuyển khoản ngân hàng.",
        });
        return;
    }

    if (paymentMethod.value === "VNPay") {
        try {
            let amount = 0;
            if (paymentType.value === "toan_bo") {
                amount = thisHoaDon.value.thanhTien;
            } else if (paymentType.value === "coc") {
                amount = Math.round(thisHoaDon.value.thanhTien * 0.25);
            }

            const url = await createVNPayUrl(
                props.maHoaDon,
                amount,
                paymentType.value
            );

            if (url) {
                window.location.href = url;
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Lỗi VNPay",
                    text: "Không nhận được URL thanh toán.",
                });
            }
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Lỗi tạo liên kết thanh toán",
                text: err.message || "Vui lòng thử lại sau.",
            });
        }
        return;
    }

    try {
        if (!thisHoaDon.value || isNaN(thisHoaDon.value.thanhTien)) {
            Swal.fire({
                icon: "error",
                title: "Dữ liệu hóa đơn không hợp lệ",
                text: "Không thể xác định thành tiền cần thanh toán.",
            });
            return;
        }

        // Gọi API cập nhật trạng thái thanh toán
        await updatePayment(props.maHoaDon, {
            trangThaiTT: paymentType.value, // toan_bo hoặc coc
            phuongThucTT: paymentMethod.value, // vnpay hoặc bank
            maGiaoDichNH:
                paymentMethod.value === "bank" ? transactionCode.value : null,
        });

        const updatedHoaDon = (await fetchHoaDon()).find(
            (hd) => hd.maHoaDon === maHoaDonNumber.value
        );

        // --- Cập nhật lại hóa đơn mới nhất từ server ---
        if (!updatedHoaDon) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không tìm thấy hóa đơn sau khi cập nhật.",
            });
            return;
        }

        thisHoaDon.value = updatedHoaDon;

        // Lấy mã người nhận admin
        const emailAdmin = "nhahangchaysen171@gmail.com";
        const maNguoiNhan = getMaTaiKhoanByEmail(emailAdmin);
        const maNguoiGui = auth.user?.id;

        if (!maNguoiNhan) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không tìm thấy tài khoản admin.",
            });
            return;
        }

        const formatCurrency = (value) => {
            if (!value && value !== 0) return "";
            const num = Number(value);
            if (isNaN(num)) return "";
            return num.toLocaleString("vi-VN") + " đ";
        };

        // Tạo nội dung thông báo chi tiết
        const tieuDe = "Vui lòng duyệt đơn hàng!";
        const noiDung = `
            Người dùng: ${auth.user?.username}
            Mã hóa đơn: ${props.maHoaDon}
            Phương thức thanh toán: ${
                paymentMethod.value === "VNPay"
                    ? "VNPay"
                    : "Chuyển khoản ngân hàng"
            }
            Trạng thái thanh toán: ${
                paymentType.value === "toan_bo"
                    ? "Thanh toán toàn bộ"
                    : "Thanh toán cọc (25%)"
            }
            Tổng đơn đặt bàn: ${formatCurrency(thisHoaDon.value.thanhTien)}
            Đã thanh toán: ${formatCurrency(thisHoaDon.value.daThanhToan)}
        `;

        // Gửi thông báo lên server (API)
        await createThongBao({
            maNguoiGui: maNguoiGui,
            maNguoiNhan: maNguoiNhan,
            tieuDe,
            noiDung,
            loaiThongBao: "Duyệt đơn",
        });

        Swal.fire({
            icon: "success",
            title: "Thanh toán thành công",
            confirmButtonText: "OK",
        }).then(() => {
            router.push("/LichSuDatBan");
        });
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Lỗi cập nhật thanh toán",
            text: error.message || "Vui lòng thử lại sau.",
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

        danhSachHoaDon.value = hdData;
        danhSachTaiKhoan.value = tkData;

        thisHoaDon.value = danhSachHoaDon.value.find(
            (hd) => hd.maHoaDon === maHoaDonNumber.value
        );

        if (!thisHoaDon.value) {
            console.warn(
                "Không tìm thấy hóa đơn với mã: ",
                maHoaDonNumber.value
            );
        }
    } catch (err) {
        console.error("Lỗi loadData:", err);
    }
}

onMounted(async () => {
    console.log("Mã hóa đơn: ", maHoaDonNumber.value);
    //Fetch all
    await loadData();
    console.log("Danh sách hóa đơn: ", danhSachHoaDon.value);

    console.log("thisHoaDon value after load:", thisHoaDon.value);
    console.log("ThanhTien:", thisHoaDon.value?.thanhTien);
    console.log(
        "Kiểu dữ liệu của thanhTien:",
        typeof thisHoaDon.value?.thanhTien
    );
    console.log("maHoaDon:", props.maHoaDon);
    console.log("Amount:", thisHoaDon.value.thanhTien);
    console.log("type:", paymentType.value);
});
</script>

<template>
    <BreadCrumb />
    <div class="page-container">
        <h1>Thanh toán trước cho đơn đặt bàn</h1>
        <div class="booking-payment-wrapper" v-if="thisHoaDon">
            <div class="invoice-details">
                <div class="info-box">
                    <div class="box-header">
                        <h2>Thông tin đặt bàn</h2>
                    </div>
                    <div class="box-body">
                        <ul>
                            <li>
                                <span>Họ tên:</span>
                                <span>{{ thisHoaDon.hoTen }}</span>
                            </li>
                            <li>
                                <span>SĐT:</span>
                                <span>{{ thisHoaDon.sdt }}</span>
                            </li>
                            <li>
                                <span>Email:</span>
                                <span>{{ thisHoaDon.email || "–" }}</span>
                            </li>
                            <li>
                                <span>Số khách:</span>
                                <span>{{ thisHoaDon.soLuongKhach }}</span>
                            </li>
                            <li>
                                <span>Thời gian sử dụng (dự kiến):</span>
                                <span>
                                    {{
                                        formatDate(thisHoaDon.thoiGianSuDung)
                                    }}</span
                                >
                            </li>
                            <li>
                                <span>Khu vực bàn ăn:</span>
                                <span>{{ thisHoaDon.tenKhuVuc }}</span>
                            </li>
                            <li>
                                <span>Bàn:</span>
                                <span
                                    >{{ thisHoaDon.tenBan }} - SL ghế:
                                    {{ thisHoaDon.soLuongKhachToiDa }}</span
                                >
                            </li>
                            <li>
                                <span>Khuyến mãi:</span>
                                <span>{{
                                    thisHoaDon.tenKhuyenMai || "–"
                                }}</span>
                            </li>
                            <li>
                                <span>Ghi chú:</span>
                                <span>{{ thisHoaDon.note || "–" }}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Bảng thực đơn đặt trước -->
                <div class="preorder-box">
                    <div class="box-header">
                        <h2>Thực đơn đặt trước</h2>
                    </div>
                    <div class="box-body">
                        <table class="invoice-table">
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Ảnh</th>
                                    <th>Món ăn</th>
                                    <th>Đơn giá</th>
                                    <th>Số lượng</th>
                                    <th>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="(
                                        item, i
                                    ) in thisHoaDon.chiTietHoaDon"
                                    :key="item.maMonAn"
                                >
                                    <td>{{ i + 1 }}</td>
                                    <td>
                                        <img
                                            :src="getMainImage(item.anhMonAn)"
                                            alt="Ảnh món ăn"
                                            class="dish-image"
                                        />
                                    </td>
                                    <td>{{ item.tenMonAn }}</td>
                                    <td>
                                        {{
                                            parseInt(
                                                item.donGia
                                            ).toLocaleString("vi-VN")
                                        }}đ
                                    </td>
                                    <td>{{ item.soLuong }}</td>
                                    <td>
                                        {{
                                            (
                                                Number(item.soLuong) *
                                                Number(item.donGia)
                                            ).toLocaleString("vi-VN")
                                        }}đ
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="5" class="text-right">
                                        <strong>Tổng cộng:</strong>
                                    </td>
                                    <td>
                                        <strong
                                            >{{
                                                parseInt(
                                                    thisHoaDon.tongTienMonAn
                                                ).toLocaleString("vi-VN")
                                            }}đ</strong
                                        >
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            <div class="payment-box">
                <div class="box-header"><h2>Thanh toán</h2></div>
                <div class="box-body">
                    <ul class="summary-list">
                        <li>
                            <span>Tổng cộng:</span>
                            <span
                                >{{
                                    parseInt(
                                        thisHoaDon.tongTienMonAn
                                    ).toLocaleString("vi-VN")
                                }}đ</span
                            >
                        </li>
                        <li>
                            <span>Phụ phí KV:</span>
                            <span
                                >{{
                                    parseInt(
                                        thisHoaDon.phuPhiKV
                                    ).toLocaleString("vi-VN")
                                }}đ</span
                            >
                        </li>
                        <li>
                            <span>Giảm giá:</span>
                            <span
                                >{{
                                    parseInt(
                                        thisHoaDon.tienGiam
                                    ).toLocaleString("vi-VN")
                                }}đ</span
                            >
                        </li>
                        <li>
                            <span>Thuế VAT (8%):</span>
                            <span
                                >{{
                                    parseInt(thisHoaDon.thue).toLocaleString(
                                        "vi-VN"
                                    )
                                }}đ</span
                            >
                        </li>
                        <li class="total-final">
                            <span>Thành tiền:</span>
                            <span
                                >{{
                                    parseInt(
                                        thisHoaDon.thanhTien
                                    ).toLocaleString("vi-VN")
                                }}đ</span
                            >
                        </li>
                    </ul>

                    <form @submit.prevent="submitForm">
                        <fieldset>
                            <legend>Loại hình thanh toán</legend>
                            <label
                                ><input
                                    type="radio"
                                    v-model="paymentType"
                                    value="toan_bo"
                                />
                                Thanh toán toàn bộ</label
                            >
                            <label
                                ><input
                                    type="radio"
                                    v-model="paymentType"
                                    value="coc"
                                />
                                Thanh toán cọc (25%):
                                {{
                                    parseInt(
                                        (thisHoaDon.thanhTien * 25) / 100
                                    ).toLocaleString("vi-VN")
                                }}đ</label
                            >
                        </fieldset>

                        <fieldset>
                            <legend>Phương thức thanh toán</legend>
                            <label
                                ><input
                                    type="radio"
                                    v-model="paymentMethod"
                                    value="VNPay"
                                />
                                Thanh toán qua VNPAY</label
                            >
                            <label
                                ><input
                                    type="radio"
                                    v-model="paymentMethod"
                                    value="bank"
                                />
                                Chuyển khoản ngân hàng</label
                            >
                        </fieldset>

                        <fieldset v-if="paymentMethod === 'bank'">
                            <legend>Thông tin chuyển khoản</legend>
                            <p>Chủ tài khoản: Nguyễn Thị Ngọc Nga</p>
                            <p>Số tài khoản: 62410000224375</p>
                            <p>Ngân hàng: BIDV</p>
                            <input
                                type="text"
                                class="code"
                                placeholder="Nhập mã tham chiếu/giao dịch (*)"
                                required
                                v-model="transactionCode"
                            />
                        </fieldset>

                        <BaseButton
                            type="submit"
                            btnTitle="THANH TOÁN"
                            variant="primary"
                            class="btn-pay"
                        >
                        </BaseButton>
                    </form>
                </div>
            </div>
        </div>
        <div v-else>
            <p>Không tìm thấy thông tin hóa đơn hoặc đang tải dữ liệu...</p>
        </div>
    </div>
</template>

<style scoped>
.page-container {
    padding: 50px 200px;
    width: 100%;
    background-image: url("/assets/images/cream-bg.png");
    background-size: cover;
    background-repeat: no-repeat;
    background-position: top top;
    margin-bottom: 10px;
}

h1 {
    text-transform: uppercase;
    font-size: 3rem;
    text-align: center;
    color: var(--brown-color);
    margin-bottom: 30px;
}

.booking-payment-wrapper {
    display: flex;
    gap: 30px;
    align-items: flex-start;
    flex-wrap: wrap;
}

.info-box,
.preorder-box {
    background: var(--white-color);
    margin-bottom: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.box-header {
    padding: 10px 0;
    background-color: var(--light-green-color);
    text-align: center;
}

.box-header h2 {
    font-size: 1.8rem;
    color: var(--black-color);
}

.box-body {
    padding: 20px;
}

.info-box .box-body {
    padding: 20px 100px 20px 100px;
}

/* Cột trái */
.invoice-details {
    flex: 2;
    min-width: 600px;
}

.info-box ul li {
    margin-bottom: 10px;
    font-size: 1.6rem;
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.info-box ul li span:first-child {
    flex: 1;
    font-weight: 600;
    text-align: left;
}

.info-box ul li span:last-child {
    flex: 1;
    text-align: left;
    font-weight: 400;
}

.invoice-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.4rem;
}

.dish-image {
    width: 50px;
    height: 50px;
    object-fit: cover;
}

.dish-image:hover {
    transform: scale(1.05);
    cursor: pointer;
}
.invoice-table th,
.invoice-table td {
    border: 1px solid var(--light-gray-color);
    padding: 8px;
    text-align: center;
}
.invoice-table th {
    background: var(--white-color);
}
.invoice-table tfoot td {
    font-weight: bold;
}

.invoice-table td:nth-child(3) {
    text-align: left;
}

/* Cột phải */
.payment-box {
    flex: 1;
    background: var(--white-color);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.summary-list {
    list-style: none;
    padding: 0 10px;
    margin-bottom: 20px;
    font-size: 1.6rem;
}
.summary-list li {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--light-gray-color);
}
.summary-list .total-final {
    font-size: 1.8rem;
    color: var(--red-color);
    font-weight: bold;
}
.payment-box form fieldset {
    border: 1px solid var(--light-gray-color);
    padding: 12px;
    margin-bottom: 16px;
    border-radius: 4px;
}
.payment-box form legend {
    padding: 0 8px;
    font-weight: bold;
}
.payment-box form label {
    display: block;
    margin-bottom: 8px;
    font-size: 1.6rem;
}

.payment-box form p {
    display: block;
    margin-bottom: 8px;
    font-size: 1.6rem;
}

.payment-box form .code {
    display: block;
    margin-bottom: 8px;
    font-size: 1.6rem;
    padding: 5px;
    width: 100%;
}
.btn-pay {
    width: 100%;
}

/* ----- Responsive CSS ----- */

/* Tablet Landscape (768px to 1024px) */
@media (max-width: 1024px) {
    .page-container {
        padding: 50px 30px;
    }

    h1 {
        font-size: 2.5rem;
    }

    .invoice-details,
    .payment-box {
        min-width: 0;
        flex: 1 1 100%;
    }

    .info-box .box-body {
        padding: 20px;
    }

    .invoice-table th,
    .invoice-table td {
        font-size: 1.2rem;
    }
    .dish-image {
        width: 40px;
        height: 40px;
    }

    .invoice-table td:nth-child(3) {
        text-align: left;
    }

    .summary-list li {
        font-size: 1.4rem;
    }
}

/* Tablet Portrait (600px to 768px) */
@media (max-width: 768px) {
    .page-container {
        padding: 40px 15px;
    }

    h1 {
        font-size: 2rem;
    }

    .invoice-details,
    .payment-box {
        flex: 1 1 100%;
    }

    .info-box .box-body {
        padding: 20px;
    }

    .invoice-table th,
    .invoice-table td {
        font-size: 1.2rem;
    }
    .dish-image {
        width: 35px;
        height: 35px;
    }

    .summary-list li {
        font-size: 1.4rem;
    }

    .payment-box form label {
        font-size: 1.4rem;
    }

    .payment-box form p {
        font-size: 1.4rem;
    }

    .payment-box form .code {
        font-size: 1.4rem;
    }
}

/* Mobile (up to 600px) */
@media (max-width: 600px) {
    .page-container {
        padding: 30px 10px;
    }

    h1 {
        font-size: 1.5rem;
    }

    .booking-payment-wrapper {
        flex-direction: column;
        gap: 20px;
    }

    .invoice-details,
    .payment-box {
        flex: 1 1 100%;
    }

    .invoice-table th,
    .invoice-table td {
        font-size: 1rem;
    }
    .dish-image {
        width: 30px;
        height: 30px;
    }

    .summary-list li {
        font-size: 1.2rem;
    }

    .payment-box form label {
        font-size: 1.2rem;
    }

    .payment-box form p {
        font-size: 1.2rem;
    }

    .payment-box form .code {
        font-size: 1.2rem;
    }
}

/* Extra Small Mobile (up to 480px) */
@media (max-width: 480px) {
    .page-container {
        padding: 20px 5px;
    }

    h1 {
        font-size: 1.2rem;
    }

    .invoice-details,
    .payment-box {
        flex: 1 1 100%;
    }

    .invoice-table th,
    .invoice-table td {
        font-size: 0.9rem;
    }
    .dish-image {
        width: 25px;
        height: 25px;
    }

    .summary-list li {
        font-size: 1rem;
    }

    .payment-box form label {
        font-size: 1rem;
    }

    .payment-box form p {
        font-size: 1rem;
    }

    .payment-box form .code {
        font-size: 1rem;
    }

    .btn-pay {
        font-size: 1rem;
        padding: 12px;
    }
}
</style>
