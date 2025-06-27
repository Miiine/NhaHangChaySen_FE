<script setup>
import { ref, computed, onMounted } from "vue";
import moment from "moment";
import "moment/locale/vi";
moment.locale("vi");
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    ArcElement,
} from "chart.js";
import { Line, Pie } from "vue-chartjs";

import { fetchMonAn } from "@/services/monan";

import {
    fetchSoLuongHoaDonDaHoanThanh,
    fetchTongDoanhThuDaHoanThanh,
    fetchSoLuongKhachHangVaiTro1,
    fetchDoanhThuVaLoiNhuan,
} from "@/services/thongke";

ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    ArcElement
);

const danhSachMonAn = ref([]);

// Tạo danh sách năm và tháng động
const months = ref([]); // Lấy danh sách các tháng từ moment.js
const years = ref([]);
const selectedYear = ref(moment().year()); // Mặc định là năm hiện tại
const selectedMonth = ref(moment().month()); // Mặc định là tháng hiện tại

const thongKeData = ref({
    donDatBan: 0,
    doanhThu: 0,
    khachHang: 0,
    donDatBanChange: 0,
    doanhThuChange: 0,
    khachHangChange: 0,
});

const chartLabels = ref([]); // nhãn cho trục X
const doanhThuData = ref([]); // dữ liệu doanh thu
const loiNhuanData = ref([]); // dữ liệu lợi nhuận

const currentPage = ref(1);
const itemsPerPage = 8;
const totalPages = computed(() =>
    Math.ceil(danhSachMonAn.value.length / itemsPerPage)
);

const paginatedMonAn = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredMonAn.value.slice(start, end);
});

// Cập nhật computed property để hiển thị tiêu đề "Tháng - Năm"
const filterTitle = computed(() => {
    if (selectedMonth.value === "") {
        // Nếu không chọn tháng, chỉ hiển thị năm
        return `Năm ${selectedYear.value}`;
    } else {
        // Nếu có chọn tháng, hiển thị "Tháng [tháng] - Năm [năm]"
        return `Tháng ${selectedMonth.value + 1} - Năm ${selectedYear.value}`;
    }
});

const loadMonAn = async () => {
    try {
        const res = await fetchMonAn();
        danhSachMonAn.value = res.sort((a, b) => b.soLuongBan - a.soLuongBan);
    } catch (err) {
        console.error("Lỗi tải danh sách món ăn:", err);
    }
};

const searchQuery = ref("");

