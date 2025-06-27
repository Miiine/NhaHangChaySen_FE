<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useSearchStore } from "@/stores/search";
import Swal from "sweetalert2";
import BaseButton from "@/components/BaseButton.vue";
import InvoicePrint from "@/components/InvoicePrint.vue";

import { fetchKhuVuc } from "@/services/khuvuc";
import { updateTrangThaiBan } from "@/services/ban";
import {
    fetchHoaDon,
    completeHoaDon,
    updateThanhToan,
    confirmHoaDon,
    cancelHoaDon,
    customerReceiveTable,
    autoCancelHoaDon,
} from "@/services/hoadon";
import { createThongBao } from "@/services/thongbao";

const router = useRouter();

const searchStore = useSearchStore();
const searchText = computed(() => searchStore.getSearchText); // Lấy giá trị tìm kiếm từ store

const printingHoaDon = ref(null);

const floorList = ref([]);
const hoaDonList = ref([]);
const selectedFloor = ref("");
const selectedDate = ref("");
const openMenuFor = ref(null);
const currentPage = ref(1);
const pageSize = ref(9);
const isLoading = ref(false);
const isModalOpen = ref(false);
const paymentAmount = ref(0);
const totalAmount = ref(0);
const paidAmount = ref(0);
const paymentMethod = ref("VNPay");
const hoaDonChon = ref([]);

const tabs = [
    { key: "dang_su_dung", label: "Bàn đang sử dụng" },
    { key: "cho_khach", label: "Bàn đã đặt trước" },
    { key: "cho_duyet", label: "Bàn chờ duyệt" },
];

const activeTab = ref("dang_su_dung");

const toPage = (page) => {
    router.push({ name: page });
    window.scrollTo(0, 0);
};

const toggleMenu = (id) => {
    openMenuFor.value = openMenuFor.value === id ? null : id;
};

// Đóng popup menu khi click ra ngoài (tối giản demo)
const closeMenu = () => {
    openMenuFor.value = null;
};

const changeTab = (tabKey) => {
    activeTab.value = tabKey;
    selectedFloor.value = "";
    selectedDate.value = "";
    closeMenu();
};

const openModal = (hoaDon) => {
    hoaDonChon.value = hoaDon;
    totalAmount.value = Number(hoaDon.thanhTien);
    paidAmount.value = Number(hoaDon.daThanhToan);
    paymentAmount.value = totalAmount.value - paidAmount.value;
    paymentMethod.value = "VNPay";
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
};

// Hàm lọc hóa đơn theo trạng thái
const filteredHoaDonList = computed(() => {
    return hoaDonList.value.filter((hoaDon) => {
        if (activeTab.value === "cho_duyet") {
            return hoaDon.trangThai === "cho_duyet";
        }
        if (activeTab.value === "dang_su_dung") {
            return (
                hoaDon.trangThai === "da_duyet" &&
                hoaDon.trangThaiBan === "dang_phuc_vu"
            );
        }
        if (activeTab.value === "cho_khach") {
            return (
                hoaDon.trangThai === "da_duyet" &&
                hoaDon.trangThaiBan === "trong"
            );
        }
        return true;
    });
});

//lọc theo khu vực và ngày
// Lọc theo trạng thái, khu vực, ngày và searchText
const filteredList = computed(() => {
    return filteredHoaDonList.value.filter((hoaDon) => {
        let matchFloor = true;
        let matchDate = true;
        let matchSearchText = true; // Biến để kiểm tra việc tìm kiếm

        // Lọc theo khu vực
        if (selectedFloor.value) {
            matchFloor = hoaDon.maKhuVuc === selectedFloor.value;
        }

        // Lọc theo ngày
        if (selectedDate.value) {
            const hoaDonDate = formatDateOnly(hoaDon.thoiGianSuDung);
            matchDate = hoaDonDate === selectedDate.value;
        }

        // Lọc theo searchText
        if (searchText.value) {
            const lowerSearchText = searchText.value.toLowerCase();
            matchSearchText =
                hoaDon.hoTen?.toLowerCase().includes(lowerSearchText) || // Lọc theo tên khách hàng
                (hoaDon.sdt &&
                    hoaDon.sdt.toString().includes(lowerSearchText)) || // Lọc theo số điện thoại (chuyển thành chuỗi)
                (hoaDon.maBan &&
                    hoaDon.maBan.toString().includes(lowerSearchText)); // Lọc theo mã bàn (chuyển thành chuỗi)
        }

        return matchFloor && matchDate && matchSearchText;
    });
});

