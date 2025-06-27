<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useSearchStore } from "@/stores/search";
import Swal from "sweetalert2";
import moment from "moment";
import InvoicePrint from "@/components/InvoicePrint.vue";

import { fetchHoaDon, deleteHoaDon } from "@/services/hoadon";

const router = useRouter();

const searchStore = useSearchStore();
const searchText = computed(() => searchStore.getSearchText); // Lấy giá trị tìm kiếm từ store

const danhSachHoaDon = ref([]);

const printingHoaDon = ref(null);

// Lọc và phân trang
const activeTab = ref("tat_ca");
const searchTerm = ref("");
const currentPage = ref(1);
const itemsPerPage = 10;

const tabs = [
    { key: "tat_ca", label: "Tất cả" },
    { key: "cho_duyet", label: "Chờ duyệt" },
    { key: "chua_nhan_ban", label: "Chưa nhận bàn" },
    { key: "da_nhan_ban", label: "Đã nhận bàn" },
    { key: "da_hoan_thanh", label: "Đã hoàn thành" },
    { key: "da_huy", label: "Đã hủy" },
];

const changeTab = (tabKey) => {
    activeTab.value = tabKey;
};

const goToChiTiet = (maHoaDon) => {
    router.push({
        name: "ChiTietDonDatBan",
        params: { maHoaDon },
    });
};

// Checkbox chọn từng item
const selectedIds = ref(new Set());

const filteredHoaDon = computed(() => {
    return danhSachHoaDon.value.filter((item) => {
        let isValid = true;

        // Lọc theo activeTab (Trạng thái của hóa đơn)
        switch (activeTab.value) {
            case "cho_duyet":
                isValid = item.trangThai === "cho_duyet";
                break;
            case "chua_nhan_ban":
                isValid =
                    item.trangThai === "da_duyet" &&
                    item.trangThaiBan === "dat_cho";
                break;
            case "da_nhan_ban":
                isValid =
                    item.trangThai === "da_duyet" &&
                    item.trangThaiBan === "dang_phuc_vu";
                break;
            case "da_hoan_thanh":
                isValid = item.trangThai === "da_hoan_thanh";
                break;
            case "da_huy":
                isValid = item.trangThai === "da_huy";
                break;
            case "tat_ca":
            default:
                isValid = true;
                break;
        }

        // Lọc theo searchText
        if (searchText.value) {
            const lowerCaseSearchText = searchText.value.toLowerCase();
            isValid =
                isValid &&
                ((item.maHoaDon &&
                    item.maHoaDon
                        .toString()
                        .toLowerCase()
                        .includes(lowerCaseSearchText)) ||
                    (item.email &&
                        item.email
                            .toLowerCase()
                            .includes(lowerCaseSearchText)) ||
                    (item.SDT &&
                        item.SDT.toString().includes(lowerCaseSearchText)));
        }

        return isValid;
    });
});

// Phân trang
const totalPages = computed(() =>
    Math.ceil(filteredHoaDon.value.length / itemsPerPage)
);

const pagedHoaDon = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredHoaDon.value.slice(start, start + itemsPerPage);
});

// Hàm xử lý chọn/bỏ chọn checkbox item
function toggleSelect(id) {
    if (selectedIds.value.has(id)) {
        selectedIds.value.delete(id);
    } else {
        selectedIds.value.add(id);
    }
}

// Hàm kiểm tra tất cả checkbox hiện trang
const allChecked = computed(() => {
    if (pagedHoaDon.value.length === 0) return false;
    return pagedHoaDon.value.every((item) =>
        selectedIds.value.has(item.maHoaDon)
    );
});

// Hàm chọn hoặc bỏ chọn tất cả
function toggleSelectAll() {
    if (allChecked.value) {
        // Bỏ chọn tất cả
        pagedHoaDon.value.forEach((item) => {
            selectedIds.value.delete(item.maHoaDon);
        });
    } else {
        // Chọn tất cả
        pagedHoaDon.value.forEach((item) => {
            selectedIds.value.add(item.maHoaDon);
        });
    }
}

// Hàm chuyển trang
function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        selectedIds.value.clear();
    }
}

// Format thời gian hoặc hiển thị dấu '-'
function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d)) return "-";
    return d.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// Xóa 1 hóa đơn
