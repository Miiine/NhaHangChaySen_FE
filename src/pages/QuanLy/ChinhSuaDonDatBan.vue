<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import moment from "moment";
import { fetchHoaDon, updateHoaDon } from "@/services/hoadon";
import { fetchMonAn } from "@/services/monan";
import { fetchLoaiMonAn } from "@/services/loaimonan";
import { fetchKhuVuc } from "@/services/khuvuc";
import { fetchKhuyenMai } from "@/services/khuyenmai";
import { fetchBan } from "@/services/ban";

const route = useRoute();
const router = useRouter();

const maHoaDonNumber = Number(route.params.maHoaDon);
const thisHoaDon = ref([]);
const chiTietHoaDon = ref([]);

const danhSachMonAn = ref([]);
const danhSachLoaiMonAn = ref([]);
const danhSachKhuVuc = ref([]);
const danhSachKhuyenMai = ref([]);
const danhSachBan = ref([]);
const danhSachHoaDon = ref([]);

const form = ref({
    soLuongKhach: 0,
    maKhuVuc: "",
    maBan: "",
    maKhuyenMai: "",
    note: "",
});

const danhSachMonChon = ref([]);
const soLuongThem = ref(0);
const surcharge = ref(0);
const discountValue = ref(0);
const ngaySuDung = ref("");
const gioSuDung = ref("");

const totalAmount = computed(() => {
    return danhSachMonChon.value.reduce((sum, item) => {
        return sum + Number(item.donGia) * Number(item.soLuongThem);
    }, 0);
});
const taxValue = computed(() => {
    return totalAmount.value * 0.08;
});
const finalAmount = computed(() => {
    return (
        Number(totalAmount.value) +
        Number(surcharge.value) +
        Number(taxValue.value) -
        Number(discountValue.value)
    );
});

// Lọc và phân trang
const selectedLoaiMonAn = ref("tat_ca");
const searchTerm = ref("");
const currentPage = ref(1);
const itemsPerPage = 5;

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

const minDate = computed(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth() + 1; // tháng 1-12
    const dd = today.getDate();

    return `${yyyy}-${mm < 10 ? "0" + mm : mm}-${dd < 10 ? "0" + dd : dd}`;
});

const maxDate = computed(() => {
    const today = new Date();
    // Thêm 1 tháng
    today.setMonth(today.getMonth() + 1);

    const yyyy = today.getFullYear();
    const mm = today.getMonth() + 1; // cộng 1 tháng
    const dd = today.getDate();

    return `${yyyy}-${mm < 10 ? "0" + mm : mm}-${dd < 10 ? "0" + dd : dd}`;
});

//logic hiển thị nút
// const trangThai = computed(() => thisHoaDon.value?.trangThai || "");
// const trangThaiBan = computed(() => thisHoaDon.value?.trangThaiBan || "");
// const trangThaiTT = computed(() => thisHoaDon.value?.trangThaiTT || "");
// const daThanhToanNum = computed(
//     () => Number(thisHoaDon.value?.daThanhToan) || 0
// );
// const thanhTienNum = computed(() => Number(thisHoaDon.value?.thanhTien) || 0);

// // Nút Xác nhận (trạng thái 'cho_duyet')
// const showXacNhanBtn = computed(() => trangThai.value === "cho_duyet");

// // Nút Khách nhận bàn (trạng thái 'da_duyet' và trạng thái bàn 'trong')
// const showKhachNhanBanBtn = computed(
//     () => trangThai.value === "da_duyet" && trangThaiBan.value === "trong"
// );

// // Nút Hoàn thành (trạng thái 'da_duyet', trạng thái bàn 'dang_phuc_vu', thanh toán toàn bộ và đã thanh toán đủ)
// const showHoanThanhBtn = computed(
//     () =>
//         trangThai.value === "da_duyet" &&
//         trangThaiBan.value === "dang_phuc_vu" &&
//         trangThaiTT.value === "toan_bo" &&
//         daThanhToanNum.value === thanhTienNum.value
// );