//hoàn thành đơn đặt bàn
const handleComplete = async (maHoaDon) => {
    try {
        isLoading.value = true;
        const res = await completeHoaDon(maHoaDon);

        // Tìm hóa đơn chi tiết trong danh sách để lấy thông tin người nhận
        const hoaDon = hoaDonList.value.find((hd) => hd.maHoaDon === maHoaDon);
        if (hoaDon && hoaDon.maTaiKhoan) {
            const maNguoiNhan = hoaDon.maTaiKhoan;
            const tieuDe = `Đơn hàng #${maHoaDon} đã hoàn thành!`;
            const noiDung = `Đơn hàng #${maHoaDon} của bạn đã hoàn thành. Vui lòng dành ít phút đánh giá món ăn và trải nghiệm dịch vụ của chúng tôi để giúp chúng tôi phục vụ bạn tốt hơn. Cảm ơn bạn đã sử dụng dịch vụ!`;

            await createThongBao({
                maNguoiGui: null,
                maNguoiNhan,
                tieuDe,
                noiDung,
                loaiThongBao: "Đánh giá",
            });
        }

        await loadData();

        const hoaDonMoi = hoaDonList.value.find(
            (hd) => hd.maHoaDon === maHoaDon
        );

        const result = await Swal.fire({
            icon: "success",
            title: "Thành công",
            text:
                res.message ||
                "Đơn hàng đã được cập nhật trạng thái hoàn thành.",
            showCancelButton: true,
            confirmButtonText: "In hóa đơn",
            cancelButtonText: "Không in",
        });

        if (result.isConfirmed) {
            await printInvoice(hoaDonMoi);
        }

        // await loadData();
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Lỗi",
            text:
                error.response?.data?.message ||
                "Có lỗi xảy ra khi cập nhật trạng thái.",
        });
    } finally {
        isLoading.value = false;
    }
};

//hoàn thành thanh toán
const handlePayment = async () => {
    if (!hoaDonChon.value || !hoaDonChon.value.maHoaDon) {
        Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Không có hóa đơn để thanh toán.",
        });
        return;
    }

    try {
        isLoading.value = true;

        const payload = {
            phuongThucTT: paymentMethod.value,
        };

        const res = await updateThanhToan(hoaDonChon.value.maHoaDon, payload);

        // Tạo thông báo khi thanh toán thành công
        const maNguoiNhan = hoaDonChon.value.maTaiKhoan;
        if (maNguoiNhan) {
            const tieuDe = `Đơn hàng #${hoaDonChon.value.maHoaDon} đã hoàn thành!`;
            const noiDung = `Đơn hàng #${hoaDonChon.value.maHoaDon} của bạn đã hoàn thành. Vui lòng dành ít phút đánh giá món ăn và trải nghiệm dịch vụ của chúng tôi để giúp chúng tôi phục vụ bạn tốt hơn. Cảm ơn bạn đã sử dụng dịch vụ!`;

            await createThongBao({
                maNguoiGui: null,
                maNguoiNhan,
                tieuDe,
                noiDung,
                loaiThongBao: "Đánh giá",
            });
        }

        await loadData();

        const hoaDonMoi = hoaDonList.value.find(
            (hd) => hd.maHoaDon === hoaDonChon.value.maHoaDon
        );

        const result = await Swal.fire({
            icon: "success",
            title: "Thanh toán thành công",
            text: res.message || "Đơn hàng đã được thanh toán hoàn tất.",
            showCancelButton: true,
            confirmButtonText: "In hóa đơn",
            cancelButtonText: "Không in",
        });

        if (result.isConfirmed) {
            await printInvoice(hoaDonMoi);
        }

        closeModal();
        // await loadData();
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Lỗi",
            text:
                error.response?.data?.message ||
                "Có lỗi xảy ra khi cập nhật trạng thái thanh toán.",
        });
    } finally {
        isLoading.value = false;
    }
};