const onDeleteHoaDon = async (maHoaDon, trangThai) => {
    // Kiểm tra nếu hóa đơn không có trạng thái 'da_huy' hoặc 'da_hoan_thanh'
    if (trangThai !== "da_huy" && trangThai !== "da_hoan_thanh") {
        await Swal.fire({
            title: "Không thể xóa hóa đơn này",
            text: "Chỉ có thể xóa hóa đơn đã hủy hoặc đã hoàn thành. Vui lòng hoàn thành hoặc dủy đơn đặt bàn!",
            icon: "error",
            confirmButtonText: "OK",
        });
        return;
    }

    const confirmResult = await Swal.fire({
        title: "Bạn có chắc muốn xóa hóa đơn này?",
        text: "Hành động này không thể hoàn tác!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        reverseButtons: true,
    });

    if (confirmResult.isConfirmed) {
        try {
            await deleteHoaDon(maHoaDon);
            await Swal.fire(
                "Đã xóa!",
                "Hóa đơn đã được xóa thành công.",
                "success"
            );
            await loadData();
            currentPage.value = 1;
        } catch (error) {
            await Swal.fire(
                "Lỗi!",
                "Xóa hóa đơn thất bại. Vui lòng thử lại.",
                "error"
            );
        }
    }
};

// Xóa nhiều hóa đơn đã chọn
const onDeleteSelected = async () => {
    if (selectedIds.value.size === 0) {
        await Swal.fire(
            "Thông báo",
            "Bạn chưa chọn hóa đơn nào để xóa.",
            "info"
        );
        return;
    }

    // Lọc các hóa đơn đã chọn từ danh sách hóa đơn
    const selectedHoaDons = danhSachHoaDon.value.filter((item) =>
        selectedIds.value.has(item.maHoaDon)
    );

    // Kiểm tra trạng thái của các hóa đơn đã chọn
    const invalidHds = selectedHoaDons.filter(
        (item) => !["da_huy", "da_hoan_thanh"].includes(item.trangThai)
    );

    if (invalidHds.length > 0) {
        await Swal.fire({
            title: "Không thể xóa các hóa đơn này",
            text: "Chỉ có thể xóa các hóa đơn đã hủy hoặc đã hoàn thành. Vui lòng hoàn thành hoặc hủy hóa đơn!",
            icon: "error",
            confirmButtonText: "OK",
        });
        return;
    }

    const confirmResult = await Swal.fire({
        title: `Bạn có chắc muốn xóa ${selectedIds.value.size} hóa đơn đã chọn?`,
        text: "Hành động này không thể hoàn tác!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa tất cả",
        cancelButtonText: "Hủy",
        reverseButtons: true,
    });

    if (confirmResult.isConfirmed) {
        try {
            // Lặp qua từng mã hóa đơn và gọi hàm deleteHoaDon để xóa
            for (const id of selectedIds.value) {
                await deleteHoaDon(id);
                danhSachHoaDon.value = danhSachHoaDon.value.filter(
                    (item) => item.maHoaDon !== id
                );
            }
            selectedIds.value.clear();

            await Swal.fire(
                "Đã xóa!",
                `${selectedIds.value.size} hóa đơn đã được xóa thành công.`,
                "success"
            );
            await loadData();
            currentPage.value = 1;
        } catch (error) {
            await Swal.fire(
                "Lỗi!",
                "Xóa một số hoặc tất cả hóa đơn thất bại. Vui lòng thử lại.",
                "error"
            );
        }
    }
};

// Hàm in hóa đơn
const printInvoice = async (hoaDon) => {
    if (hoaDon.trangThai !== "da_hoan_thanh") {
        await Swal.fire({
            title: "Không thể in hóa đơn này",
            text: `Chỉ được in hóa đơn đã hoàn thành!`,
            icon: "error",
            confirmButtonText: "OK",
        });
        return;
    }

    printingHoaDon.value = hoaDon;
    await nextTick(); //Đợi Vue render xong InvoicePrint

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

    printingHoaDon.value = null;
};

const loadData = async () => {
    try {
        const hd = await fetchHoaDon();
        danhSachHoaDon.value = hd.sort((a, b) => {
            const dateA = moment(a.created_at, "YYYY-MM-DD HH:mm:ss");
            const dateB = moment(b.created_at, "YYYY-MM-DD HH:mm:ss");
            return dateB.isBefore(dateA) ? 1 : -1;
        });
        selectedIds.value.clear();
    } catch (err) {
        console.error("Lỗi tải hóa đơn:", err);
    }
};

onMounted(() => {
    loadData();
});

watch([activeTab, searchTerm], () => {
    currentPage.value = 1;
    selectedIds.value.clear();
});
</script>