// // Nút Thanh toán hiển thị khi đơn đã duyệt, bàn đang phục vụ, và với 'toan_bo' khách chưa thanh toán đủ, còn 'coc' hoặc 'tt_sau' luôn hiển thị.
// const showThanhToanBtn = computed(() => {
//     if (
//         trangThai.value !== "da_duyet" ||
//         trangThaiBan.value !== "dang_phuc_vu"
//     ) {
//         return false;
//     }
//     if (trangThaiTT.value === "toan_bo") {
//         // Với 'toan_bo' phải kiểm tra số tiền đã thanh toán
//         return daThanhToanNum.value !== thanhTienNum.value;
//     }
//     // Với 'coc' hoặc 'tt_sau' thì luôn hiển thị nút thanh toán
//     return ["coc", "tt_sau"].includes(trangThaiTT.value);
// });

// const handleXacNhan = () => {
//     Swal.fire("Xác nhận", "Bạn đã xác nhận đơn đặt bàn.", "success");
//     // Thêm logic xác nhận đơn...
// };

// const handleKhachNhanBan = () => {
//     Swal.fire("Khách nhận bàn", "Khách đã nhận bàn.", "success");
//     // Thêm logic cập nhật trạng thái bàn...
// };

// const handleHoanThanh = () => {
//     Swal.fire("Hoàn thành", "Đơn hàng đã hoàn thành.", "success");
//     // Thêm logic hoàn thành đơn...
// };

// const handleThanhToan = () => {
//     Swal.fire("Thanh toán", "Đơn hàng đã thanh toán.", "success");
//     // Thêm logic thanh toán đơn...
// };

//phần món ăn
const filteredMonAn = computed(() => {
    let list = danhSachMonAn.value || [];

    // Lọc theo loại món ăn
    if (selectedLoaiMonAn.value !== "tat_ca") {
        list = list.filter((m) => m.maLoai === selectedLoaiMonAn.value);
    }

    // Lọc theo từ khóa tìm kiếm (kiểu ignore-case)
    if (searchTerm.value.trim() !== "") {
        const term = searchTerm.value.trim().toLowerCase();
        list = list.filter((m) => m.tenMonAn.toLowerCase().includes(term));
    }

    return list;
});

const totalPages = computed(() => {
    return Math.ceil(filteredMonAn.value.length / itemsPerPage) || 1;
});

const pagedMonAn = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredMonAn.value.slice(start, start + itemsPerPage);
});

const goToPage = (page) => {
    if (page < 1) page = 1;
    else if (page > totalPages.value) page = totalPages.value;
    currentPage.value = page;
};

const addMonAn = (mon) => {
    if (mon.soLuongMonCon === 0) {
        Swal.fire(
            "Thông báo",
            "Món này hiện đang hết hàng, không thể thêm.",
            "warning"
        );
        return;
    }

    const index = danhSachMonChon.value.findIndex(
        (item) => item.maMonAn === mon.maMonAn
    );
    if (index !== -1) {
        const selectedItem = danhSachMonChon.value[index];
        if (selectedItem.soLuongThem >= mon.soLuongMonCon) {
            Swal.fire(
                "Thông báo",
                "Bạn đã chọn số lượng tối đa món này.",
                "info"
            );
            return;
        }
        danhSachMonChon.value[index].soLuongThem += 1;
    } else {
        danhSachMonChon.value.push({
            ...mon,
            soLuongThem: 1,
        });
    }
};

