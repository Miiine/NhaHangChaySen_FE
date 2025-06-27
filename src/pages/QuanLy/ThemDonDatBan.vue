<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import moment from "moment";
import BaseButton from "@/components/BaseButton.vue";

import { fetchMonAn } from "@/services/monan";
import { fetchLoaiMonAn } from "@/services/loaimonan";
import { fetchKhuVuc } from "@/services/khuvuc";
import { fetchKhuyenMai } from "@/services/khuyenmai";
import { fetchBan } from "@/services/ban";
import { fetchTaiKhoan, createKhachHang } from "@/services/taikhoan";
import { fetchHoaDon, adminAddHoaDon } from "@/services/hoadon";

const router = useRouter();

const danhSachMonAn = ref([]);
const danhSachLoaiMonAn = ref([]);
const danhSachKhuVuc = ref([]);
const danhSachKhuyenMai = ref([]);
const danhSachBan = ref([]);
const danhSachTaiKhoan = ref([]);
const danhSachHoaDon = ref([]);

const danhSachMonChon = ref([]);
const soLuongThem = ref(0);
const surcharge = ref(0);
const discountValue = ref(0);

// Lọc và phân trang
const selectedLoaiMonAn = ref("tat_ca");
const searchTerm = ref("");
const currentPage = ref(1);
const itemsPerPage = 5;

// Form data
const hoTen = ref("");
const sdt = ref("");
const taiKhoanChon = ref("");
const soLuongKhach = ref(1);
const ngaySuDung = ref("");
const gioSuDung = ref("");
const khuVucChon = ref("");
const banChon = ref("");
const khuyenMaiChon = ref("");
const ghiChu = ref("");

//modal
const showModal = ref(false);
const newCustomerName = ref("");
const newCustomerSDT = ref("");

// Hàm đóng modal
const closeModal = () => {
    showModal.value = false;
    resetForm();
};

// Reset form nhập liệu trong modal
const resetForm = () => {
    newCustomerName.value = "";
    newCustomerSDT.value = "";
};

// Hàm lưu khách hàng mới
const saveNewCustomer = async () => {
    if (!newCustomerName.value.trim() || !newCustomerSDT.value.trim()) {
        Swal.fire(
            "Lỗi",
            "Vui lòng nhập đầy đủ tên và số điện thoại.",
            "warning"
        );
        return;
    }

    try {
        const payload = {
            tenTaiKhoan: newCustomerName.value.trim(),
            sdt: newCustomerSDT.value.trim(),
        };

        const response = await createKhachHang(payload);

        Swal.fire({
            icon: "success",
            title: "Thành công",
            text: "Thêm khách hàng mới thành công!",
        });

        // Cập nhật lại danh sách khách hàng mới lấy từ API
        danhSachTaiKhoan.value = await fetchTaiKhoan();

        // Tự động chọn khách hàng mới thêm vào dropdown
        taiKhoanChon.value = response.maTaiKhoan;
        hoTen.value = newCustomerName.value.trim();
        sdt.value = newCustomerSDT.value.trim();

        // Đóng modal và reset form
        closeModal();
    } catch (error) {
        console.error("Lỗi khi tạo khách hàng mới:", error);
        Swal.fire(
            "Lỗi",
            "Không thể tạo khách hàng mới. Vui lòng thử lại.",
            "error"
        );
    }
};

const taiKhoanDuocChon = computed(() => {
    return (
        danhSachTaiKhoan.value.find(
            (tk) => tk.maTaiKhoan === taiKhoanChon.value
        ) || null
    );
});

const goBack = () => {
    router.back();
    window.scrollTo(0, 0);
};

// Hàm lấy ảnh chính
function getMainImage(images = []) {
    if (!Array.isArray(images)) return "";
    const main = images.find((i) => i.anhChinh) || images[0] || {};
    return main.url || "";
}

// Lấy list khách hàng từ tài khoản
const khachHangList = computed(() => {
    return danhSachTaiKhoan.value.filter((tk) => tk.maVaiTro === 1);
});

// Lọc bàn theo khu vực và trạng thái "trong"
const reservedTableIds = computed(() => {
    if (!ngaySuDung.value) return [];

    return danhSachHoaDon.value
        .filter((hd) => {
            // Lấy ngày theo định dạng YYYY-MM-DD để so sánh
            const hdDate = moment(hd.thoiGianSuDung).format("YYYY-MM-DD");
            return (
                hdDate === ngaySuDung.value &&
                ["cho_duyet", "da_duyet"].includes(hd.trangThai)
            );
        })
        .map((hd) => hd.maBan);
});

const banTheoKhuVuc = computed(() => {
    return danhSachBan.value.filter(
        (ban) =>
            ban.maKhuVuc === khuVucChon.value &&
            // ban.trangThai === "trong" &&
            ban.soLuongKhachToiDa >= soLuongKhach.value &&
            !reservedTableIds.value.includes(ban.maBan)
    );
});