//cập nhật trạng thái bàn khi khách nhận bàn
const handleKhachNhanBan = async (hoaDon) => {
    if (!hoaDon.maHoaDon) {
        Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Không tìm thấy mã hóa đơn để cập nhật.",
        });
        return;
    }

    try {
        isLoading.value = true;
        await customerReceiveTable(hoaDon.maHoaDon);
        await loadData();
        Swal.fire({
            icon: "success",
            title: "Thành công",
            text: "Khách đã nhận bàn, trạng thái bàn được cập nhật.",
            timer: 2000,
            showConfirmButton: false,
        });
    } catch (error) {
        console.error("Lỗi chi tiết:", error);
        Swal.fire({
            icon: "error",
            title: "Lỗi",
            text:
                error.response?.data?.message ||
                error.message ||
                "Có lỗi xảy ra khi cập nhật trạng thái bàn.",
        });
    } finally {
        isLoading.value = false;
    }
};

//hàm xác nhận đơn đặt bàn
const handleConfirm = async (hoaDon) => {
    try {
        isLoading.value = true;

        await confirmHoaDon(hoaDon.maHoaDon);

        // Tạo thông báo sau khi duyệt thành công
        const maNguoiNhan = hoaDon.maTaiKhoan;
        if (maNguoiNhan) {
            const tieuDe = `Đơn đặt bàn đã được duyệt!`;
            const noiDung = `Hóa đơn #${hoaDon.maHoaDon} của bạn đã được duyệt.`;

            await createThongBao({
                maNguoiGui: null,
                maNguoiNhan,
                tieuDe,
                noiDung,
                loaiThongBao: "Đơn đặt bàn",
            });
        }

        Swal.fire({
            icon: "success",
            title: "Thành công",
            text: "Đơn hàng đã được xác nhận và các món ăn đang chuẩn bị.",
            timer: 2000,
            showConfirmButton: false,
        });

        await loadData();
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Lỗi",
            text:
                error.response?.data?.message ||
                "Có lỗi xảy ra khi xác nhận đơn hàng.",
        });
    } finally {
        isLoading.value = false;
    }
};

//huy đơn đặt bàn
const handleCancel = async (hoaDon) => {
    try {
        isLoading.value = true;

        await cancelHoaDon(hoaDon.maHoaDon);

        if (hoaDon.maTaiKhoan) {
            const maNguoiNhan = hoaDon.maTaiKhoan;
            const tieuDe = `Đơn hàng #${hoaDon.maHoaDon} đã bị hủy!`;
            const noiDung = `Đơn hàng #${hoaDon.maHoaDon} của bạn đã được hủy. Nếu có thắc mắc, vui lòng liên hệ với chúng tôi để được hỗ trợ.`;

            await createThongBao({
                maNguoiGui: null,
                maNguoiNhan,
                tieuDe,
                noiDung,
                loaiThongBao: "Đơn đặt bàn",
            });
        }

        Swal.fire({
            icon: "success",
            title: "Thành công",
            text: "Đơn hàng đã được hủy.",
            timer: 2000,
            showConfirmButton: false,
        });

        await loadData();
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: error.response?.data?.message || "Có lỗi xảy ra khi hủy đơn.",
        });
    } finally {
        isLoading.value = false;
    }
};

//xem chi tiết hóa đơn và chỉnh sửa
const goToEditOrder = (maHoaDon) => {
    router.push({
        name: "ChinhSuaDonDatBan",
        params: { maHoaDon },
    });
};

//hàm chuyển bàn
const handleChuyenBan = (maHoaDon) => {
    router.push({
        name: "SoDoBan",
        query: { maHoaDon },
    });
};

//phân trang
const pagedList = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredList.value.slice(start, end);
});
const totalPages = computed(() => {
    return Math.ceil(filteredList.value.length / pageSize.value);
});
const goToPage = (page) => {
    if (page < 1) page = 1;
    else if (page > totalPages.value) page = totalPages.value;
    currentPage.value = page;
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) currentPage.value++;
};

const prevPage = () => {
    if (currentPage.value > 1) currentPage.value--;
};

//định dạng tiền
const formatCurrency = (value) =>
    Number(value).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
    });