const changeSoLuong = (maMonAn, delta) => {
    const index = danhSachMonChon.value.findIndex(
        (item) => item.maMonAn === maMonAn
    );
    if (index === -1) return;

    const item = danhSachMonChon.value[index];

    if (delta === -1) {
        if (item.soLuongThem === 1) {
            // Hỏi confirm xóa món
            Swal.fire({
                title: "Xóa món",
                text: `Bạn có muốn xóa món "${item.tenMonAn}" khỏi giỏ không?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Có",
                cancelButtonText: "Không",
            }).then((result) => {
                if (result.isConfirmed) {
                    danhSachMonChon.value.splice(index, 1);
                }
                // Nếu không xác nhận thì giữ nguyên số lượng 1
            });
        } else if (item.soLuongThem > 1) {
            danhSachMonChon.value[index].soLuongThem -= 1;
        }
    } else if (delta === 1) {
        if (item.soLuongThem >= item.soLuongMonCon) {
            Swal.fire(
                "Thông báo",
                "Bạn đã chọn số lượng tối đa món này.",
                "info"
            );
            return;
        }
        danhSachMonChon.value[index].soLuongThem += 1;
    }
};

const removeMonAn = (maMonAn) => {
    const index = danhSachMonChon.value.findIndex(
        (item) => item.maMonAn === maMonAn
    );
    if (index === -1) return;

    const tenMon = danhSachMonChon.value[index].tenMonAn;

    Swal.fire({
        title: "Xóa món",
        text: `Bạn có chắc chắn muốn xóa món "${tenMon}" khỏi giỏ không?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Có",
        cancelButtonText: "Không",
    }).then((result) => {
        if (result.isConfirmed) {
            danhSachMonChon.value.splice(index, 1);
            Swal.fire("Đã xóa!", "Món đã được xóa khỏi giỏ.", "success");
        }
    });
};

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

// Lọc bàn theo khu vực và trạng thái "trong"
const reservedTableIds = computed(() => {
    if (!ngaySuDung.value) return [];

    return danhSachHoaDon.value
        .filter((hd) => {
            const hdDate = moment(hd.thoiGianSuDung).format("YYYY-MM-DD");
            // Lọc các hóa đơn cùng ngày, trạng thái "cho_duyet" hoặc "da_duyet"
            // Loại trừ hóa đơn hiện tại (dựa vào mã hóa đơn)
            return (
                hdDate === ngaySuDung.value &&
                ["cho_duyet", "da_duyet"].includes(hd.trangThai) &&
                Number(hd.maHoaDon) !== maHoaDonNumber // Loại trừ hóa đơn hiện tại
            );
        })
        .map((hd) => hd.maBan);
});

const banTheoKhuVuc = computed(() => {
    return danhSachBan.value.filter(
        (ban) =>
            ban.maKhuVuc === form.value.maKhuVuc &&
            // ban.trangThai === "trong" &&
            ban.soLuongKhachToiDa >= form.value.soLuongKhach &&
            !reservedTableIds.value.includes(ban.maBan)
    );
});

//hiển thị phần loại bàn theo bàn được chọn
const loaiBanTheoMaBan = computed(() => {
    if (!form.value.maBan) {
        // Nếu chưa chọn bàn thì trả về null hoặc lấy từ thisHoaDon
        return {
            tenLoai: thisHoaDon.value.tenLoai || "-",
            soLuongKhachToiDa: thisHoaDon.value.soLuongKhachToiDa || 0,
        };
    }
    const ban = danhSachBan.value.find((b) => b.maBan === form.value.maBan);
    if (!ban) {
        return {
            tenLoai: thisHoaDon.value.tenLoai || "-",
            soLuongKhachToiDa: thisHoaDon.value.soLuongKhachToiDa || 0,
        };
    }
    return {
        tenLoai: ban.tenLoai || "-",
        soLuongKhachToiDa: ban.soLuongKhachToiDa || 0,
    };
});

//hiển thị phần trăm và điều kiện áp dụng theo khuyến mãi được chọn
const khuyenMaiChon = computed(() => {
    if (!form.value.maKhuyenMai) {
        // Nếu chưa chọn km thì lấy từ hóa đơn hiện tại (thisHoaDon)
        return {
            phanTram: thisHoaDon.value.phanTram || 0,
            dieuKienApDung: thisHoaDon.value.dieuKienApDung || 0,
        };
    }
    // Tìm km trong danh sách km theo mã
    const km = danhSachKhuyenMai.value.find(
        (km) => km.maKhuyenMai === form.value.maKhuyenMai
    );
    if (!km) {
        // Nếu không tìm thấy thì trả về dữ liệu cũ
        return {
            phanTram: thisHoaDon.value.phanTram || 0,
            dieuKienApDung: thisHoaDon.value.dieuKienApDung || 0,
        };
    }
    // Trả về thông tin km tìm được
    return {
        phanTram: km.phanTram || 0,
        dieuKienApDung: km.dieuKienApDung || 0,
    };
});

//hàm reset
const handleReset = () => {
    if (!thisHoaDon.value) return;

    form.value.soLuongKhach = thisHoaDon.value.soLuongKhach || 0;
    form.value.maKhuVuc = thisHoaDon.value.maKhuVuc || "";
    form.value.maBan = thisHoaDon.value.maBan || "";
    form.value.maKhuyenMai = thisHoaDon.value.maKhuyenMai || "";
    form.value.note = hd.note || "";

    discountValue.value = thisHoaDon.value.tienGiam || 0;
    surcharge.value = thisHoaDon.value.phuPhiKV || 0;

    if (thisHoaDon.value.thoiGianSuDung) {
        const m = moment(thisHoaDon.value.thoiGianSuDung);
        ngaySuDung.value = m.format("YYYY-MM-DD");
        gioSuDung.value = m.format("HH:mm");
    } else {
        ngaySuDung.value = "";
        gioSuDung.value = "";
    }

    danhSachMonChon.value = (thisHoaDon.value.chiTietHoaDon || []).map(
        (item) => {
            const monAnInfo = danhSachMonAn.value.find(
                (m) => m.maMonAn === item.maMonAn
            );
            return {
                ...monAnInfo,
                soLuongThem: item.soLuong,
            };
        }
    );
};

//cập nhật hóa đơn
const isLoading = ref(false);

const handleUpdateHoaDon = async () => {
    if (!thisHoaDon.value || !thisHoaDon.value.maHoaDon) {
        Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Không có hóa đơn để cập nhật",
        });
        return;
    }

    isLoading.value = true;

    // Chuẩn bị dữ liệu gửi lên backend
    const hoaDonData = {
        maBan: form.value.maBan,
        maKhuyenMai: form.value.maKhuyenMai,
        soLuongKhach: form.value.soLuongKhach,
        note: form.value.note,
        tongTienMonAn: totalAmount.value,
        phuPhiKV: surcharge.value,
        tienGiam: discountValue.value,
        thue: taxValue.value,
        thanhTien: finalAmount.value,
        thoiGianSuDung:
            ngaySuDung.value && gioSuDung.value
                ? `${ngaySuDung.value} ${gioSuDung.value}:00`
                : null,
        chiTietHoaDon: danhSachMonChon.value.map((item) => ({
            maMonAn: item.maMonAn,
            soLuong: item.soLuongThem,
        })),
    };

    try {
        const res = await updateHoaDon(thisHoaDon.value.maHoaDon, hoaDonData);
        await Swal.fire({
            icon: "success",
            title: "Thành công",
            text: res.message || "Cập nhật hóa đơn thành công",
        });
    } catch (error) {
        console.error("Lỗi cập nhật hóa đơn:", error);
        await Swal.fire({
            icon: "error",
            title: "Lỗi",
            text:
                error.response?.data?.message ||
                "Có lỗi xảy ra khi cập nhật hóa đơn. Vui lòng thử lại.",
        });
    } finally {
        isLoading.value = false;
    }
};