//Lọc khuyến mãi khi số lượng km>0; còn hạn và hóa đơn đủ điều kiện
const filteredDiscount = computed(() => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    return danhSachKhuyenMai.value.filter((km) => {
        const thoiGianApDung = new Date(km.thoiGianApDung);
        const thoiGianHetHan = new Date(km.thoiGianHetHan);
        const isValid = km.dieuKienApDung <= totalAmount && km.soLuong > 0;
        const isInDateRange =
            thoiGianApDung <= currentDate && thoiGianHetHan >= currentDate;
        return isValid && isInDateRange;
    });
});

const totalAmount = computed(() => {
    return danhSachMonChon.value.reduce(
        (total, item) => total + item.soLuongThem * item.donGia,
        0
    );
});

const taxValue = computed(() => {
    return (totalAmount.value * 8) / 100;
});

const finalAmount = computed(() => {
    const total = parseInt(totalAmount.value, 10);
    const surchargeValue = parseInt(surcharge.value, 10);
    const tax = parseInt(taxValue.value, 10);
    const discount = parseInt(discountValue.value, 10);

    const finalAmountValue = total + surchargeValue + tax - discount;

    return finalAmountValue;
});

// Lọc món theo loại và tìm kiếm
const filteredMonAn = computed(() => {
    let filtered = danhSachMonAn.value;
    if (selectedLoaiMonAn.value !== "tat_ca") {
        filtered = filtered.filter((m) => m.maLoai === selectedLoaiMonAn.value);
    }
    if (searchTerm.value.trim()) {
        const term = searchTerm.value.trim().toLowerCase();
        filtered = filtered.filter((m) =>
            m.tenMonAn.toLowerCase().includes(term)
        );
    }
    return filtered;
});

// Món để hiển thị trang hiện tại
const pagedMonAn = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredMonAn.value.slice(start, start + itemsPerPage);
});

// Tổng số trang
const totalPages = computed(() =>
    Math.ceil(filteredMonAn.value.length / itemsPerPage)
);

// Thay đổi trang
const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
    }
};

// Thêm món vào giỏ
const addMonAn = (monAn) => {
    if (monAn.soLuongMonCon === 0) {
        Swal.fire("Thông báo", "Món ăn đã hết.", "warning");
        return;
    }

    const found = danhSachMonChon.value.find(
        (m) => m.maMonAn === monAn.maMonAn
    );
    if (found) {
        if (found.soLuongThem >= monAn.soLuongMonCon) {
            Swal.fire(
                "Thông báo",
                "Bạn đã chọn số lượng món tối đa.",
                "warning"
            );
            return;
        }
        found.soLuongThem++;
    } else {
        danhSachMonChon.value.push({ ...monAn, soLuongThem: 1 });
    }
};

// Xóa món khỏi giỏ
const removeMonAn = (maMonAn) => {
    danhSachMonChon.value = danhSachMonChon.value.filter(
        (m) => m.maMonAn !== maMonAn
    );
};

// Tăng/giảm số lượng món đã chọn
const changeSoLuong = (maMonAn, delta) => {
    const found = danhSachMonChon.value.find((m) => m.maMonAn === maMonAn);
    if (!found) return;

    if (delta > 0) {
        // Kiểm tra nếu số lượng hiện tại đã đạt tối đa
        if (found.soLuongThem >= found.soLuongMonCon) {
            Swal.fire(
                "Thông báo",
                "Bạn đã chọn số lượng món tối đa.",
                "warning"
            );
            return;
        }
        found.soLuongThem += delta;
    } else {
        // Giảm số lượng
        found.soLuongThem += delta;
        if (found.soLuongThem < 1) {
            Swal.fire({
                title: "Xác nhận",
                text: "Bạn có chắc muốn bỏ món này khỏi giỏ không?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Có",
                cancelButtonText: "Không",
            }).then((result) => {
                if (result.isConfirmed) {
                    danhSachMonChon.value = danhSachMonChon.value.filter(
                        (m) => m.maMonAn !== maMonAn
                    );
                } else {
                    found.soLuongThem = 1;
                }
            });
        }
    }
};

const cancelOrder = () => {
    danhSachMonChon.value = [];
    hoTen.value = "";
    sdt.value = "";
    taiKhoanChon.value = "";
    soLuongKhach.value = 1;
    ngaySuDung.value = "";
    gioSuDung.value = "";
    khuVucChon.value = "";
    banChon.value = "";
    khuyenMaiChon.value = "";
    ghiChu.value = "";
    surcharge.value = 0;
    discountValue.value = 0;
    selectedLoaiMonAn.value = "tat_ca";
    searchTerm.value = "";
    currentPage.value = 1;
};