//định dạng ngày giờ
function formatDateTime(dateInput) {
    const date = new Date(dateInput);

    const padZero = (num) => (num < 10 ? "0" + num : num);

    const day = padZero(date.getDate());
    const month = padZero(date.getMonth() + 1);
    const year = date.getFullYear();

    const hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatDateOnly(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    // Lấy ngày tháng năm theo múi giờ local, tránh so sánh sai vì UTC
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Hàm in hóa đơn
const printInvoice = async (hoaDon) => {
    printingHoaDon.value = hoaDon;
    await nextTick(); //Đợi Vue render xong InvoicePrint

    const printContent = document.getElementById("invoice-content");
    console.log(document.getElementById("invoice-content"));

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
    const kv = await fetchKhuVuc();

    let hdData = await fetchHoaDon();

    // Tự động hủy hóa đơn chưa thanh toán sau 1h
    const now = new Date();
    for (const hd of hdData) {
        if (
            hd.trangThaiTT === "chua_thanh_toan" && // chưa thanh toán
            hd.trangThai !== "da_huy" &&
            hd.thoiGianDatBan &&
            now - new Date(hd.thoiGianDatBan) > 60 * 60 * 1000 // quá 1h
        ) {
            await autoCancelHoaDon(hd.maHoaDon);
        }
    }

    // Lấy lại danh sách hóa đơn sau khi cập nhật trạng thái
    hdData = await fetchHoaDon();

    floorList.value = kv;
    hoaDonList.value = hdData;

    console.log("Khu vực:", floorList.value);
    console.log("Hóa đơn:", hoaDonList.value);

    selectedFloor.value = "";
    selectedDate.value = "";
};

onMounted(() => {
    loadData();
});

watch([selectedFloor, selectedDate, activeTab], () => {
    currentPage.value = 1;
});
</script>

<template>
    <div class="page-container" @click="closeMenu">
        <h3 class="title">Lịch đặt bàn</h3>
        <hr />

        <div class="top-bar">
            <button class="btn-add" @click="toPage('ThemDonDatBan')">
                <i class="fas fa-plus"></i> Thêm mới
            </button>
        </div>

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

        <div class="hoa-don-list">
            <div class="list-header">
                <div class="tab-title">
                    <h4 v-if="activeTab === 'dang_su_dung'">
                        Đơn đặt bàn đã có khách nhận bàn
                    </h4>
                    <h4 v-else-if="activeTab === 'cho_khach'">
                        Đơn đặt bàn chờ khách nhận bàn
                    </h4>
                    <h4 v-else>Đơn đặt bàn chờ duyệt</h4>
                </div>
                <div class="filters">
                    <div v-if="activeTab !== 'dang_su_dung'">
                        <input
                            type="date"
                            v-model="selectedDate"
                            class="date-filter"
                        />
                    </div>

                    <select v-model="selectedFloor" class="floor-select">
                        <option value="">-- Chọn tầng --</option>
                        <option
                            v-for="floor in floorList"
                            :key="floor.maKhuVuc"
                            :value="floor.maKhuVuc"
                        >
                            {{ floor.tenKhuVuc }}
                        </option>
                    </select>
                </div>
            </div>

            <div v-if="hoaDonList.length === 0" class="empty-state">
                <img
                    src="/assets/images/no-data.webp"
                    alt="No data"
                    class="no-data-img"
                />
                <p>Không có dữ liệu</p>
            </div>

            <div class="list-card">
                <div class="cards">
                    <div
                        v-for="hoaDon in pagedList"
                        :key="hoaDon.maHoaDon"
                        class="hoa-don-card"
                        :class="{
                            unpaid:
                                hoaDon.trangThaiTT === 'chua_thanh_toan' &&
                                hoaDon.trangThai === 'cho_duyet',
                        }"
                        @click.stop
                    >
                        <div class="header">
                            <div class="ten-kh">{{ hoaDon.hoTen }}</div>
                            <div class="sdt">{{ hoaDon.sdt }}</div>
                        </div>

                        <div class="body">
                            <div class="soban">{{ hoaDon.maBan ?? "?" }}</div>
                            <div class="thongtin">
                                <div class="row-info">
                                    <div>
                                        <i class="fa fa-location-dot"></i>
                                        <b>{{ hoaDon.tenKhuVuc }}</b>
                                    </div>
                                    <div>
                                        <i class="fa-solid fa-users"></i>
                                        <b>{{ hoaDon.soLuongKhach }}</b>
                                    </div>
                                </div>
                                <div>
                                    <i class="fa-solid fa-money-bill-wave"></i>
                                    <b>{{
                                        formatCurrency(hoaDon.thanhTien)
                                    }}</b>
                                </div>
                                <div>
                                    <i class="fa-solid fa-clock"></i>
                                    <b>{{
                                        hoaDon.thoiGianNhanBan
                                            ? formatDateTime(
                                                  hoaDon.thoiGianNhanBan
                                              )
                                            : formatDateTime(
                                                  hoaDon.thoiGianSuDung
                                              )
                                    }}</b>
                                </div>
                            </div>
                        </div>

                        <div class="footer">
                            <div
                                v-if="
                                    activeTab === 'dang_su_dung' &&
                                    hoaDon.trangThaiTT === 'toan_bo' &&
                                    Number(hoaDon.daThanhToan) ===
                                        Number(hoaDon.thanhTien)
                                "
                                class="btn-thanh-toan"
                                :disabled="isLoading"
                                @click.stop="handleComplete(hoaDon.maHoaDon)"
                            >
                                Hoàn thành
                            </div>

                            <div
                                v-if="
                                    activeTab === 'dang_su_dung' &&
                                    (hoaDon.trangThaiTT === 'coc' ||
                                        hoaDon.trangThaiTT === 'tt_sau' ||
                                        (hoaDon.trangThaiTT === 'toan_bo' &&
                                            Number(hoaDon.daThanhToan) !==
                                                Number(hoaDon.thanhTien)))
                                "
                                class="btn-thanh-toan"
                                :disabled="isLoading"
                                @click.stop="openModal(hoaDon)"
                            >
                                Thanh toán
                            </div>

                            <div
                                v-if="activeTab === 'cho_khach'"
                                class="btn-khach-nhan"
                                @click.stop="handleKhachNhanBan(hoaDon)"
                            >
                                Khách nhận bàn
                            </div>

                            <div
                                v-if="activeTab === 'cho_duyet'"
                                class="btn-xac-nhan"
                                @click.stop="handleConfirm(hoaDon)"
                            >
                                Xác nhận
                            </div>

                            <div
                                class="btn-more"
                                @click.stop="toggleMenu(hoaDon.maHoaDon)"
                            >
                                <i class="fas fa-ellipsis"></i>
                                <div
                                    v-if="openMenuFor === hoaDon.maHoaDon"
                                    class="menu-popup"
                                >
                                    <div
                                        class="menu-item chi-tiet"
                                        @click.stop="
                                            goToEditOrder(hoaDon.maHoaDon)
                                        "
                                    >
                                        <i class="fas fa-file-alt"></i>
                                        Chỉnh sửa
                                    </div>
                                    <div
                                        class="menu-item chuyen-ban"
                                        @click.stop="
                                            handleChuyenBan(hoaDon.maHoaDon)
                                        "
                                    >
                                        <i class="fas fa-exchange-alt"></i>
                                        Chuyển bàn
                                    </div>
                                    <div
                                        class="menu-item huy-don"
                                        @click.stop="handleCancel(hoaDon)"
                                    >
                                        <i class="fas fa-times-circle"></i>
                                        Hủy đơn
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="pagination">
                <button @click="prevPage" :disabled="currentPage === 1">
                    &lt;
                </button>

                <button
                    v-for="page in totalPages"
                    :key="page"
                    @click="goToPage(page)"
                    :class="{ active: currentPage === page }"
                >
                    {{ page }}
                </button>

                <button
                    @click="nextPage"
                    :disabled="currentPage === totalPages"
                >
                    &gt;
                </button>
            </div>
        </div>
        <!-- Modal -->
        <div v-if="isModalOpen" class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h3>THANH TOÁN</h3>
                    <button class="btn-close" @click="closeModal">×</button>
                </div>

                <div class="modal-body">
                    <p>
                        <strong>Tổng hóa đơn:</strong>
                        {{ formatCurrency(totalAmount) }}
                    </p>
                    <p>
                        <strong>Số tiền đã thanh toán:</strong>
                        {{ formatCurrency(paidAmount) }}
                    </p>
                    <p>
                        <strong>Số tiền cần thanh toán:</strong>
                        {{ formatCurrency(paymentAmount) }}
                    </p>

                    <div class="payment-methods">
                        <label>
                            <input
                                type="radio"
                                value="VNPay"
                                v-model="paymentMethod"
                            />
                            Thanh toán qua ví VNPay
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="bank"
                                v-model="paymentMethod"
                            />
                            Chuyển khoản ngân hàng
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="tien_mat"
                                v-model="paymentMethod"
                            />
                            Thanh toán tiền mặt
                        </label>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-pay" @click="handlePayment">
                        THANH TOÁN
                    </button>
                    <button class="btn-cancel" @click="closeModal">HỦY</button>
                </div>
            </div>
        </div>
        <InvoicePrint v-if="printingHoaDon" :hoaDon="printingHoaDon" />
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
    margin-bottom: 35px;
}