// Lọc món ăn theo từ khóa tìm kiếm
const filteredMonAn = computed(() => {
    if (!searchQuery.value) return danhSachMonAn.value;
    return danhSachMonAn.value.filter((item) =>
        item.tenMonAn.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

// Dữ liệu biểu đồ Pie top món bán chạy
const pieData = computed(() => {
    // Lấy 10 món ăn bán chạy nhất
    const top10MonAn = danhSachMonAn.value.slice(0, 10);

    // Tạo dữ liệu cho biểu đồ Pie
    const labels = top10MonAn.map((item) => item.tenMonAn);
    const data = top10MonAn.map((item) => item.soLuongBan);

    return {
        labels: labels,
        datasets: [
            {
                label: "Top 10 Món ăn bán chạy",
                backgroundColor: [
                    "#27AE60", // Màu xanh lá đậm
                    "#C0392B", // Màu đỏ đậm
                    "#D83367", // Màu hồng đỏ
                    "#6A4C93", // Màu tím mận
                    "#396AB7", // Màu xanh dương đậm
                    "#FAD02E", // Màu vàng nhạt
                    "#FFB4A2", // Màu hồng nhạt
                    "#D9BF77", // Màu vàng nâu nhẹ
                    "#FF7F50", // Màu cam san hô
                    "#76D7C4", // Màu xanh mint
                ],
                data: data,
            },
        ],
    };
});

const pieOptions = {
    responsive: true,
    plugins: {
        legend: {
            position: "bottom",
            labels: {
                boxWidth: 15, // Điều chỉnh chiều rộng của hộp màu
                padding: 10, // Điều chỉnh khoảng cách giữa hộp màu và văn bản
            },
        },
    },
};

function formatNumber(num) {
    return num.toLocaleString("vi-VN");
}

function formatMoney(num) {
    return formatNumber(num) + "đ";
}

// Cập nhật dữ liệu khi chọn năm hoặc tháng
const updateData = async () => {
    try {
        let soLuongHoaDon, tongDoanhThu, soLuongKhachHang;

        // Kiểm tra nếu tháng được chọn, nếu không thì chỉ truyền năm
        if (selectedMonth.value === "") {
            console.log("Đang gọi API với năm:", selectedYear.value);
            // Lấy dữ liệu cho cả năm
            soLuongHoaDon = await fetchSoLuongHoaDonDaHoanThanh(
                selectedYear.value
            );
            tongDoanhThu = await fetchTongDoanhThuDaHoanThanh(
                selectedYear.value
            );
            soLuongKhachHang = await fetchSoLuongKhachHangVaiTro1(
                selectedYear.value
            );

            // Tính phần trăm thay đổi so với năm trước
            const previousYear = selectedYear.value - 1;
            const prevSoLuongHoaDon = await fetchSoLuongHoaDonDaHoanThanh(
                previousYear
            );
            const prevTongDoanhThu = await fetchTongDoanhThuDaHoanThanh(
                previousYear
            );
            const prevSoLuongKhachHang = await fetchSoLuongKhachHangVaiTro1(
                previousYear
            );

            // Cập nhật các chỉ số thay đổi so với năm trước
            thongKeData.value.donDatBanChange = calculatePercentageChange(
                Number(soLuongHoaDon.soLuongHoaDon),
                Number(prevSoLuongHoaDon.soLuongHoaDon)
            );
            thongKeData.value.doanhThuChange = calculatePercentageChange(
                Number(tongDoanhThu.tongDoanhThu),
                Number(prevTongDoanhThu.tongDoanhThu)
            );
            thongKeData.value.khachHangChange = calculatePercentageChange(
                Number(soLuongKhachHang.soLuongKhachHang),
                Number(prevSoLuongKhachHang.soLuongKhachHang)
            );

            // Hiển thị "so với năm trước"
            thongKeData.value.changeText = `so với năm trước`;

            // Lấy dữ liệu doanh thu và lợi nhuận cho cả năm
            const response = await fetchDoanhThuVaLoiNhuan(selectedYear.value);

            console.log("Fetched full response:", response);

            const { labels, doanhThuDataFromAPI, loiNhuanDataFromAPI } =
                response;

            chartLabels.value = labels || [];
            doanhThuData.value = Array.isArray(doanhThuDataFromAPI)
                ? doanhThuDataFromAPI.map((item) => Number(item))
                : [];
            loiNhuanData.value = Array.isArray(loiNhuanDataFromAPI)
                ? loiNhuanDataFromAPI.map((item) => Number(item))
                : [];

            console.log("Labels:", chartLabels.value);
            console.log("Doanh Thu Data:", doanhThuData.value);
            console.log("Lợi Nhuận Data:", loiNhuanData.value);
        } else {
            console.log(
                "Đang gọi API với năm:",
                selectedYear.value,
                "tháng:",
                selectedMonth.value + 1
            );
            // Lấy dữ liệu cho tháng hiện tại và tháng trước
            soLuongHoaDon = await fetchSoLuongHoaDonDaHoanThanh(
                selectedYear.value,
                selectedMonth.value + 1
            );
            tongDoanhThu = await fetchTongDoanhThuDaHoanThanh(
                selectedYear.value,
                selectedMonth.value + 1
            );
            soLuongKhachHang = await fetchSoLuongKhachHangVaiTro1(
                selectedYear.value,
                selectedMonth.value + 1
            );

            const previousMonth =
                selectedMonth.value === 0 ? 11 : selectedMonth.value - 1;
            const prevSoLuongHoaDon = await fetchSoLuongHoaDonDaHoanThanh(
                selectedYear.value,
                previousMonth + 1
            );
            const prevTongDoanhThu = await fetchTongDoanhThuDaHoanThanh(
                selectedYear.value,
                previousMonth + 1
            );
            const prevSoLuongKhachHang = await fetchSoLuongKhachHangVaiTro1(
                selectedYear.value,
                previousMonth + 1
            );

            // Cập nhật các chỉ số thay đổi so với tháng trước
            thongKeData.value.donDatBanChange = calculatePercentageChange(
                Number(soLuongHoaDon.soLuongHoaDon),
                Number(prevSoLuongHoaDon.soLuongHoaDon)
            ).toFixed(2);
            thongKeData.value.doanhThuChange = calculatePercentageChange(
                Number(tongDoanhThu.tongDoanhThu),
                Number(prevTongDoanhThu.tongDoanhThu)
            ).toFixed(2);
            thongKeData.value.khachHangChange = calculatePercentageChange(
                Number(soLuongKhachHang.soLuongKhachHang),
                Number(prevSoLuongKhachHang.soLuongKhachHang)
            ).toFixed(2);

            // Hiển thị "so với tháng trước"
            thongKeData.value.changeText = `so với tháng trước`;

            // Lấy dữ liệu doanh thu và lợi nhuận cho tháng
            const response = await fetchDoanhThuVaLoiNhuan(
                selectedYear.value,
                selectedMonth.value + 1
            );

            console.log("Fetched full response:", response);

            const { labels, doanhThuDataFromAPI, loiNhuanDataFromAPI } =
                response;

            console.log("Fetched full response:", response);
            console.log(
                "Doanh Thu Data from API:",
                response.doanhThuDataFromAPI
            );
            console.log(
                "Loi Nhuan Data from API:",
                response.loiNhuanDataFromAPI
            );

            chartLabels.value = labels || [];
            doanhThuData.value = Array.isArray(doanhThuDataFromAPI)
                ? doanhThuDataFromAPI.map((item) => Number(item))
                : [];
            loiNhuanData.value = Array.isArray(loiNhuanDataFromAPI)
                ? loiNhuanDataFromAPI.map((item) => Number(item))
                : [];

            console.log("Labels:", chartLabels.value);
            console.log("Doanh Thu Data:", doanhThuData.value);
            console.log("Lợi Nhuận Data:", loiNhuanData.value);
        }

        // // Kiểm tra dữ liệu trả về từ API
        console.log("Chart Labels fn:", chartLabels.value);
        console.log("Doanh Thu Data fn:", doanhThuData.value);
        console.log("Lợi Nhuận Data:", loiNhuanData.value);

        // Cập nhật dữ liệu thống kê cho năm hoặc tháng
        thongKeData.value.donDatBan = soLuongHoaDon.soLuongHoaDon;
        thongKeData.value.doanhThu = tongDoanhThu.tongDoanhThu;
        thongKeData.value.khachHang = soLuongKhachHang.soLuongKhachHang;
    } catch (error) {
        console.error("Lỗi khi gọi API để cập nhật dữ liệu thống kê: ", error);
    }
};

// Hàm tính phần trăm thay đổi
const calculatePercentageChange = (newValue, oldValue) => {
    if (oldValue === 0) {
        return newValue === 0 ? 0 : 100;
    } // Tránh chia cho 0
    return ((newValue - oldValue) / oldValue) * 100;
};

onMounted(async () => {
    await loadMonAn();

    moment.locale("vi");

    // Tạo danh sách các tháng bằng tiếng Việt
    const vietnameseMonths = Array.from(
        { length: 12 },
        (_, index) => `Tháng ${index + 1}`
    );

    // Gán lại danh sách các tháng đã chỉnh sửa cho dropdown
    months.value = vietnameseMonths;

    const currentYear = moment().year();
    years.value = Array.from(
        { length: currentYear - 2019 },
        (_, i) => currentYear - i
    ); // Danh sách từ 2020 đến hiện tại

    // Gọi API để lấy dữ liệu cho năm và tháng hiện tại
    await updateData();

    console.log(moment.locale());
    console.log(months);
});
</script>

<template>
    <div class="page-container">
        <h3 class="title">Thống kê</h3>
        <hr />

        <!-- Bộ lọc tháng và năm -->
        <div class="filter-container">
            <div class="filter-btns">
                <label for="year-select">Chọn năm:</label>
                <select
                    id="year-select"
                    v-model="selectedYear"
                    @change="updateData"
                >
                    <option v-for="year in years" :key="year" :value="year">
                        {{ year }}
                    </option>
                </select>
            </div>

            <div class="filter-btns">
                <label for="month-select">Chọn tháng:</label>
                <select
                    id="month-select"
                    v-model="selectedMonth"
                    @change="updateData"
                >
                    <option value="">Tất cả</option>
                    <option
                        v-for="(month, index) in months"
                        :key="index"
                        :value="index"
                    >
                        {{ month }}
                    </option>
                </select>
            </div>
        </div>

        <div class="cards-container">
            <div class="card">
                <div class="card-icon">🍽️</div>
                <div class="card-info">
                    <div class="card-label">Đơn đặt bàn</div>
                    <div class="card-value">
                        {{ formatNumber(thongKeData.donDatBan) }}
                    </div>
                    <div
                        class="card-change"
                        :style="{
                            color:
                                thongKeData.donDatBanChange > 0
                                    ? 'green'
                                    : thongKeData.donDatBanChange < 0
                                    ? 'red'
                                    : '#3a71c3',
                        }"
                    >
                        {{ thongKeData.donDatBanChange >= 0 ? "Tăng" : "Giảm" }}
                        {{ Math.abs(thongKeData.donDatBanChange) }}%
                        {{ thongKeData.changeText }}
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-icon">💰</div>
                <div class="card-info">
                    <div class="card-label">Doanh thu</div>
                    <div class="card-value">
                        {{ formatMoney(Number(thongKeData.doanhThu)) }}
                    </div>
                    <div
                        class="card-change"
                        :style="{
                            color:
                                thongKeData.doanhThuChange > 0
                                    ? 'green'
                                    : thongKeData.doanhThuChange < 0
                                    ? 'red'
                                    : '#3a71c3',
                        }"
                    >
                        {{ thongKeData.doanhThuChange >= 0 ? "Tăng" : "Giảm" }}
                        {{ Math.abs(thongKeData.doanhThuChange) }}%
                        {{ thongKeData.changeText }}
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-icon">👥</div>
                <div class="card-info">
                    <div class="card-label">Khách hàng</div>
                    <div class="card-value">
                        {{ formatNumber(thongKeData.khachHang) }}
                    </div>
                    <div
                        class="card-change"
                        :style="{
                            color:
                                thongKeData.khachHangChange > 0
                                    ? 'green'
                                    : thongKeData.khachHangChange < 0
                                    ? 'red'
                                    : '#3a71c3',
                        }"
                    >
                        {{ thongKeData.khachHangChange >= 0 ? "Tăng" : "Giảm" }}
                        {{ Math.abs(thongKeData.khachHangChange) }}%
                        {{ thongKeData.changeText }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Biểu đồ line doanh thu và lợi nhuận -->
        <div class="line-chart-container">
            <h4 class="filter-title">{{ filterTitle }}</h4>
            <Line
                :data="{
                    labels: chartLabels,
                    datasets: [
                        {
                            label: 'Doanh thu',
                            data: doanhThuData,
                            // borderColor: '#7fc5b8',
                            // backgroundColor: '#7fc5b8',
                            borderColor: '#3a71c3',
                            backgroundColor: '#3a71c3',
                            fill: true,
                            tension: 0.2,
                            pointRadius: 2,
                        },
                        // {
                        //     label: 'Lợi nhuận',
                        //     data: loiNhuanData,
                        //     borderColor: '#3a71c3',
                        //     backgroundColor: '#3a71c3',
                        //     fill: true,
                        //     tension: 0.2,
                        //     pointRadius: 2,
                        // },
                    ],
                }"
                :options="{
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { boxWidth: 10, padding: 20 },
                        },
                        title: { display: false },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return value.toLocaleString('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND',
                                        minimumFractionDigits: 0,
                                    });
                                },
                            },
                            grid: { drawBorder: false },
                        },
                        x: { grid: { drawBorder: false } },
                    },
                }"
                style="width: 100%; height: 100%"
            />
        </div>

        <div class="bottom-section">
            <!-- Bảng số lượng bán món ăn -->
            <div class="table-container">
                <h5>Số lượng bán của các Món ăn</h5>
                <input
                    v-model="searchQuery"
                    placeholder="Tìm kiếm"
                    type="text"
                    class="search-input"
                />
                <table>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>ID</th>
                            <th>Món ăn</th>
                            <th>Danh mục</th>
                            <th>Đơn giá</th>
                            <th>Số lượng bán</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(mon, index) in paginatedMonAn" :key="index">
                            <td>
                                {{
                                    (currentPage - 1) * itemsPerPage + index + 1
                                }}
                            </td>
                            <td>{{ mon.maMonAn }}</td>
                            <td>{{ mon.tenMonAn }}</td>
                            <td>{{ mon.tenLoai }}</td>
                            <td>{{ formatMoney(Number(mon.donGia)) }}</td>
                            <td>{{ mon.soLuongBan }}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="pagination">
                    <button
                        @click="currentPage = Math.max(currentPage - 1, 1)"
                        :disabled="currentPage === 1"
                    >
                        <span class="icon">&lt;</span>
                    </button>
                    <span class="page-number"
                        >{{ currentPage }} / {{ totalPages }}</span
                    >
                    <button
                        @click="
                            currentPage = Math.min(currentPage + 1, totalPages)
                        "
                        :disabled="currentPage === totalPages"
                    >
                        <span class="icon">&gt;</span>
                    </button>
                </div>
            </div>

            <!-- Biểu đồ Pie top món bán chạy -->
            <div class="pie-chart-container">
                <h5>Top 10 Món ăn bán chạy nhất</h5>
                <Pie :data="pieData" :options="pieOptions" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.page-container {
    margin: 20px 80px;
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

.filter-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 20px;
    margin-bottom: 20px;
}

