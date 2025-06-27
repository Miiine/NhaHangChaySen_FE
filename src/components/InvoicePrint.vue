<script setup>
import { defineProps } from "vue";

// Nhận props từ cha (InvoiceDetail)
const props = defineProps({
    hoaDon: Object,
});

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
</script>
<template>
    <div id="invoice-content">
        <header>
            <h2>NHÀ HÀNG CHAY SEN</h2>
            <p>171 Nguyễn Thái Học, Quận 1, TP Hồ Chí Minh</p>
            <p>028 6278 2186</p>
        </header>

        <h1>HÓA ĐƠN THANH TOÁN</h1>
        <section>
            <h3>Thông tin hóa đơn</h3>
            <div class="info-grid">
                <div><b>Mã hóa đơn:</b> {{ hoaDon.maHoaDon }}</div>
                <div><b>Tên khách hàng:</b> {{ hoaDon.hoTen }}</div>
                <div>
                    <b>Thời gian khách vào:</b>
                    {{ formatDateTime(hoaDon.thoiGianNhanBan) }}
                </div>
                <div>
                    <b>Thời gian khách ra:</b>
                    {{ formatDateTime(hoaDon.thoiGianHoanThanh) }}
                </div>
                <div><b>Số lượng khách:</b> {{ hoaDon.soLuongKhach }}</div>
                <div><b>Khu vực:</b> {{ hoaDon.tenKhuVuc }}</div>
                <div><b>Bàn:</b> {{ hoaDon.maBan }}</div>
                <div>
                    <b>Thành tiền:</b> {{ formatCurrency(hoaDon.thanhTien) }}
                </div>
                <div>
                    <b>Phương thức thanh toán:</b>
                    {{ hoaDon.phuongThucTT }}
                </div>
                <div>
                    <b>Trạng thái đơn đặt bàn:</b>
                    {{ hoaDon.trangThai }}
                </div>
            </div>
        </section>

        <section>
            <h3>Chi tiết hóa đơn</h3>
            <table>
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Tên món</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th>Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(item, index) in hoaDon.chiTietHoaDon"
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
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" class="text-right">
                            <b>Tổng cộng:</b>
                        </td>
                        <td>{{ formatCurrency(hoaDon.tongTienMonAn) }}</td>
                    </tr>
                    <tr>
                        <td colspan="4" class="text-right">
                            <b>Phụ phí khu vực:</b>
                        </td>
                        <td>{{ formatCurrency(hoaDon.phuPhiKV) }}</td>
                    </tr>
                    <tr>
                        <td colspan="4" class="text-right">
                            <b>Khuyến mãi:</b>
                        </td>
                        <td>{{ formatCurrency(hoaDon.tienGiam) }}</td>
                    </tr>
                    <tr>
                        <td colspan="4" class="text-right"><b>Thuế VAT:</b></td>
                        <td>{{ formatCurrency(hoaDon.thue) }}</td>
                    </tr>
                    <tr>
                        <td colspan="4" class="text-right total">
                            <b>Thành tiền:</b>
                        </td>
                        <td>{{ formatCurrency(hoaDon.thanhTien) }}</td>
                    </tr>
                </tfoot>
            </table>
        </section>
        <footer>
            <p>Cảm ơn quý khách - Hẹn gặp lại!</p>
        </footer>
    </div>
</template>

<style scoped>
#invoice-content {
    margin: 30px;
    padding: 50px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-family: "Inter", sans-serif;
}

header {
    text-align: center;
    margin-bottom: 30px;
}

header h2 {
    font-size: 24px;
    font-weight: bold;
}

header p {
    margin: 5px 0;
    font-size: 14px;
}

h1 {
    text-align: center;
    font-size: 30px;
    margin-bottom: 15px;
    font-weight: bold;
}

section h3 {
    font-size: 16px;
    font-weight: bold;
    margin: 30px 0 20px 0;
    text-transform: uppercase;
}

.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Chia thành 2 cột có độ rộng bằng nhau */
    gap: 20px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
}

table th,
table td {
    border: 1px solid #ccc;
    padding: 8px 15px;
    text-align: center;
    font-size: 14px;
}

table th {
    background-color: #f5f5f5;
    font-weight: bold;
}

table td {
    font-size: 14px;
}

table td:last-child {
    text-align: right;
}

table td:nth-child(2) {
    text-align: left;
}

table tfoot td {
    border: none;
    font-size: 14px;
    padding: 8px 12px;
    text-align: right;
    white-space: nowrap;
}

table tfoot td:first-child {
    text-align: right;
    padding-right: 15px;
}

table tfoot td:last-child {
    text-align: right;
    padding-left: 15px;
}

/**/

footer {
    text-align: center;
    font-size: 14px;
    margin-top: 100px;
    font-style: italic;
}

footer p {
    margin: 5px 0;
    font-weight: bold;
    font-size: 16px;
}
</style>