//Kiểm tra soLuongThem
const checkQuantityBeforeSubmit = (cartItems) => {
    for (let item of cartItems) {
        if (item.soLuongThem > item.soLuongMonCon) {
            Swal.fire({
                title: "Lỗi số lượng!",
                text: `Món "${item.tenMonAn}" không còn đủ số lượng. Chỉ còn ${item.soLuongMonCon} món.`,
                icon: "error",
                confirmButtonText: "OK",
            });
            return false;
        }
    }
    return true;
};
//Hàm thêm hóa đơn
const saveOrder = async () => {
    const isQuantityValid = checkQuantityBeforeSubmit(danhSachMonChon.value);
    if (!isQuantityValid) return;

    console.log("reservationDate", ngaySuDung.value);
    console.log("reservationTỉe", gioSuDung.value);
    if (!ngaySuDung.value || !gioSuDung.value) {
        Swal.fire({
            title: "Lỗi!",
            text: "Vui lòng chọn ngày và giờ hợp lệ.",
            icon: "error",
            confirmButtonText: "OK",
        });
        return;
    }

    const formattedDateTime = ngaySuDung.value + " " + gioSuDung.value + ":00";

    console.log("timeeeeeeee", formattedDateTime);

    const isValidDate = (dateString) =>
        moment(dateString, "YYYY-MM-DD HH:mm:ss", true).isValid();

    if (!isValidDate(formattedDateTime)) {
        Swal.fire({
            title: "Lỗi!",
            text: "Định dạng thời gian không hợp lệ. Vui lòng kiểm tra lại.",
            icon: "error",
            confirmButtonText: "OK",
        });
        return;
    }

    const hoaDonData = {
        maTaiKhoan: taiKhoanChon.value,
        maBan: banChon.value,
        maKhuyenMai: khuyenMaiChon.value || null,
        hoTen: hoTen.value,
        sdt: sdt.value,
        email: taiKhoanDuocChon.value.email,
        soLuongKhach: soLuongKhach.value,
        note: ghiChu.value,
        tongTienMonAn: totalAmount.value,
        phuPhiKV: surcharge.value,
        tienGiam: discountValue.value,
        thue: taxValue.value,
        thanhTien: finalAmount.value,
        thoiGianSuDung: formattedDateTime,
        chiTietHoaDon: danhSachMonChon.value.map((item) => ({
            maMonAn: item.maMonAn,
            soLuong: item.soLuongThem,
        })),
    };

    try {
        const response = await adminAddHoaDon(hoaDonData);
        // In ra phản hồi từ API để kiểm tra
        console.log("API Response:", response);

        // Kiểm tra xem phản hồi có chứa maHoaDon không
        if (response && response.maHoaDon) {
            const maHoaDon = response.maHoaDon;
            console.log("Mã hóa đơn: ", maHoaDon);

            // Tiến hành các bước tiếp theo nếu có mã hóa đơn
            Swal.fire({
                title: "Thêm đơn đặt bàn thành công!",
                text: "Vui lòng duyệt đơn đặt bàn nhé.",
                icon: "success",
                confirmButtonText: "OK",
            }).then(() => {
                cancelOrder();
                router.push({
                    name: "LichDatBan",
                });
            });
        } else {
            Swal.fire({
                title: "Lỗi!",
                text: "Không nhận được mã hóa đơn. Vui lòng thử lại.",
                icon: "error",
                confirmButtonText: "OK",
            });
        }
    } catch (err) {
        console.error("Lỗi khi đặt bàn:", err);
        Swal.fire({
            title: "Lỗi!",
            text: "Đã xảy ra lỗi khi thêm hóa đơn, vui lòng thử lại.",
            icon: "error",
            confirmButtonText: "OK",
        });
    }
};

//Hàm giới hạn chọn ngày trong form
const minDate = computed(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth() + 1; // Tháng bắt đầu từ 0, nên cần cộng thêm 1
    const dd = today.getDate();

    return `${yyyy}-${mm < 10 ? "0" + mm : mm}-${dd < 10 ? "0" + dd : dd}`;
});

const maxDate = computed(() => {
    const today = new Date();
    today.setMonth(today.getMonth() + 1); // Thêm 1 tháng
    const yyyy = today.getFullYear();
    const mm = today.getMonth() + 1; // Tháng bắt đầu từ 0, nên cần cộng thêm 1
    const dd = today.getDate();

    return `${yyyy}-${mm < 10 ? "0" + mm : mm}-${dd < 10 ? "0" + dd : dd}`;
});

const loadData = async () => {
    const kv = await fetchKhuVuc();
    const hd = await fetchHoaDon();
    const b = await fetchBan();
    const km = await fetchKhuyenMai();
    const m = await fetchMonAn();
    const lm = await fetchLoaiMonAn();
    const tk = await fetchTaiKhoan();

    danhSachKhuVuc.value = kv;
    danhSachHoaDon.value = hd;
    danhSachBan.value = b;
    danhSachKhuyenMai.value = km;
    danhSachMonAn.value = m;
    danhSachLoaiMonAn.value = lm;
    danhSachTaiKhoan.value = tk;
};