.btn-add {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--dark-blue-color);
    border: none;
    border-radius: 8px;
    padding: 8px 14px;
    cursor: pointer;
    user-select: none;
    font-weight: 600;
    font-size: 1.4rem;
    color: var(--black-color);
    transition: background-color 0.3s ease;
    text-transform: uppercase;
}

.btn-add:hover {
    background: #a0b6c2;
}

.tabs {
    display: flex;
    justify-content: space-around;
    margin-bottom: 30px;
    display: flex;
}

.tab {
    position: relative;
    font-size: 1.6rem;
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

.hoa-don-list {
    background-color: var(--white-color);
    border: 1px solid var(--light-gray-color);
    padding: 20px;
    border-radius: 8px;
    box-shadow: 5px 5px 8px rgb(0 0 0 / 0.2);
    color: var(--black-color);
    min-height: 500px;
    margin-bottom: 50px;
}

.list-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 2px solid var(--dark-gray-color);
    padding-bottom: 15px;
    margin-bottom: 30px;
}

.hoa-don-list h4 {
    font-weight: 600;
    font-size: 1.6rem;
}

.filters {
    display: flex;
    gap: 15px;
    align-items: center;
}

.date-filter {
    padding: 6px 10px;
    font-size: 1.4rem;
    border-radius: 6px;
    border: 1px solid var(--light-gray-color);
    color: var(--black-color);
}