<template>
    <div class="page-container">
        <h3 class="title">Lịch sử đặt bàn</h3>
        <hr />
        <div class="list-container">
            <div class="tabs">
                <div
                    v-for="tab in tabs"
                    :key="tab.key"
                    class="tab"
                    :class="{ active: activeTab === tab.key }"
                    @click="changeTab(tab.key)"
                >
                    {{ tab.label }}
                </div>
            </div>

            <div class="list-content">
                <!-- Bảng danh sách hóa đơn -->
                <table class="order-table">
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    :checked="allChecked"
                                    @change="toggleSelectAll"
                                />
                            </th>
                            <th>STT</th>
                            <th>Mã hóa đơn</th>
                            <th>Thời gian nhận bàn</th>
                            <th>Khách hàng</th>
                            <th>Khu vực</th>
                            <th>Bàn</th>
                            <th>Số lượng khách</th>
                            <th>Thành tiền</th>
                            <th>Trạng thái thanh toán</th>
                            <th>Trạng thái đơn hàng</th>
                            <th>Chi tiết</th>
                            <th>In hóa đơn</th>
                            <th>Xóa</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(item, index) in pagedHoaDon"
                            :key="item.maHoaDon"
                        >
                            <td>
                                <input
                                    type="checkbox"
                                    :checked="selectedIds.has(item.maHoaDon)"
                                    @change="toggleSelect(item.maHoaDon)"
                                />
                            </td>
                            <td>
                                {{
                                    (currentPage - 1) * itemsPerPage + index + 1
                                }}
                            </td>
                            <td>{{ item.maHoaDon }}</td>
                            <td>{{ formatDate(item.thoiGianNhanBan) }}</td>
                            <td>{{ item.email || item.SDT || "-" }}</td>
                            <td>{{ item.tenKhuVuc || "-" }}</td>
                            <td>{{ item.maBan || "-" }}</td>
                            <td>{{ item.soLuongKhach || 0 }}</td>
                            <td>
                                {{
                                    parseInt(item.thanhTien).toLocaleString(
                                        "vi-VN"
                                    )
                                }}đ
                            </td>
                            <td>{{ item.trangThaiTT || "-" }}</td>
                            <td>{{ item.trangThai || "-" }}</td>
                            <td>
                                <button
                                    class="btn-detail"
                                    @click="goToChiTiet(item.maHoaDon)"
                                    title="Xem chi tiết"
                                >
                                    <i class="fas fa-file-lines"></i>
                                </button>
                            </td>
                            <td>
                                <button
                                    class="btn-print"
                                    @click="printInvoice(item)"
                                    title="In hóa đơn"
                                >
                                    <i class="fas fa-print"></i>
                                </button>
                            </td>

                            <td>
                                <button
                                    class="btn-delete"
                                    @click="
                                        onDeleteHoaDon(
                                            item.maHoaDon,
                                            item.trangThai
                                        )
                                    "
                                    title="Xóa hóa đơn"
                                >
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                        <tr v-if="pagedHoaDon.length === 0">
                            <td colspan="12" class="no-data">
                                Không có hóa đơn
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="bottom-controls">
                    <button
                        class="btn-delete-selected"
                        @click="onDeleteSelected"
                        :disabled="selectedIds.size === 0"
                    >
                        Xóa {{ selectedIds.size }} hóa đơn đã chọn
                    </button>

                    <div class="pagination">
                        <button
                            @click="goToPage(currentPage - 1)"
                            :disabled="currentPage === 1"
                        >
                            &lt;
                        </button>

                        <span class="page-numbers">
                            <button
                                v-for="page in totalPages"
                                :key="page"
                                :class="{ active: currentPage === page }"
                                @click="goToPage(page)"
                            >
                                {{ page }}
                            </button>
                        </span>

                        <button
                            @click="goToPage(currentPage + 1)"
                            :disabled="currentPage === totalPages"
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <InvoicePrint v-if="printingHoaDon" :hoaDon="printingHoaDon" />
    </div>
</template>

<style scoped>
.page-container {
    margin: 20px 50px;
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

.list-container {
    background-color: var(--white-color);
    box-shadow: 1px 1px 6px rgb(0 0 0 / 0.5);
    border: 1px solid var(--light-gray-color);
    padding: 20px 0;
    border-radius: 6px;
}

/* Filter tabs */
.tabs {
    display: flex;
    justify-content: space-around;
    margin-bottom: 20px;
    display: flex;
}

.tab {
    position: relative;
    font-size: 1.4rem;
    font-weight: 600;
    cursor: pointer;
    padding: 10px;
    color: var(--dark-gray-color);
    flex: 1;
    border-bottom: 3px solid var(--light-green-color);
    text-align: center;
    text-transform: uppercase;
}

.tab:hover {
    color: var(--black-color);
}

.tab.active {
    color: var(--blue-color);
    border-bottom: 3px solid var(--dark-gray-color);
}

.list-content {
    padding: 0 10px;
    min-height: 700px;
}

/* Table */
.order-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.4rem;
    color: var(--black-color);
}

.order-table th,
.order-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}

.order-table tbody tr td:nth-child(5) {
    text-align: left;
    padding-left: 10px;
}

.order-table th {
    background-color: var(--light-green-color);
    font-weight: 600;
}