onMounted(() => {
    loadData();
});

// Cập nhật danh sách bàn và giá trị phụ phí KV khi số lượng khách thay đổi
watch([khuVucChon, soLuongKhach], () => {
    console.log(
        "Selected Area or number of guests changed to: ",
        khuVucChon.value,
        soLuongKhach.value
    );
    const selected = danhSachKhuVuc.value.find(
        (khuVuc) => khuVuc.maKhuVuc === khuVucChon.value
    );

    surcharge.value = selected ? selected.phuPhi : 0;
    console.log("Surcharge updated:", surcharge.value);

    // Lọc bàn theo khu vực đã chọn
    banTheoKhuVuc.value = danhSachBan.value.filter(
        (ban) =>
            ban.maKhuVuc === khuVucChon.value &&
            ban.trangThai === "trong" &&
            ban.soLuongKhachToiDa >= soLuongKhach.value
    );
});

// cập nhật giá trị giảm giá khi thay đổi mã khuyến mãi
watch(khuyenMaiChon, (newDiscount) => {
    const discount = danhSachKhuyenMai.value.find(
        (d) => d.maKhuyenMai === newDiscount
    );

    if (discount) {
        discountValue.value = (totalAmount.value * discount.phanTram) / 100;
    } else {
        discountValue.value = 0;
    }
});

//cập nhật danh sách khuyến mãi khi giá trị tổng tiền thay đổi
watch(totalAmount, (newTotal) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    filteredDiscount.value = danhSachKhuyenMai.value.filter((km) => {
        const thoiGianApDung = new Date(km.thoiGianApDung);
        const thoiGianHetHan = new Date(km.thoiGianHetHan);

        const isValid = km.dieuKienApDung <= newTotal && km.soLuong > 0;
        const isInDateRange =
            thoiGianApDung <= currentDate && thoiGianHetHan >= currentDate;

        return isValid && isInDateRange;
    });
    console.log("Filtered Discounts:", filteredDiscount.value);
});

//cập nhật tên và số điện thoại khi chọn khách hàng
watch(taiKhoanChon, (newId) => {
    const customer = danhSachTaiKhoan.value.find(
        (tk) => tk.maTaiKhoan === newId
    );
    if (customer) {
        hoTen.value = customer.tenTaiKhoan;
        sdt.value = customer.SDT;
    } else {
        hoTen.value = "";
        sdt.value = "";
    }
});

watch([selectedLoaiMonAn, searchTerm], () => {
    currentPage.value = 1;
});
</script>