.filter-btns {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.filter-btns label {
    margin-right: 10px;
    font-size: 1.6rem;
    color: var(--brown-color);
    font-weight: 600;
}

.filter-btns select {
    font-size: 1.4rem;
    padding: 8px;
    border-radius: 5px;
    border: 1px solid #ccc;
    color: var(--brown-color);
    font-weight: 600;
}

.filter-btns select:focus {
    border-color: var(--blue-color);
    outline: none;
}

.cards-container {
    display: flex;
    gap: 30px;
    margin-bottom: 30px;
}

.card {
    flex: 1;
    background-color: var(--white-color);
    border-radius: 8px;
    box-shadow: 0 2px 5px rgb(0 0 0 / 0.1);
    padding: 20px 30px;
    display: flex;
    align-items: center;
    gap: 20px;
    color: var(--blue-color);
}

.card-icon {
    font-size: 4rem;
    min-width: 60px;
    text-align: center;
}

.card-info {
    flex: 1;
}

.card-label {
    font-weight: 500;
    font-size: 1.6rem;
    margin-top: 6px;
    color: var(--brown-color);
}

.card-value {
    font-weight: 700;
    font-size: 2.6rem;
    margin-top: 10px;
}

.card-change {
    margin-top: 6px;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--blue-color);
}