const loadData = async () => {
    try {
        const [kv, b, km, m, lm, dsHoaDon] = await Promise.all([
            fetchKhuVuc(),
            fetchBan(),
            fetchKhuyenMai(),
            fetchMonAn(),
            fetchLoaiMonAn(),
            fetchHoaDon(),
        ]);

        danhSachKhuVuc.value = kv;
        danhSachBan.value = b;
        danhSachKhuyenMai.value = km;
        danhSachMonAn.value = m;
        danhSachLoaiMonAn.value = lm;
        danhSachHoaDon.value = dsHoaDon;

        const hd = dsHoaDon.find((h) => Number(h.maHoaDon) === maHoaDonNumber);
        if (hd) {
            thisHoaDon.value = hd;
            chiTietHoaDon.value = hd.chiTietHoaDon || [];

            form.value.soLuongKhach = hd.soLuongKhach || 0;
            form.value.maKhuVuc = hd.maKhuVuc || "";
            form.value.maBan = hd.maBan || "";
            form.value.maKhuyenMai = hd.maKhuyenMai || "";
            form.value.note = hd.note || "";
            totalAmount.value = hd.tongTienMonAn || 0;
            taxValue.value = hd.thue || 0;
            discountValue.value = hd.tienGiam || 0;
            surcharge.value = hd.phuPhiKV || 0;
            finalAmount.value = hd.thanhTien || 0;

            if (hd.thoiGianSuDung) {
                const m = moment(hd.thoiGianSuDung);
                ngaySuDung.value = m.format("YYYY-MM-DD");
                gioSuDung.value = m.format("HH:mm");
            } else {
                ngaySuDung.value = "";
                gioSuDung.value = "";
            }

            danhSachMonChon.value = chiTietHoaDon.value.map((item) => {
                const monAnInfo = danhSachMonAn.value.find(
                    (m) => m.maMonAn === item.maMonAn
                );
                return {
                    ...monAnInfo,
                    soLuongThem: item.soLuong,
                };
            });
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

const initialized = ref(false);

//Cập nhật list bàn khi ngày sử dụng, khu vực và sl khách thay đổi
watch(
    () => [form.value.maKhuVuc, form.value.soLuongKhach, ngaySuDung.value],
    ([newKhuVuc, newSoLuongKhach, newNgaySuDung]) => {
        // Bỏ qua lần chạy đầu tiên khi component mới mounted và dữ liệu load
        if (!initialized.value) {
            initialized.value = true;
            return;
        }

        // Tìm bàn hợp lệ với khu vực và số lượng khách
        const validBan = danhSachBan.value.find((ban) => {
            if (ban.maKhuVuc !== newKhuVuc) return false;
            if (ban.soLuongKhachToiDa < newSoLuongKhach) return false;
            if (newNgaySuDung) {
                const isReserved = danhSachHoaDon.value.some((hd) => {
                    const hdDate = moment(hd.thoiGianSuDung).format(
                        "YYYY-MM-DD"
                    );
                    return (
                        hd.maBan === ban.maBan &&
                        hdDate === newNgaySuDung &&
                        ["cho_duyet", "da_duyet"].includes(hd.trangThai)
                    );
                });
                if (isReserved) return false;
            }
            return true;
        });

        // Nếu bàn hiện tại không hợp lệ thì reset
        if (!validBan || validBan.maBan !== form.value.maBan) {
            form.value.maBan = "";
        }
    }
);

// Watch để theo dõi khi khu vực thay đổi, cập nhật lại phụ phí
watch(
    () => form.value.maKhuVuc,
    (newMaKhuVuc, oldMaKhuVuc) => {
        if (!newMaKhuVuc) {
            surcharge.value = 0;
            return;
        }

        // Tìm khu vực tương ứng
        const kv = danhSachKhuVuc.value.find(
            (kv) => kv.maKhuVuc === newMaKhuVuc
        );
        if (kv) {
            surcharge.value = kv.phuPhi || 0;
        } else {
            surcharge.value = 0;
        }
    }
);

//cập nhật giá trị khuyến mãi
watch(
    [() => khuyenMaiChon.value.phanTram, totalAmount],
    ([newPhanTram, newTotal]) => {
        // Nếu chưa chọn khuyến mãi (phần trăm = 0 hoặc bằng phần trăm của hóa đơn cũ), giữ nguyên giá trị cũ
        if (!form.value.maKhuyenMai) {
            discountValue.value = thisHoaDon.value.tienGiam || 0;
        } else {
            // Tính tiền giảm theo phần trăm và tổng tiền món ăn
            discountValue.value = (newTotal * newPhanTram) / 100;
        }
    },
    { immediate: true }
);
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

            <div class="page-title">Chỉnh sửa thông tin đơn đặt bàn</div>
        </div>

        <section class="info-section">
            <h4>Thông tin đơn hàng</h4>
            <div class="info-grid">
                <div><b>Mã hóa đơn:</b> {{ thisHoaDon.maHoaDon || "-" }}</div>
                <div>
                    <b>Nhân viên duyệt:</b>
                    {{ thisHoaDon.nhanVienDuyet || "Nhân viên trực 1" }}
                </div>
                <!-- <div>
                    <b>Thời gian sử dụng:</b>
                    {{ formatDateTime(thisHoaDon.thoiGianSuDung) }}
                </div> -->
                <div>
                    <b>Ngày sử dụng:</b>
                    <input
                        type="date"
                        :min="minDate"
                        :max="maxDate"
                        v-model="ngaySuDung"
                        :disabled="!!thisHoaDon.thoiGianNhanBan"
                    />
                </div>
                <div>
                    <b>Giờ sử dụng:</b>
                    <input
                        type="time"
                        v-model="gioSuDung"
                        min="08:00"
                        max="21:00"
                        :disabled="!!thisHoaDon.thoiGianNhanBan"
                    />
                </div>

                <div>
                    <b>Thời gian khách ra:</b>
                    {{ formatDateTime(thisHoaDon.thoiGianHoanThanh) }}
                </div>
                <div>
                    <b>Thời gian khách vào:</b>
                    {{ formatDateTime(thisHoaDon.thoiGianNhanBan) }}
                </div>
                <!-- <div>
                    <b>Số lượng khách:</b>
                    {{ thisHoaDon.soLuongKhach || "-" }}
                </div> -->
                <div>
                    <b>Số lượng khách: </b>
                    <input
                        type="number"
                        v-model.number="form.soLuongKhach"
                        min="1"
                        :max="thisHoaDon.soLuongKhachToiDa || 20"
                        style="
                            width: 80px;
                            padding: 4px;
                            font-size: 1.6rem;
                            color: var(--black-color);
                        "
                        :disabled="!!thisHoaDon.thoiGianNhanBan"
                    />
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
                    <b>Ghi chú:</b>
                    <textarea
                        v-model="form.note"
                        rows="3"
                        style="
                            width: 100%;
                            font-size: 1.6rem;
                            padding: 6px;
                            color: var(--black-color);
                        "
                        :disabled="!!thisHoaDon.thoiGianNhanBan"
                        placeholder="Nhập ghi chú cho đơn hàng..."
                    ></textarea>
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
                <!-- <div><b>Khu vực:</b> {{ thisHoaDon.tenKhuVuc || "-" }}</div> -->
                <div>
                    <b>Khu vực: </b>
                    <select
                        v-model="form.maKhuVuc"
                        style="
                            font-size: 1.6rem;
                            padding: 4px;
                            color: var(--black-color);
                        "
                    >
                        <option disabled value="">Chọn khu vực</option>
                        <option
                            v-for="kv in danhSachKhuVuc"
                            :key="kv.maKhuVuc"
                            :value="kv.maKhuVuc"
                        >
                            {{ kv.tenKhuVuc }}
                        </option>
                    </select>
                </div>
                <!-- <div><b>Bàn:</b> {{ thisHoaDon.maBan || "-" }}</div> -->
                <div>
                    <b>Bàn: </b>
                    <select
                        v-model="form.maBan"
                        style="
                            font-size: 1.6rem;
                            padding: 4px;
                            color: var(--black-color);
                        "
                    >
                        <option disabled value="">Chọn bàn</option>
                        <option
                            v-for="ban in banTheoKhuVuc"
                            :key="ban.maBan"
                            :value="ban.maBan"
                        >
                            Bàn {{ ban.maBan }} - SL ghế:
                            {{ ban.soLuongKhachToiDa }}
                        </option>
                    </select>
                </div>

                <div>
                    <b>Loại bàn:</b>
                    Bàn {{ loaiBanTheoMaBan.tenLoai }} - tối đa
                    {{ loaiBanTheoMaBan.soLuongKhachToiDa }} người
                </div>
            </div>
        </section>

        <section class="info-section">
            <h4>Khuyến mãi</h4>
            <div class="info-grid">
                <!-- <div>
                    <b>Khuyến mãi:</b> {{ thisHoaDon.tenKhuyenMai || "-" }}
                </div> -->
                <div>
                    <b>Khuyến mãi: </b>
                    <select
                        v-model="form.maKhuyenMai"
                        style="font-size: 1.6rem; padding: 4px"
                    >
                        <option value="">Chọn khuyến mãi</option>
                        <option
                            v-for="km in filteredDiscount"
                            :key="km.maKhuyenMai"
                            :value="km.maKhuyenMai"
                        >
                            {{ km.tenKhuyenMai }}
                        </option>
                    </select>
                </div>

                <div>
                    <b>Phần trăm:</b> {{ khuyenMaiChon.phanTram || "0" }}%
                </div>
                <div>
                    <b>Điều kiện áp dụng: Hóa đơn trên </b>
                    {{ formatCurrency(khuyenMaiChon.dieuKienApDung) || "0" }}
                </div>
            </div>
        </section>

        <section class="info-section">
            <h4>Chi tiết hóa đơn</h4>
            <!-- <div class="table-summary-container">
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
            </div> -->
            <div class="order-container">
                <div class="left-panel">
                    <!-- Nút lọc loại món -->
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
                            :class="{
                                active: selectedLoaiMonAn === loai.maLoai,
                            }"
                            @click="selectedLoaiMonAn = loai.maLoai"
                        >
                            {{ loai.tenLoai }}
                        </button>
                    </div>

                    <!-- Thanh tìm kiếm -->
                    <div class="search-box">
                        <input
                            type="text"
                            v-model="searchTerm"
                            placeholder="Tìm kiếm món ăn"
                            autocomplete="off"
                        />
                        <i class="fas fa-search"></i>
                    </div>

                    <!-- Danh sách món ăn theo lọc, phân trang -->
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
                                        v-if="
                                            mon.giaGoc &&
                                            mon.giaGoc > mon.donGia
                                        "
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

                    <!-- Phân trang -->
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
                                        <p class="ten-mon">
                                            {{ mon.tenMonAn }}
                                        </p>
                                        <p class="don-gia">
                                            {{
                                                parseInt(
                                                    mon.donGia
                                                ).toLocaleString("vi-VN")
                                            }}đ
                                        </p>
                                    </div>
                                </td>
                                <td>
                                    <div class="quantity-control">
                                        <button
                                            @click="
                                                changeSoLuong(mon.maMonAn, -1)
                                            "
                                        >
                                            -
                                        </button>
                                        <span>{{ mon.soLuongThem }}</span>
                                        <button
                                            @click="
                                                changeSoLuong(mon.maMonAn, 1)
                                            "
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
                                    parseInt(totalAmount).toLocaleString(
                                        "vi-VN"
                                    )
                                }}đ</span
                            >
                        </div>
                        <div>
                            <span>Giảm giá:</span>
                            <span
                                >{{
                                    parseInt(discountValue).toLocaleString(
                                        "vi-VN"
                                    )
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
                                    parseInt(finalAmount).toLocaleString(
                                        "vi-VN"
                                    )
                                }}đ</span
                            >
                        </div>
                        <div>
                            <span>Đã thanh toán:</span>
                            <span
                                >{{
                                    parseInt(
                                        thisHoaDon.daThanhToan
                                    ).toLocaleString("vi-VN")
                                }}đ</span
                            >
                        </div>
                        <div>
                            <span>Còn lại:</span>
                            <span
                                >{{
                                    parseInt(
                                        finalAmount - thisHoaDon.daThanhToan
                                    ).toLocaleString("vi-VN")
                                }}đ</span
                            >
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div class="action-buttons" v-if="thisHoaDon">
            <!-- <button
                v-if="showXacNhanBtn"
                @click="handleXacNhan"
                class="btn-action"
            >
                Xác nhận
            </button>

            <button
                v-if="showKhachNhanBanBtn"
                @click="handleKhachNhanBan"
                class="btn-action"
            >
                Khách nhận bàn
            </button>

            <button
                v-if="showHoanThanhBtn"
                @click="handleHoanThanh"
                class="btn-action"
            >
                Hoàn thành
            </button>

            <button
                v-if="showThanhToanBtn"
                @click="handleThanhToan"
                class="btn-action"
            >
                Thanh toán
            </button> -->
            <button @click="handleUpdateHoaDon" class="btn-action">
                Cập nhật
            </button>
            <button @click="handleReset" class="btn-action bnt-huy">Hủy</button>
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

