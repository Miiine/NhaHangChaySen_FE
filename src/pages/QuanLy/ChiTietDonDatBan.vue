<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import InvoicePrint from "@/components/InvoicePrint.vue";

import { fetchHoaDon } from "@/services/hoadon";

const route = useRoute();
const router = useRouter();

const maHoaDonNumber = Number(route.params.maHoaDon);
const thisHoaDon = ref([]);
const chiTietHoaDon = ref([]);

const goBack = () => {
    router.back();
    window.scrollTo(0, 0);
};

// Hàm in hóa đơn
const printInvoice = () => {
    const printContent = document.getElementById("invoice-content");
    const printWindow = window.open("", "", "width=1000, height=1000");
    // Thêm phần tiêu đề và CSS vào cửa sổ in
    printWindow.document.write("<html><head><title>In Hóa Đơn</title>");

    // Lấy tất cả CSS từ các thẻ <style> trong trang hiện tại
    const styles = document.querySelectorAll("style, link[rel='stylesheet']");

    // Thêm tất cả các CSS vào cửa sổ in
    styles.forEach((style) => {
        if (style.tagName.toLowerCase() === "style") {
            printWindow.document.write(
                "<style>" + style.innerHTML + "</style>"
            );
        } else if (style.tagName.toLowerCase() === "link") {
            printWindow.document.write(
                '<link rel="stylesheet" href="' + style.href + '" />'
            );
        }
    });

    printWindow.document.write("</head><body>");
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write("</body></html>");

    printWindow.document.close();
    printWindow.print();
};