/* Container biểu đồ line */
.line-chart-container {
    margin: 0 auto 30px auto;
    padding: 10px 20px 30px 20px;
    text-align: center;
    color: var(--blue-color);
    background-color: var(--white-color);
    width: 100%;
    height: 300px;
    box-shadow: 0 2px 5px rgb(0 0 0 / 0.1);
}

.line-chart-container .filter-title {
    font-weight: 600;
    margin-bottom: 10px;
}

/* Container biểu đồ pie */
.pie-chart-container {
    max-width: 360px;
    margin: 0 auto;
    padding: 0 10px;
    background: var(--white-color);
    border-radius: 8px;
    box-shadow: 0 3px 6px rgb(0 0 0 / 0.1);
}

.pie-chart-container h5 {
    font-weight: 600;
    margin-bottom: 30px;
    color: var(--blue-color);
    padding-top: 20px;
}

/* Kéo rộng canvas biểu đồ theo div cha */
.line-chart-container canvas,
.pie-chart-container canvas {
    width: 100% !important;
    /* height: 100% !important; */
    min-height: 200px !important;
    object-fit: contain;
}

.bottom-section {
    display: flex;
    gap: 30px;
    justify-content: space-between;
    flex-wrap: wrap;
    width: 100%;
    min-height: 480px;
}