<template>
    <div class="page-container">
        <h3 class="title">Lịch đặt bàn</h3>
        <hr />
        <div class="top-bar">
            <button class="btn-back" @click="goBack">
                <i class="fas fa-chevron-left"></i>
                <span>Quay lại trang trước</span>
            </button>

            <div class="page-title">Thêm đơn đặt bàn mới</div>
        </div>

        <div class="form-container">
            <form @submit.prevent="submitForm" class="form-grid">
                <div>
                    <label>
                        <p>Khách hàng: <span class="required">(*)</span></p>
                        <select v-model.number="taiKhoanChon">
                            <option value="">--Chọn khách hàng--</option>
                            <option
                                v-for="kh in khachHangList"
                                :key="kh.maTaiKhoan"
                                :value="kh.maTaiKhoan"
                            >
                                {{ kh.email ? kh.email : kh.SDT }}
                            </option>
                        </select>
                    </label>
                    <button
                        type="button"
                        class="btn-add-new-customer"
                        @click="showModal = true"
                    >
                        + Thêm mới khách hàng
                    </button>
                </div>
                <div>
                    <label>
                        <p>
                            Họ tên khách hàng: <span class="required">(*)</span>
                        </p>
                        <input
                            v-model="hoTen"
                            type="text"
                            placeholder="Nhập họ và tên"
                        />
                    </label>
                </div>
                <div>
                    <label>
                        <p>Số điện thoại: <span class="required">(*)</span></p>
                        <input
                            v-model="sdt"
                            type="text"
                            placeholder="Nhập số điện thoại"
                        />
                    </label>
                </div>

                <div>
                    <label>
                        <p>Số lượng khách: <span class="required">(*)</span></p>
                        <input
                            v-model.number="soLuongKhach"
                            type="number"
                            min="1"
                            placeholder="Nhập số lượng khách"
                        />
                    </label>
                </div>
                <div>
                    <label>
                        <p>Ngày sử dụng: <span class="required">(*)</span></p>
                        <input
                            v-model="ngaySuDung"
                            :min="minDate"
                            :max="maxDate"
                            type="date"
                        />
                    </label>
                </div>
                <div>
                    <label>
                        <p>Giờ sử dụng: <span class="required">(*)</span></p>
                        <input
                            v-model="gioSuDung"
                            :min="'08:00'"
                            :max="'21:00'"
                            type="time"
                        />
                    </label>
                </div>
                <div>
                    <label>
                        <p>
                            Chọn khu vực bàn: <span class="required">(*)</span>
                        </p>
                        <select v-model.number="khuVucChon">
                            <option value="" disabled>
                                --Chọn khu vực bàn--
                            </option>
                            <option
                                v-for="kv in danhSachKhuVuc"
                                :key="kv.maKhuVuc"
                                :value="kv.maKhuVuc"
                            >
                                {{ kv.tenKhuVuc }}
                            </option>
                        </select>
                    </label>
                </div>
                <div>
                    <label>
                        <p>Chọn bàn: <span class="required">(*)</span></p>
                        <select
                            v-model.number="banChon"
                            :disabled="!khuVucChon"
                        >
                            <option value="" disabled>--Chọn bàn--</option>
                            <option
                                v-for="ban in banTheoKhuVuc"
                                :key="ban.maBan"
                                :value="ban.maBan"
                            >
                                Bàn số {{ ban.maBan }} - {{ ban.tenKhuVuc }} -
                                SL ghế: {{ ban.soLuongKhachToiDa }}
                            </option>
                        </select>
                        <small
                            >Danh sách các bàn còn trống theo khu vực đã
                            chọn</small
                        >
                    </label>
                </div>
                <div>
                    <label>
                        <p>Chọn mã giảm giá:</p>
                        <select v-model.number="khuyenMaiChon">
                            <option value="" disabled selected>
                                --Chọn mã giảm giá (nếu có)--
                            </option>
                            <option
                                v-for="km in filteredDiscount"
                                :key="km.maKhuyenMai"
                                :value="km.maKhuyenMai"
                            >
                                {{ km.tenKhuyenMai }}
                            </option>
                        </select>
                    </label>
                </div>
                <div class="full-width">
                    <label>
                        <p>Ghi chú:</p>
                        <textarea
                            v-model="ghiChu"
                            rows="3"
                            placeholder="Nhập ghi chú cho nhà hàng"
                        ></textarea>
                    </label>
                </div>
            </form>
        </div>

        <!-- phần chọn món ăn -->
        <div class="order-container">
            <div class="left-panel">
                <div class="filter-types">
                    <button
                        :class="{ active: selectedLoaiMonAn === 'tat_ca' }"
                        @click="selectedLoaiMonAn = 'tat_ca'"
                    >
                        Tất cả
                    </button>
                    <button
                        v-for="loai in danhSachLoaiMonAn"
                        :key="loai.maLoai"
                        :class="{ active: selectedLoaiMonAn === loai.maLoai }"
                        @click="selectedLoaiMonAn = loai.maLoai"
                    >
                        {{ loai.tenLoai }}
                    </button>
                </div>

                <div class="search-box">
                    <input
                        type="text"
                        v-model="searchTerm"
                        placeholder="Tìm kiếm món ăn"
                        autocomplete="off"
                    />
                    <i class="fas fa-search"></i>
                </div>

                <div class="mon-an-list">
                    <div
                        v-for="mon in pagedMonAn"
                        :key="mon.maMonAn"
                        class="mon-item"
                    >
                        <img
                            :src="getMainImage(mon.anhMonAn)"
                            alt="Ảnh món ăn"
                        />
                        <div class="info">
                            <h4>{{ mon.tenMonAn }}</h4>
                            <div class="price">
                                <span class="don-gia"
                                    >{{
                                        parseInt(mon.donGia).toLocaleString(
                                            "vi-VN"
                                        )
                                    }}đ</span
                                >
                                <span
                                    v-if="mon.giaGoc && mon.giaGoc > mon.donGia"
                                    class="gia-goc"
                                    >{{
                                        parseInt(mon.giaGoc).toLocaleString(
                                            "vi-VN"
                                        )
                                    }}đ</span
                                >
                            </div>
                            <div class="so-luong-con">
                                Số lượng còn:
                                <strong>{{ mon.soLuongMonCon }}</strong>
                            </div>
                        </div>
                        <button class="btn-add" @click="addMonAn(mon)">
                            +
                        </button>
                    </div>
                </div>

                <div class="pagination">
                    <button
                        :disabled="currentPage === 1"
                        @click="goToPage(currentPage - 1)"
                    >
                        &lt;
                    </button>
                    <span>{{ currentPage }} / {{ totalPages }}</span>
                    <button
                        :disabled="currentPage === totalPages"
                        @click="goToPage(currentPage + 1)"
                    >
                        &gt;
                    </button>
                </div>
            </div>

            <div class="right-panel">
                <table class="cart-table">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Món ăn</th>
                            <th>Số lượng</th>
                            <th>Thành tiền</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(mon, index) in danhSachMonChon"
                            :key="mon.maMonAn"
                        >
                            <td>{{ index + 1 }}</td>
                            <td class="mon-info">
                                <img
                                    :src="getMainImage(mon.anhMonAn)"
                                    alt="Ảnh món"
                                />
                                <div>
                                    <p class="ten-mon">{{ mon.tenMonAn }}</p>
                                    <p class="don-gia">
                                        {{
                                            parseInt(mon.donGia).toLocaleString(
                                                "vi-VN"
                                            )
                                        }}đ
                                    </p>
                                </div>
                            </td>
                            <td>
                                <div class="quantity-control">
                                    <button
                                        @click="changeSoLuong(mon.maMonAn, -1)"
                                    >
                                        -
                                    </button>
                                    <span>{{ mon.soLuongThem }}</span>
                                    <button
                                        @click="changeSoLuong(mon.maMonAn, 1)"
                                    >
                                        +
                                    </button>
                                </div>
                            </td>
                            <td>
                                {{
                                    (
                                        mon.soLuongThem * mon.donGia
                                    ).toLocaleString()
                                }}đ
                            </td>
                            <td>
                                <button
                                    class="btn-remove"
                                    @click="removeMonAn(mon.maMonAn)"
                                >
                                    ✕
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="summary">
                    <div>
                        <span>Tổng tiền:</span>
                        <span
                            >{{
                                parseInt(totalAmount).toLocaleString("vi-VN")
                            }}đ</span
                        >
                    </div>
                    <div>
                        <span>Giảm giá:</span>
                        <span
                            >{{
                                parseInt(discountValue).toLocaleString("vi-VN")
                            }}đ</span
                        >
                    </div>
                    <div>
                        <span>Phí KV:</span>
                        <span
                            >{{
                                parseInt(surcharge).toLocaleString("vi-VN")
                            }}đ</span
                        >
                    </div>
                    <div>
                        <span>Thuế (VAT 8%):</span>
                        <span
                            >{{
                                parseInt(taxValue).toLocaleString("vi-VN")
                            }}đ</span
                        >
                    </div>
                    <div class="final-amount">
                        <span>Thành tiền:</span>
                        <span
                            >{{
                                parseInt(finalAmount).toLocaleString("vi-VN")
                            }}đ</span
                        >
                    </div>
                </div>
            </div>
        </div>
        <div class="actions">
            <button class="btn-save" @click="saveOrder">ĐẶT BÀN</button>
            <button class="btn-cancel" @click="cancelOrder">HỦY</button>
        </div>
        <!-- Modal thêm khách hàng -->
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>THÊM KHÁCH HÀNG MỚI</h3>
                    <button class="close-btn" @click="closeModal">×</button>
                </div>

                <div class="modal-body">
                    <input
                        type="text"
                        v-model="newCustomerName"
                        placeholder="Nhập tên khách hàng"
                    />
                    <input
                        type="text"
                        v-model="newCustomerSDT"
                        placeholder="Nhập SĐT"
                    />
                </div>

                <div class="modal-footer">
                    <button class="btn-save" @click="saveNewCustomer">
                        LƯU
                    </button>
                    <button class="btn-cancel" @click="resetForm()">HỦY</button>
                </div>
            </div>
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