const formatDateTime = (datetimeStr) => {
    if (!datetimeStr) return "-";
    const d = new Date(datetimeStr);
    return d.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatCurrency = (value) => {
    if (value == null) return "0đ";
    return Number(value).toLocaleString("vi-VN") + "đ";
};

const loadData = async () => {
    try {
        const dsHoaDon = await fetchHoaDon();
        const hd = dsHoaDon.find((h) => Number(h.maHoaDon) === maHoaDonNumber);
        if (hd) {
            thisHoaDon.value = hd;
            chiTietHoaDon.value = hd.chiTietHoaDon || [];
        } else {
            alert("Không tìm thấy hóa đơn");
            router.back();
        }
    } catch (error) {
        console.error(error);
    }
};

onMounted(() => {
    loadData();
});
</script>

<template>
    <div class="page-container">
        <h3 class="title">Lịch sử đặt bàn</h3>
        <hr />
        <div class="top-bar">
            <button class="btn-back" @click="goBack()">
                <i class="fas fa-chevron-left"></i>
                <span>Quay lại trang trước</span>
            </button>

            <div class="page-title">Thông tin đơn đặt bàn</div>
        </div>

        <section class="info-section">
            <h4>Thông tin đơn hàng</h4>
            <div class="info-grid">
                <div><b>Mã hóa đơn:</b> {{ thisHoaDon.maHoaDon || "-" }}</div>
                <div>
                    <b>Nhân viên duyệt:</b>
                    {{ thisHoaDon.nhanVienDuyet || "Nhân viên trực 1" }}
                </div>
                <div>
                    <b>Thời gian sử dụng:</b>
                    {{ formatDateTime(thisHoaDon.thoiGianSuDung) }}
                </div>
                <div>
                    <b>Thời gian khách vào:</b>
                    {{ formatDateTime(thisHoaDon.thoiGianNhanBan) }}
                </div>
                <div>
                    <b>Thời gian khách ra:</b>
                    {{ formatDateTime(thisHoaDon.thoiGianHoanThanh) }}
                </div>
                <div>
                    <b>Số lượng khách:</b>
                    {{ thisHoaDon.soLuongKhach || "-" }}
                </div>
                <div>
                    <b>Tổng tiền:</b>
                    {{ formatCurrency(thisHoaDon.thanhTien) }}
                </div>
                <div>
                    <b>Đã thanh toán:</b>
                    {{ formatCurrency(thisHoaDon.daThanhToan) }}
                </div>
                <div>
                    <b>Trạng thái thanh toán:</b>
                    {{ thisHoaDon.trangThaiTT || "-" }}
                </div>
                <div>
                    <b>Phương thức thanh toán:</b>
                    {{ thisHoaDon.phuongThucTT || "-" }}
                </div>
                <div>
                    <b>Thời gian thanh toán:</b>
                    {{ formatDateTime(thisHoaDon.thoiGianThanhToan) }}
                </div>
                <div>
                    <b>Trạng thái đơn hàng:</b>
                    {{ thisHoaDon.trangThai || "-" }}
                </div>
            </div>
        </section>

        <section class="info-section">
            <h4>Thông tin khách hàng</h4>
            <div class="info-grid">
                <div><b>Họ và tên:</b> {{ thisHoaDon.hoTen || "-" }}</div>
                <div><b>Số điện thoại:</b> {{ thisHoaDon.sdt || "-" }}</div>
                <div><b>Email:</b> {{ thisHoaDon.email || "-" }}</div>
            </div>
        </section>

        <section class="info-section">
            <h4>Bàn và khu vực</h4>
            <div class="info-grid">
                <div><b>Khu vực:</b> {{ thisHoaDon.tenKhuVuc || "-" }}</div>
                <div><b>Bàn:</b> {{ thisHoaDon.maBan || "-" }}</div>
                <div>
                    <b>Loại bàn:</b>
                    Bàn {{ thisHoaDon.tenLoai || "-" }} - tối đa
                    {{ thisHoaDon.soLuongKhachToiDa }}
                    người
                </div>
            </div>
        </section>

        <section class="info-section">
            <h4>Khuyến mãi</h4>
            <div class="info-grid">
                <div>
                    <b>Khuyến mãi:</b> {{ thisHoaDon.tenKhuyenMai || "-" }}
                </div>
                <div><b>Phần trăm:</b> {{ thisHoaDon.phanTram || "-" }}</div>
                <div>
                    <b>Điều kiện áp dụng: Hóa đơn trên </b>
                    {{ formatCurrency(thisHoaDon.dieuKienApDung) || "-" }}
                </div>
            </div>
        </section>

        <section class="info-section">
            <h4>Chi tiết hóa đơn</h4>
            <div class="table-summary-container">
                <table class="table-detail">
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
                            v-for="(item, index) in chiTietHoaDon"
                            :key="item.maMonAn"
                        >
                            <td>{{ index + 1 }}</td>
                            <td>{{ item.tenMonAn }}</td>
                            <td>{{ formatCurrency(item.donGia) }}</td>
                            <td>{{ item.soLuong }}</td>
                            <td>
                                {{ formatCurrency(item.donGia * item.soLuong) }}
                            </td>
                        </tr>
                        <tr v-if="chiTietHoaDon.length === 0">
                            <td colspan="5" class="no-data">Không có món ăn</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4" class="text-right">Tổng cộng:</td>
                            <td>
                                {{ formatCurrency(thisHoaDon.tongTienMonAn) }}
                            </td>
                        </tr>
                        <tr>
                            <td colspan="4" class="text-right">
                                Phụ phí khu vực:
                            </td>
                            <td>{{ formatCurrency(thisHoaDon.phuPhiKV) }}</td>
                        </tr>
                        <tr>
                            <td colspan="4" class="text-right">Khuyến mãi:</td>
                            <td>{{ formatCurrency(thisHoaDon.tienGiam) }}</td>
                        </tr>
                        <tr>
                            <td colspan="4" class="text-right">Thuế VAT:</td>
                            <td>{{ formatCurrency(thisHoaDon.thue) }}</td>
                        </tr>
                        <tr>
                            <td colspan="4" class="text-right total">
                                Thành tiền:
                            </td>
                            <td>{{ formatCurrency(thisHoaDon.thanhTien) }}</td>
                        </tr>
                        <tr>
                            <td colspan="4" class="text-right">
                                Đã thanh toán:
                            </td>
                            <td>
                                {{ formatCurrency(thisHoaDon.daThanhToan) }}
                            </td>
                        </tr>
                        <tr>
                            <td colspan="4" class="text-right">Còn lại:</td>
                            <td>
                                {{
                                    formatCurrency(
                                        thisHoaDon.thanhTien -
                                            thisHoaDon.daThanhToan
                                    )
                                }}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </section>

        <button
            class="btn-print"
            v-if="thisHoaDon.trangThai === 'da_hoan_thanh'"
            @click="printInvoice"
        >
            IN HÓA ĐƠN
        </button>
        <InvoicePrint :hoaDon="thisHoaDon" />
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

/* thông tin hóa đơn */
.info-section {
    background: var(--white-color);
    box-shadow: 1px 2px 8px rgb(0 0 0 / 0.2);
    color: var(--black-color);
    border: 1px solid var(--light-gray-color);
    padding: 30px 80px;
}

.info-section h4 {
    margin-bottom: 20px;
    font-weight: 700;
    border-bottom: 1px solid #ddd;
    padding-bottom: 6px;
    color: var(--blue-color);
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px 50px;
    font-size: 1.6rem;
}

.table-summary-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
}

.table-detail {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.3rem;
}

.table-detail th,
.table-detail td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}
.table-detail td:nth-child(2) {
    text-align: left;
}

.table-detail thead {
    background-color: var(--light-green-color);
    font-weight: 600;
}

.no-data {
    text-align: center;
    padding: 10px 0;
    font-style: italic;
    color: var(--dark-gray-color);
}

.table-detail tfoot td {
    border: none;
    font-weight: 600;
    font-size: 1.4rem;
    padding: 8px 12px;
    text-align: right;
    white-space: nowrap;
}

.table-detail tfoot td:first-child {
    text-align: right;
    padding-right: 15px;
}

.table-detail tfoot td:last-child {
    text-align: right;
    padding-left: 15px;
}

.table-detail tfoot tr.total td {
    font-weight: 700;
    font-size: 1.5rem;
    border-top: 2px solid var(--dark-gray-color);
    padding-top: 6px;
}

.table-summary-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
}

/* Điều chỉnh bảng */
.table-detail {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.3rem;
}

.btn-print {
    margin: 30px auto;
    background-color: var(--dark-blue-color);
    color: var(--black-color);
    border: none;
    padding: 10px 20px;
    font-weight: 700;
    cursor: pointer;
    border-radius: 6px;
    font-size: 1.3rem;
    user-select: none;
    transition: background-color 0.25s ease;
    display: block;
}

.btn-print:hover {
    background-color: #92d9da;
}

#invoice-content {
    display: none;
}
</style>