/* Container bảng món ăn */
.table-container {
    background: var(--white-color);
    border-radius: 8px;
    padding: 20px;
    flex: 1;
    box-shadow: 0 3px 6px rgb(0 0 0 / 0.1);
    margin: 0 auto;
}

.table-container h5 {
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--blue-color);
}

/* Input tìm kiếm */
.search-input {
    width: 100%;
    padding: 6px 12px;
    margin-bottom: 12px;
    border: 1px solid var(--dark-blue-color);
    border-radius: 4px;
    font-size: 1.2rem;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.2rem;
}

th,
td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid var(--dark-blue-color);
}

th:nth-child(5),
td:nth-child(5),
th:nth-child(6),
td:nth-child(6) {
    text-align: right;
}

th {
    background-color: var(--dark-blue-color);
    color: var(--blue-color);
}

tr:hover {
    background-color: var(--light-blue-color);
}

.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
}

.pagination button {
    padding: 8px;
    border: 1px solid var(--dark-blue-color);
    border-radius: 4px;
    background-color: var(--light-blue-color);
    cursor: pointer;
    transition: background-color 0.3s;
}

.pagination button:disabled {
    background-color: #ddd;
    cursor: not-allowed;
}

.pagination .icon {
    font-size: 1.5rem;
    color: var(--blue-color);
}

.pagination .page-number {
    font-size: 1rem;
    font-weight: 600;
    color: var(--blue-color);
}

/* Responsive cho màn hình nhỏ */
@media (max-width: 800px) {
    .cards-container {
        flex-direction: column;
    }
    .bottom-section {
        flex-direction: column;
        gap: 20px;
    }
    .line-chart-container,
    .table-container,
    .pie-chart-container {
        max-width: 100%;
    }
    .pie-chart-container {
        height: 280px;
    }
}
</style>