.floor-select {
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid var(--light-gray-color);
    color: var(--black-color);
    font-size: 1.4rem;
}

.list-card {
    padding: 0 10px;
}

.list-card .cards {
    display: flex;
    flex-wrap: wrap;
    gap: 25px;
}

.hoa-don-card {
    width: 320px;
    background: #eaeaea;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgb(0 0 0 / 0.2);
    display: flex;
    color: var(--black-color);
    flex-direction: column;
    user-select: none;
    cursor: pointer;
    padding: 15px 0 0 0;
    transition: box-shadow 0.3s ease;
}

.hoa-don-card:hover {
    box-shadow: 0 6px 12px rgb(0 0 0 / 0.15);
}

.hoa-don-card .header {
    display: flex;
    justify-content: space-between;
    font-size: 1.6rem;
    font-weight: 600;
    margin-bottom: 10px;
    padding: 0 15px;
}

.hoa-don-card .body {
    display: flex;
    gap: 15px;
    align-items: center;
    padding: 15px;
    background-color: var(--white-color);
    border-top: 1px solid var(--dark-gray-color);
    border-bottom: 1px solid var(--dark-gray-color);
}

.hoa-don-card .soban {
    padding: 0 32px;
    font-weight: 700;
    font-size: 4.2rem;
    display: flex;
    justify-content: center;
    align-items: center;
}

.hoa-don-card .thongtin {
    flex: 1;
    font-size: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 10px;
}

.hoa-don-card .thongtin div {
    display: flex;
    align-items: baseline;
    gap: 6px;
}

.hoa-don-card .thongtin .row-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