.no-data {
    text-align: center;
    padding: 20px;
    font-style: italic;
    color: var(--dark-gray-color);
}

/* Bottom controls */
.bottom-controls {
    margin-top: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.btn-delete-selected {
    padding: 8px 12px;
    background-color: #e53e3e;
    border: none;
    color: white;
    border-radius: 4px;
    cursor: pointer;
}

.btn-delete-selected:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
/* CSS chung cho nút chứa icon */
.btn-detail,
.btn-print,
.btn-delete {
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.25s ease, color 0.25s ease;
}

/* Icon chung trong nút */
.btn-detail i,
.btn-print i,
.btn-delete i {
    font-size: 1.3rem;
    vertical-align: middle;
    transition: color 0.25s ease;
}

/* Màu nền và icon nút Chi tiết */
.btn-detail {
    background-color: #fff;
    color: #2f855a;
}
.btn-detail:hover {
    color: #276749;
}

/* Màu nền và icon nút In hóa đơn */
.btn-print {
    background-color: #fff;
    color: #4a5568;
}
.btn-print:hover {
    color: #2d3748;
}

/* Màu nền và icon nút Xóa */
.btn-delete {
    background-color: #fff;
    color: #e53e3e;
}
.btn-delete:hover {
    color: #9b2c2c;
}

/* Pagination */
.pagination {
    display: flex;
    align-items: center;
    gap: 6px;
}

.pagination button {
    padding: 6px 10px;
    border: 1px solid var(--dark-gray-color);
    background-color: white;
    cursor: pointer;
    border-radius: 4px;
    font-weight: 600;
    color: var(--dark-gray-color);
    transition: background-color 0.2s, color 0.2s;
}

.pagination button:hover {
    background-color: var(--light-blue-color);
    border-color: var(--blue-color);
}

.pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.pagination button.active {
    background-color: var(--light-blue-color);
    color: var(--blue-color);
    border-color: var(--blue-color);
}

.page-numbers {
    display: flex;
    gap: 4px;
}

/* --- Responsive --- */

/* Tablet (768px đến 1024px) */
@media (max-width: 1024px) and (min-width: 768px) {
    .page-container {
        margin: 20px 30px;
        font-size: 14px; /* giảm font */
    }

    .title {
        font-size: 1.6rem; /* ~25.6px */
    }

    .tabs {
        gap: 8px;
    }

    .tab {
        font-size: 1.2rem;
        padding: 8px 6px;
    }

    .list-content {
        min-height: 500px;
        padding: 0 5px;
    }

    .order-table {
        font-size: 1.2rem;
    }

    .order-table th,
    .order-table td {
        padding: 6px 8px;
    }

    .btn-detail i,
    .btn-print i,
    .btn-delete i {
        font-size: 1rem;
    }

    .bottom-controls {
        flex-direction: column;
        gap: 12px;
    }

    .btn-delete-selected {
        font-size: 1.1rem;
        padding: 8px 10px;
        width: 100%;
    }

    .pagination {
        justify-content: center;
        gap: 6px;
        flex-wrap: wrap;
    }

    .pagination button {
        font-size: 1rem;
        padding: 6px 10px;
    }
}

/* Mobile (dưới 768px) */
@media (max-width: 767px) {
    .page-container {
        margin: 15px 15px;
        font-size: 12px; /* nhỏ nhất */
    }

    .title {
        font-size: 1.4rem; /* ~22.4px */
        margin-bottom: 12px;
    }

    .tabs {
        flex-direction: column;
        gap: 10px;
    }

    .tab {
        font-size: 1rem;
        padding: 10px 8px;
        text-align: left;
        border-bottom: none;
        border-left: 4px solid transparent;
    }

    .tab.active {
        border-left: 4px solid var(--dark-gray-color);
        background-color: #f9f9f9;
        color: var(--blue-color);
    }

    .list-content {
        padding: 0;
        min-height: auto;
    }

    .order-table {
        display: block;
        overflow-x: auto;
        white-space: nowrap;
        font-size: 1rem;
    }

    .order-table th,
    .order-table td {
        padding: 8px 6px;
    }

    .order-table tbody tr td:nth-child(5) {
        text-align: left;
        padding-left: 6px;
    }

    .btn-detail i,
    .btn-print i,
    .btn-delete i {
        font-size: 1rem;
    }

    .bottom-controls {
        flex-direction: column;
        gap: 12px;
    }

    .btn-delete-selected {
        font-size: 1rem;
        padding: 10px 12px;
        width: 100%;
    }

    .pagination {
        justify-content: center;
        flex-wrap: wrap;
        gap: 8px;
    }

    .pagination button {
        font-size: 1rem;
        padding: 8px 12px;
        min-width: 36px;
    }
}

#invoice-content {
    display: none;
}
</style>