/* thông tin hóa đơn */
.info-section {
    /* margin-bottom: 5px; */
    background: var(--white-color);
    box-shadow: 1px 2px 8px rgb(0 0 0 / 0.2);
    color: var(--black-color);
    border: 1px solid var(--light-gray-color);
    /* border-radius: 6px; */
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
    flex-direction: column; /* Xếp bảng và tổng kết theo chiều dọc */
    gap: 20px; /* Khoảng cách giữa bảng và phần tổng kết */
    align-items: flex-start; /* Căn bảng sang trái */
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

/* Điều chỉnh phần tổng kết */
/* Wrapper cho bảng và phần tổng kết */
.table-summary-container {
    display: flex;
    flex-direction: column; /* Xếp bảng và tổng kết theo chiều dọc */
    gap: 20px; /* Khoảng cách giữa bảng và phần tổng kết */
    align-items: flex-start; /* Căn bảng sang trái */
}

/* Điều chỉnh bảng */
.table-detail {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.3rem;
}

.action-buttons {
    margin-top: 20px;
    display: flex;
    gap: 20px;
    justify-content: center;
}

.btn-action {
    background-color: var(--dark-blue-color);
    color: var(--black-color);
    text-transform: uppercase;
    border: none;
    padding: 10px 16px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 1.3rem;
    user-select: none;
    transition: background-color 0.3s ease;
}

.btn-action:hover {
    background-color: #8fe3e4;
}

.btn-action.bnt-huy {
    background-color: var(--light-gray-color);
}

.btn-action.bnt-huy:hover {
    background-color: var(--dark-gray-color);
}

/* phần món ăn */
.order-container {
    display: flex;
    gap: 20px;
    margin-top: 20px;
    font-size: 1.6rem;
    color: var(--black-color);
}

/* Bên trái: danh sách món */
.left-panel {
    background: var(--white-color);
    border: 1px solid var(--light-gray-color);
    border-radius: 8px;
    padding: 15px;
    box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.1);
    width: 50%;
    max-height: 800px;
    display: flex;
    flex-direction: column;
}