.hoa-don-card .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.btn-thanh-toan,
.btn-khach-nhan,
.btn-xac-nhan {
    flex: 1;
    text-align: center;
    color: var(--blue-color);
    border-bottom-left-radius: 10px;
    padding: 10px 10px;
    font-weight: 600;
    font-size: 1.6rem;
    cursor: pointer;
    transition: background-color 0.3s;
}

.btn-thanh-toan:hover,
.btn-khach-nhan:hover,
.btn-xac-nhan:hover {
    background-color: var(--light-gray-color);
}

.btn-more {
    flex: 1;
    text-align: center;
    position: relative;
    border-bottom-right-radius: 10px;
    padding: 10px 10px;
    font-weight: 600;
    font-size: 1.6rem;
    cursor: pointer;
    transition: background-color 0.3s;
}

.btn-more:hover {
    background-color: var(--light-gray-color);
}

.menu-popup {
    position: absolute;
    left: 30px;
    top: 100%;
    background: var(--white-color);
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    width: 140px;
    z-index: 10;
}

.menu-item {
    padding: 10px 15px;
    font-size: 1rem;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background-color 0.2s ease;
}

.menu-item:hover {
    background-color: #e9e9e9;
}

.menu-item i {
    font-size: 1.4rem;
    flex-shrink: 0;
}

.menu-item.chi-tiet i {
    color: var(--green-color);
}

.menu-item.chuyen-ban i {
    color: var(--blue-color);
}