/* form nhập thông tin */
.form-container {
    background-color: var(--white-color);
    border: 1px solid var(--light-gray-color);
    box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    margin: 0 auto;
    padding: 20px 50px;
    font-size: 1.6rem;
    color: var(--black-color);
}
.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px 80px;
}
.full-width {
    grid-column: span 2;
}
label {
    display: flex;
    flex-direction: column;
    font-weight: 600;
    margin-bottom: 2px;
}
label p {
    margin-bottom: 10px;
}
input,
select,
textarea {
    padding: 6px 10px;
    font-size: 1.4rem;
    border: 1px solid var(--light-gray-color);
    border-radius: 4px;
    color: var(--black-color);
}
input:focus,
select:focus,
textarea:focus {
    outline: none;
    border-color: var(--blue-color);
}
.required {
    color: var(--red-color);
    margin-left: 2px;
}
small {
    color: var(--dark-gray-color);
    font-style: italic;
    margin-top: 5px;
    font-size: 1.2rem;
    font-weight: 400;
}

.btn-add-new-customer {
    margin-top: 6px;
    background: transparent;
    border: none;
    color: var(--blue-color);
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    font-size: 1.3rem;
    text-decoration: underline;
}
.btn-add-new-customer:hover {
    color: var(--dark-blue-color);
}

/* phần chọn món ăn */
.order-container {
    display: flex;
    gap: 20px;
    margin-top: 20px;
    font-size: 1.6rem;
    color: var(--black-color);
}

.left-panel,
.right-panel {
    background: var(--white-color);
    border: 1px solid var(--light-gray-color);
    border-radius: 8px;
    padding: 15px;
    box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.1);
    width: 100%;
    height: 100%;
    min-height: 560px;
}