/* Bên phải: giỏ món */
.right-panel {
    background: var(--white-color);
    border: 1px solid var(--light-gray-color);
    border-radius: 8px;
    padding: 15px;
    box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.1);
    width: 50%;
    max-height: 800px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

/* Nút lọc loại món ăn */
.filter-types {
    margin-bottom: 10px;
}

.filter-types button {
    margin-right: 8px;
    margin-bottom: 8px;
    padding: 6px 12px;
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
    color: white;
}

/* Thanh tìm kiếm */
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

/* Danh sách món ăn */
.mon-an-list {
    flex-grow: 1;
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
    border: none !important;
    color: var(--brown-color);
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
    color: white;
}

/* Phân trang */
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

/* Bảng giỏ món */
.cart-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
    font-size: 1.3rem;
}

.cart-table th,
.cart-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
    vertical-align: middle;
}

.cart-table th:nth-child(2),
.cart-table td:nth-child(2) {
    text-align: left;
}

.mon-info {
    display: flex;
    align-items: center;
    gap: 10px;
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

.don-gia {
    color: #1976d2;
    font-weight: 700;
}

/* Controls số lượng món */
.quantity-control {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.quantity-control button {
    width: 24px;
    height: 24px;
    font-weight: bold;
    font-size: 1.2rem;
    border: 1px solid #ccc;
    background-color: #f0f0f0;
    color: #333;
    cursor: pointer;
    transition: background-color 0.3s ease;
    border-radius: 4px;
}

.quantity-control button:hover {
    background-color: #d0d0d0;
}

/* Nút xóa món */
.btn-remove {
    background: transparent;
    border: none;
    color: #d32f2f;
    font-size: 1.6rem;
    cursor: pointer;
    font-weight: 600;
    user-select: none;
}

/* Tổng tiền, phụ phí, thuế, giảm giá, thành tiền */
.summary {
    font-size: 1.4rem;
    text-align: right;
}

.summary > div {
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    font-weight: 600;
}

.final-amount {
    font-weight: 800;
    font-size: 1.5rem;
    color: #d32f2f;
    border-top: 2px solid #d32f2f;
    padding-top: 8px;
}

/* Responsive đơn giản */
@media (max-width: 768px) {
    .order-container {
        flex-direction: column;
    }
    .left-panel,
    .right-panel {
        width: 100%;
        max-height: none;
    }
}
</style>