.menu-item.huy-don i {
    color: var(--red-color);
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.no-data-img {
    width: 300px;
    height: auto;
    margin-bottom: 10px;
}

.empty-state p {
    margin-bottom: 10px;
    font-style: italic;
    color: var(--dark-gray-color);
    font-size: 1.2rem;
}

.pagination {
    margin-top: 30px;
    display: flex;
    justify-content: center;
    gap: 10px;
    user-select: none;
}

.pagination button {
    background: #f3f3f3;
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 5px 12px;
    font-size: 1.1rem;
    cursor: pointer;
}

.pagination button.active {
    background: #aec6cf;
    border-color: #98aebc;
    color: #fff;
}

.pagination button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

/* Responsive cho tablet (768px đến 1024px) */
@media (max-width: 1024px) and (min-width: 768px) {
    .page-container {
        margin: 20px 40px;
    }

    .title {
        font-size: 1.6rem;
    }

    .top-bar {
        margin-bottom: 25px;
    }

    .btn-add {
        font-size: 1.2rem;
        padding: 6px 12px;
    }

    .tabs {
        gap: 5px;
    }

    .tab {
        font-size: 1.3rem;
        padding: 8px 6px;
    }

    .hoa-don-list {
        padding: 15px;
        min-height: 400px;
    }

    .list-header {
        flex-wrap: wrap;
        gap: 12px;
    }

    .hoa-don-list h4 {
        font-size: 1.3rem;
    }

    .filters {
        gap: 10px;
    }

    .date-filter,
    .floor-select {
        font-size: 1.2rem;
        padding: 5px 8px;
    }

    .list-card .cards {
        gap: 20px;
    }

    .hoa-don-card {
        width: 280px;
        padding: 10px 0 0 0;
    }

    .hoa-don-card .header {
        font-size: 1.3rem;
        margin-bottom: 8px;
        padding: 0 12px;
    }

    .hoa-don-card .body {
        padding: 12px;
        gap: 12px;
    }

    .hoa-don-card .soban {
        font-size: 3.6rem;
        padding: 0 28px;
    }

    .hoa-don-card .thongtin {
        font-size: 1.1rem;
        gap: 8px;
        padding: 0 8px;
    }

    .hoa-don-card .footer > div {
        font-size: 1.3rem;
        padding: 8px 8px;
    }

    .menu-popup {
        width: 130px;
    }

    .menu-item {
        font-size: 0.9rem;
        padding: 8px 12px;
    }

    .pagination {
        gap: 6px;
    }

    .pagination button {
        font-size: 1rem;
        padding: 5px 10px;
    }
}

/* Responsive cho mobile (dưới 768px) */
@media (max-width: 767px) {
    .page-container {
        margin: 15px 15px;
    }

    .title {
        font-size: 1.4rem;
        margin-bottom: 10px;
    }

    .top-bar {
        margin-bottom: 20px;
    }

    .btn-add {
        width: 100%;
        justify-content: center;
        font-size: 1rem;
        padding: 8px 0;
    }

    .tabs {
        flex-direction: column;
        gap: 8px;
    }

    .tab {
        font-size: 1.2rem;
        padding: 8px 10px;
        border-bottom: none;
        border-left: 4px solid transparent;
        text-align: left;
    }

    .tab.active {
        border-left: 4px solid var(--dark-gray-color);
        color: var(--blue-color);
        background-color: #f0f0f0;
    }

    .hoa-don-list {
        padding: 10px;
        min-height: auto;
    }

    .list-header {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
    }

    .hoa-don-list h4 {
        font-size: 1.2rem;
        text-align: center;
    }

    .filters {
        flex-direction: column;
        gap: 10px;
    }

    .date-filter,
    .floor-select {
        width: 100%;
        font-size: 1rem;
        padding: 8px 12px;
    }

    .list-card .cards {
        flex-direction: column;
        gap: 20px;
    }

    .hoa-don-card {
        width: 100%;
        padding: 12px 0 0 0;
    }

    .hoa-don-card .header {
        font-size: 1.2rem;
        margin-bottom: 8px;
        padding: 0 10px;
    }

    .hoa-don-card .body {
        flex-direction: column;
        gap: 10px;
        padding: 10px;
    }

    .hoa-don-card .soban {
        font-size: 3rem;
        padding: 0 20px;
    }

    .hoa-don-card .thongtin {
        font-size: 1rem;
        gap: 6px;
        padding: 0 6px;
    }

    .hoa-don-card .footer {
        flex-direction: column;
        gap: 8px;
    }

    .hoa-don-card .footer > div {
        font-size: 1.2rem;
        padding: 10px 10px;
        border-radius: 6px;
        text-align: center;
    }

    .menu-popup {
        width: 100%;
        left: 0;
        top: 110%;
        border-radius: 0 0 6px 6px;
    }

    .menu-item {
        font-size: 1rem;
        padding: 10px 12px;
        justify-content: center;
    }

    .pagination {
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
    }

    .pagination button {
        font-size: 1rem;
        padding: 8px 12px;
        min-width: 36px;
    }
}

/* Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal {
    background: var(--white-color);
    width: 400px;
    border-radius: 8px;
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
}

.modal-header {
    padding: 12px 16px;
    background-color: var(--light-green-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 700;
    font-size: 1.4rem;
}

.modal-header h3 {
    text-transform: uppercase;
    display: block;
    margin: 0 auto;
}

.btn-close {
    background: transparent;
    border: none;
    font-size: 2.4rem;
    cursor: pointer;
    line-height: 1;
}

.btn-close:hover {
    color: var(--red-color);
}

.modal-body {
    padding: 20px;
    font-size: 1.4rem;
}

.payment-methods label {
    display: block;
    margin: 10px 0;
    cursor: pointer;
}

.modal-footer {
    padding: 12px 16px;
    display: flex;
    justify-content: center;
    gap: 10px;
    border-top: 1px solid var(--light-gray-color);
}

.btn-pay {
    background-color: #5cb85c;
    color: white;
    border: none;
    padding: 8px 20px;
    font-weight: 700;
    border-radius: 4px;
    cursor: pointer;
}
.btn-pay:hover {
    background-color: #4cae4c;
}

.btn-cancel {
    background-color: #ccc;
    border: none;
    padding: 8px 20px;
    border-radius: 4px;
    cursor: pointer;
}
.btn-cancel:hover {
    background-color: #bbb;
}

/* đánh dấu hóa đơn chưa thanh toán/cọc */
.hoa-don-card.unpaid {
    background-color: #ffe5e5;
    border: 1px solid red;
    position: relative;
}

.hoa-don-card.unpaid::after {
    content: "Chưa thanh toán/cọc";
    position: absolute;
    top: 12px;
    right: 90px;
    font-weight: 700;
    font-size: 1.2rem;
    color: red;
    background: #fff0f0;
    padding: 3px 8px;
    border-radius: 6px;
    user-select: none;
}

#invoice-content {
    display: none;
}
</style>