.left-panel {
    width: 1500px;
    display: flex;
    flex-direction: column;
}

.filter-types {
    margin-bottom: 10px;
}

.filter-types button {
    margin-right: 8px;
    margin-bottom: 8px;
    padding: 5px 10px;
    font-weight: 600;
    cursor: pointer;
    background: #eee;
    border: none;
    border-radius: 5px;
    transition: background 0.3s;
    font-size: 1.4rem;
    text-transform: uppercase;
}

.filter-types button.active,
.filter-types button:hover {
    background: var(--dark-blue-color);
}

.search-box {
    position: relative;
    margin-bottom: 10px;
}

.search-box input {
    width: 100%;
    padding: 10px 35px 10px 10px;
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

.mon-an-list {
    max-height: 420px;
    overflow-y: auto;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
}

.mon-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 6px;
    border-bottom: 1px solid #eee;
}

.mon-item img {
    width: 70px;
    height: 50px;
    object-fit: cover;
    border-radius: 5px;
}

.mon-item .info {
    flex-grow: 1;
}

.mon-item h4 {
    margin: 0 0 4px;
    font-weight: 600;
}

.price {
    display: flex;
    gap: 10px;
    align-items: center;
    font-size: 1.2rem;
}

.don-gia {
    font-weight: 700;
    color: #1976d2;
}

.gia-goc {
    text-decoration: line-through;
    color: #888;
    font-size: 1rem;
}
.so-luong-con {
    font-size: 1.2rem;
    color: #d32f2f;
    margin-top: 4px;
}

.btn-add {
    font-size: 1.6rem;
    font-weight: 700;
    cursor: pointer;
    background: var(--dark-blue-color);
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    line-height: 26px;
    text-align: center;
    user-select: none;
}

.cart-table {
    width: 100%;
    height: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
}

.cart-table th,
.cart-table td {
    border: 1px solid #ddd;
    padding: 8px;
    font-size: 1.2rem;
    text-align: center;
    vertical-align: middle;
}

.cart-table th:nth-child(2),
.cart-table td:nth-child(2) {
    text-align: left;
}

td > div.quantity-control {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

td > div.quantity-control button {
    width: 20px;
    height: 20px;
    font-weight: bold;
    font-size: 1.2rem;
    border: 1px solid #ccc;
    background-color: #f0f0f0;
    color: #333;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

td > div.quantity-control button:hover {
    background-color: #d0d0d0;
}

.mon-info {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: flex-start;
}

.mon-info img {
    width: 50px;
    height: 40px;
    object-fit: cover;
    border-radius: 5px;
    flex-shrink: 0;
}

.ten-mon {
    font-weight: 600;
    margin-bottom: 3px;
}

.btn-remove {
    background: transparent;
    border: none;
    color: #d32f2f;
    font-size: 1.4rem;
    cursor: pointer;
    font-weight: 600;
}

.summary {
    font-size: 1.4rem;
    margin-bottom: 20px;
    text-align: right;
}

.summary > div {
    margin-left: 200px;
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
}

.final-amount {
    font-weight: 700;
    font-size: 1.4rem;
    color: #d32f2f;
}

.actions {
    display: flex;
    justify-content: center;
    gap: 15px;
    padding-top: 20px;
}

.btn-save,
.btn-payment,
.btn-cancel {
    padding: 8px 15px;
    font-weight: 600;
    font-size: 1.3rem;
    border-radius: 5px;
    cursor: pointer;
    border: none;
    min-width: 100px;
}

.btn-payment {
    background-color: var(--dark-blue-color);
    color: #444;
}

.btn-payment:hover {
    background-color: #a0b6c2;
}

.btn-cancel {
    background-color: #e0e0e0;
    color: #444;
}

.btn-cancel:hover {
    background-color: #bdbdbd;
}
.btn-save {
    background-color: var(--dark-blue-color);
    color: #444;
}

.btn-save:hover {
    background-color: #a0b6c2;
}

/* phần trang */
.pagination {
    margin-top: 10px;
    text-align: center;
}

.pagination button {
    background-color: var(--dark-blue-color);
    color: white;
    border: none;
    padding: 5px 12px;
    margin: 0 5px;
    border-radius: 5px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.pagination button:disabled {
    background-color: var(--light-gray-color);
    cursor: not-allowed;
}

.pagination span {
    font-weight: 600;
    font-size: 1.2rem;
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
        margin-bottom: 20px;
    }

    .btn-back {
        font-size: 1.2rem;
    }

    .page-title {
        font-size: 1.5rem;
    }

    .form-container {
        padding: 15px 30px;
        font-size: 1.4rem;
    }

    .form-grid {
        grid-template-columns: 1fr;
        gap: 15px 0;
    }

    .order-container {
        flex-direction: column;
    }

    .left-panel,
    .right-panel {
        width: 100%;
        min-height: auto;
        padding: 12px;
    }

    .filter-types button {
        font-size: 1.2rem;
        padding: 4px 8px;
    }

    .search-box input {
        font-size: 1.2rem;
        padding: 8px 30px 8px 10px;
    }

    .mon-an-list {
        max-height: 320px;
    }

    .mon-item img {
        width: 60px;
        height: 45px;
    }

    .mon-item h4 {
        font-size: 1.3rem;
    }

    .price {
        font-size: 1rem;
    }

    .so-luong-con {
        font-size: 1rem;
    }

    .btn-add {
        width: 28px;
        height: 28px;
        font-size: 1.4rem;
    }

    .cart-table th,
    .cart-table td {
        font-size: 1.1rem;
        padding: 6px 8px;
    }

    .mon-info img {
        width: 40px;
        height: 32px;
    }

    .ten-mon {
        font-size: 1.2rem;
    }

    .quantity-control button {
        width: 18px;
        height: 18px;
        font-size: 1rem;
    }

    .summary {
        font-size: 1.2rem;
    }

    .summary > div {
        margin-left: 100px;
    }

    .btn-save,
    .btn-payment,
    .btn-cancel {
        font-size: 1.2rem;
        padding: 6px 12px;
        min-width: 90px;
    }

    .pagination {
        margin-top: 15px;
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
        margin-bottom: 12px;
    }

    .top-bar {
        flex-direction: column;
        gap: 10px;
    }

    .btn-back {
        font-size: 1rem;
    }

    .page-title {
        font-size: 1.3rem;
        text-align: center;
    }

    .form-container {
        padding: 15px 15px;
        font-size: 1.2rem;
    }

    .form-grid {
        grid-template-columns: 1fr;
        gap: 15px 0;
    }

    label p {
        font-size: 1rem;
    }

    input,
    select,
    textarea {
        font-size: 1rem;
        padding: 8px 10px;
    }

    .order-container {
        flex-direction: column;
    }

    .left-panel,
    .right-panel {
        width: 100%;
        min-height: auto;
        padding: 10px;
    }

    .filter-types button {
        font-size: 1rem;
        padding: 4px 8px;
        margin-bottom: 6px;
    }

    .search-box input {
        font-size: 1rem;
        padding: 8px 35px 8px 10px;
    }

    .mon-an-list {
        max-height: 250px;
    }

    .mon-item img {
        width: 50px;
        height: 38px;
    }

    .mon-item h4 {
        font-size: 1.1rem;
    }

    .price {
        font-size: 0.9rem;
    }

    .so-luong-con {
        font-size: 0.9rem;
    }

    .btn-add {
        width: 26px;
        height: 26px;
        font-size: 1.3rem;
    }

    .cart-table th,
    .cart-table td {
        font-size: 1rem;
        padding: 5px 6px;
    }

    .mon-info img {
        width: 36px;
        height: 28px;
    }

    .ten-mon {
        font-size: 1rem;
    }

    .quantity-control button {
        width: 16px;
        height: 16px;
        font-size: 0.9rem;
    }

    .summary {
        font-size: 1rem;
    }

    .summary > div {
        margin-left: 0;
        flex-direction: column;
        gap: 6px;
    }

    .final-amount {
        font-size: 1.2rem;
    }

    .actions {
        flex-direction: column;
        gap: 12px;
    }

    .btn-save,
    .btn-payment,
    .btn-cancel {
        font-size: 1.1rem;
        padding: 10px 0;
        width: 100%;
        min-width: unset;
    }

    .pagination {
        margin-top: 20px;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
    }

    .pagination button {
        font-size: 1rem;
        padding: 8px 12px;
        min-width: 36px;
    }
}

/* modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.modal-container {
    background: white;
    width: 500px;
    border-radius: 6px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #ddd;
    padding: 25px 30px;
    font-weight: 700;
    font-size: 1.8rem;
    text-transform: uppercase;
}

.close-btn {
    font-size: 2.6rem;
    background: transparent;
    border: none;
    cursor: pointer;
    line-height: 1;
}

.close-btn:hover {
    color: var(--red-color);
}

.modal-body {
    padding: 30px;
    display: flex;
    flex-direction: column;
    gap: 25px;
}

.modal-body input {
    padding: 10px 20px;
    font-size: 1.6rem;
    border-radius: 4px;
    border: 1px solid #ccc;
}

.modal-footer {
    padding: 15px 20px;
    display: flex;
    justify-content: center;
    gap: 15px;
    background: #f5f5f5;
}

.btn-save {
    padding: 8px 20px;
    background-color: var(--dark-blue-color);
    color: var(--black-color);
    font-weight: 600;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.btn-cancel {
    padding: 8px 20px;
    background-color: #ddd;
    font-weight: 600;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
</style>
