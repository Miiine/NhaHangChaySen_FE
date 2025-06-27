<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import Swal from "sweetalert2";

import { fetchBan, updateTrangThaiBan } from "@/services/ban";
import { fetchKhuVuc } from "@/services/khuvuc";
import { fetchLoaiBan } from "@/services/loaiban";
import { fetchHoaDon, updateBanHoaDon } from "@/services/hoadon";
import { createThongBao } from "@/services/thongbao";

const router = useRouter();
const route = useRoute();

const maHoaDon = route.query.maHoaDon || null;
const maHoaDonNum = Number(maHoaDon);
const foundHoaDon = ref([]);
const ngaySuDungHoaDon = ref(null);

const khuVucList = ref([]);
const banList = ref([]);
const loaiBanList = ref([]);
const selectedKhuVuc = ref("");

const hoaDonList = ref([]);
const activeBan = ref(null);

const toPage = (page) => {
    router.push({ name: page });
    window.scrollTo(0, 0);
};

// Lọc bàn theo khu vực đã chọn
const banLocTheoKhuVuc = computed(() =>
    banList.value.filter((b) => b.maKhuVuc === selectedKhuVuc.value)
);

// Lọc bàn theo loại
const banNho = computed(() =>
    banLocTheoKhuVuc.value.filter((b) => b.maLoaiBan === 1)
);
const banTrungBinh = computed(() =>
    banLocTheoKhuVuc.value.filter((b) => b.maLoaiBan === 2)
);
const banLon = computed(() =>
    banLocTheoKhuVuc.value.filter((b) => b.maLoaiBan === 3)
);

// Map trạng thái sang màu và chữ
const trangThaiMap = {
    dat_cho: { color: "#d69617", text: "ĐÃ ĐẶT TRƯỚC" },
    dang_phuc_vu: { color: "#db3737", text: "ĐANG SỬ DỤNG" },
    trong: { color: "#346e34", text: "BÀN TRỐNG" },
};

// Lấy trạng thái bàn theo mã bàn
const getBanByMa = (maBan) => {
    return banList.value.find((b) => b.maBan === maBan);
};

function capNhatTrangThaiBanTheoNgay() {
    if (!hoaDonList.value.length || !banList.value.length) return;

    const ngayThamChieu = new Date(ngaySuDungHoaDon.value).toDateString();

    // Lấy danh sách bàn đã đặt trong ngày tham chiếu, với điều kiện trạng thái hóa đơn là cho_duyet hoặc da_duyet
    const hoaDonTrongNgay = hoaDonList.value.filter(
        (hd) =>
            new Date(hd.thoiGianSuDung).toDateString() === ngayThamChieu &&
            (hd.trangThai === "cho_duyet" || hd.trangThai === "da_duyet")
    );

    // Tạo map nhanh theo mã bàn -> trạng thái hóa đơn trong ngày
    const trangThaiBanTheoHoaDon = {};
    hoaDonTrongNgay.forEach((hd) => {
        const trangThaiBan = hd.trangThaiBan;

        // Nếu bàn này đã có trạng thái "dang_phuc_vu" rồi thì giữ trạng thái này
        if (trangThaiBanTheoHoaDon[hd.maBan] === "dang_phuc_vu") return;
        trangThaiBanTheoHoaDon[hd.maBan] = trangThaiBan;
    });

    // Cập nhật trạng thái bàn trong banList
    banList.value = banList.value.map((ban) => {
        if (trangThaiBanTheoHoaDon.hasOwnProperty(ban.maBan)) {
            // Bàn có trong danh sách bàn đặt trong ngày
            if (trangThaiBanTheoHoaDon[ban.maBan] === "dang_phuc_vu") {
                return { ...ban, trangThai: "dang_phuc_vu" };
            } else {
                // Các trạng thái khác => đánh dấu đã đặt trước
                return { ...ban, trangThai: "dat_cho" };
            }
        } else {
            // Bàn không nằm trong danh sách đã đặt ngày đó => trống
            return { ...ban, trangThai: "trong" };
        }
    });

    console.log("Bàn dã đặt theo ngày tham chiếu: ", hoaDonTrongNgay);
    console.log("Cập nhật trạng thái bàn theo ngày sử dụng:", banList.value);
}

// Hàm xử lý click chọn bàn
const handleBanClick = async (ban) => {
    if (!maHoaDon) return;

    if (ban.maBan.toString() === activeBan.value?.toString()) {
        return;
    }

    if (ban.trangThai !== "trong") {
        Swal.fire("Thông báo", "Bàn đã được đặt.", "warning");
        return;
    }

    const banCu = getBanByMa(activeBan.value);
    const trangThaiBanCuMoi =
        banCu.trangThai === "dat_cho" ? "trong" : banCu.trangThai;
    if (!banCu) {
        Swal.fire("Lỗi", "Không tìm thấy bàn cũ.", "error");
        return;
    }

    if (ban.maKhuVuc !== banCu.maKhuVuc) {
        // Khác khu vực - thông báo chi tiết và hỏi xác nhận
        const khuVucMoi = khuVucList.value.find(
            (kv) => kv.maKhuVuc === ban.maKhuVuc
        );
        if (!khuVucMoi) {
            Swal.fire("Lỗi", "Không tìm thấy khu vực bàn mới.", "error");
            return;
        }

        // Lấy phụ phí mới, giả sử lấy từ khu vực mới
        const phuPhiMoi = khuVucMoi.phuPhi;

        // Lấy thanhTien cũ từ hóa đơn hiện tại
        const hoaDon = hoaDonList.value.find(
            (hd) => hd.maHoaDon.toString() === maHoaDon.toString()
        );

        if (!hoaDon) {
            Swal.fire("Lỗi", "Không tìm thấy hóa đơn.", "error");
            return;
        }

        const phuPhiCu = hoaDon.phuPhiKV || 0;
        const thanhTienCu = hoaDon.thanhTien || 0;
        const thanhTienMoi =
            Number(thanhTienCu || 0) -
            Number(phuPhiCu || 0) +
            Number(phuPhiMoi || 0);

        const result = await Swal.fire({
            title: "Bạn muốn đổi khu vực bàn?",
            html: `
                Bạn muốn chuyển từ khu vực <b>${
                    banCu.tenKhuVuc
                }</b> sang khu vực <b>${khuVucMoi.tenKhuVuc}</b>.<br/>
                Phụ phí thay đổi thành: <b>${phuPhiMoi.toLocaleString()} VNĐ</b>.<br/>
                Thành tiền dự kiến: <b>${thanhTienMoi.toLocaleString()} VNĐ</b>.<br/>
                Bạn có muốn tiếp tục không?
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Có, tiếp tục",
            cancelButtonText: "Không, hủy bỏ",
        });

        if (!result.isConfirmed) return;

        try {
            await updateTrangThaiBan(activeBan.value, "trong");
            await updateTrangThaiBan(ban.maBan, trangThaiBanCuMoi.trim());
            await updateBanHoaDon(maHoaDon, ban.maBan);

            activeBan.value = ban.maBan;

            //tạo thông báo
            const maNguoiNhan = foundHoaDon.value?.maTaiKhoan;
            if (maNguoiNhan) {
                const tieuDe = `Đơn đặt bàn đã cập nhật bàn mới!`;
                const noiDung = `Hóa đơn #${maHoaDon} của bạn đã được chuyển từ bàn ${
                    banCu.maBan
                } (khu vực ${
                    banCu.tenKhuVuc
                }, phụ phí ${phuPhiCu.toLocaleString()} VNĐ) sang bàn ${
                    ban.maBan
                } (khu vực ${
                    khuVucMoi.tenKhuVuc
                }, phụ phí ${phuPhiMoi.toLocaleString()} VNĐ). Thành tiền từ ${thanhTienCu.toLocaleString()} VNĐ thành ${thanhTienMoi.toLocaleString()} VNĐ.`;

                await createThongBao({
                    maNguoiGui: null,
                    maNguoiNhan,
                    tieuDe,
                    noiDung,
                    loaiThongBao: "Đơn đặt bàn",
                });
            }

            Swal.fire(
                "Thành công",
                "Đã chuyển bàn và cập nhật phụ phí thành công.",
                "success"
            );
            router.push({ name: "LichDatBan" });
        } catch (error) {
            Swal.fire("Lỗi", "Có lỗi khi chuyển bàn.", "error");
        }
    } else {
        // Cùng khu vực - chỉ hỏi chuyển bàn thôi
        const result = await Swal.fire({
            title: "Xác nhận chuyển bàn",
            text: `Bạn có muốn chuyển sang bàn ${ban.maBan} không?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Có",
            cancelButtonText: "Không",
        });

        if (!result.isConfirmed) return;

        try {
            await updateTrangThaiBan(activeBan.value, "trong");
            await updateTrangThaiBan(ban.maBan, trangThaiBanCuMoi.trim());
            await updateBanHoaDon(maHoaDon, ban.maBan);

            activeBan.value = ban.maBan;

            //tạo thông báo
            const maNguoiNhan = foundHoaDon.value?.maTaiKhoan;
            if (maNguoiNhan) {
                const tieuDe = `Đơn đặt bàn đã cập nhật bàn mới!`;
                const noiDung = `Hóa đơn #${maHoaDon} của bạn đã được chuyển từ bàn ${banCu.maBan} thành bàn ${ban.maBan}.`;

                await createThongBao({
                    maNguoiGui: null,
                    maNguoiNhan,
                    tieuDe,
                    noiDung,
                    loaiThongBao: "Đơn đặt bàn",
                });
            }

            Swal.fire("Thành công", "Đã chuyển bàn thành công.", "success");
            router.push({ name: "LichDatBan" });
        } catch (error) {
            Swal.fire("Lỗi", "Có lỗi khi chuyển bàn.", "error");
        }
    }
};

async function loadData() {
    try {
        const bData = await fetchBan();
        const kvData = await fetchKhuVuc();
        const lbData = await fetchLoaiBan();
        const hdData = await fetchHoaDon();

        banList.value = bData;
        khuVucList.value = kvData;
        loaiBanList.value = lbData;
        hoaDonList.value = hdData;

        if (khuVucList.value.length > 0 && !selectedKhuVuc.value) {
            selectedKhuVuc.value = khuVucList.value[0].maKhuVuc;
        }
        console.log("Selected khu vực: ", selectedKhuVuc.value);

        if (maHoaDonNum) {
            foundHoaDon.value = hoaDonList.value.find(
                (hd) => hd.maHoaDon === maHoaDonNum
            );
            if (foundHoaDon.value) {
                activeBan.value = foundHoaDon.value.maBan;
                ngaySuDungHoaDon.value = foundHoaDon.value.thoiGianSuDung;
            }
        }

        if (!ngaySuDungHoaDon.value) {
            ngaySuDungHoaDon.value = new Date().toISOString();
        }

        capNhatTrangThaiBanTheoNgay();

        console.log("maHoaDon:", maHoaDonNum);
        console.log("Hóa đơn tìm thấy:", foundHoaDon.value);
        console.log("activeBan được gán:", activeBan.value);
        console.log(
            "Ngày sử dụng hóa đơn tìm được:",
            foundHoaDon.value.thoiGianSuDung
        );
        console.log("Ngày sử dụng tham chiếu:", ngaySuDungHoaDon.value);
    } catch (err) {
        console.error("Lỗi loadData:", err);
    }
}

onMounted(async () => {
    await loadData();
});

watch(ngaySuDungHoaDon, () => {
    capNhatTrangThaiBanTheoNgay();
});
</script>

<template>
    <div class="page-container">
        <h3 class="title">Sơ đồ bàn</h3>
        <hr />

        <div class="layout">
            <!-- Bên trái: Khu vực -->
            <div class="left-panel">
                <div class="header-left">
                    <div class="title-left">Khu vực</div>
                    <button class="btn-edit">Chỉnh sửa</button>
                </div>
                <ul class="khuvuc-list">
                    <li
                        v-for="kv in khuVucList"
                        :key="kv.maKhuVuc"
                        :class="{ selected: kv.maKhuVuc === selectedKhuVuc }"
                        @click="selectedKhuVuc = kv.maKhuVuc"
                    >
                        <i class="fa fa-location-dot"></i>
                        {{ kv.tenKhuVuc }}
                    </li>
                </ul>
            </div>

            <!-- Bên phải: Sơ đồ bàn -->
            <div class="right-panel">
                <div class="header-right">
                    <div class="title-right">
                        Sơ đồ bàn khu vực:
                        {{
                            khuVucList.find(
                                (k) => k.maKhuVuc === selectedKhuVuc
                            )?.tenKhuVuc
                        }}
                    </div>
                    <button @click="toPage('DanhSachBan')" class="btn-edit">
                        Chỉnh sửa
                    </button>
                </div>

                <!-- Bàn nhỏ -->
                <div class="ban-group">
                    <h4>Bàn Nhỏ (tối đa 4 người)</h4>
                    <div class="ban-list">
                        <div
                            v-for="ban in banNho"
                            :key="ban.maBan"
                            class="ban-item"
                            :class="{ active: ban.maBan === activeBan }"
                            @click="maHoaDon ? handleBanClick(ban) : null"
                            :style="{
                                cursor: maHoaDon ? 'pointer' : 'not-allowed',
                            }"
                        >
                            <div
                                class="ban-so"
                                :style="{
                                    backgroundColor:
                                        trangThaiMap[ban.trangThai].color,
                                }"
                            >
                                {{ ban.maBan }}
                            </div>
                            <div class="ban-info">
                                Loại: {{ ban.tenLoai }}<br />
                                <span
                                    class="trangthai-text"
                                    :style="{
                                        color: trangThaiMap[ban.trangThai]
                                            .color,
                                    }"
                                >
                                    {{ trangThaiMap[ban.trangThai].text }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bàn trung bình -->
                <div class="ban-group">
                    <h4>Bàn Trung bình (tối đa 6 người)</h4>
                    <div class="ban-list">
                        <div
                            v-for="ban in banTrungBinh"
                            :key="ban.maBan"
                            class="ban-item"
                            :class="{ active: ban.maBan === activeBan }"
                            @click="maHoaDon ? handleBanClick(ban) : null"
                            :style="{
                                cursor: maHoaDon ? 'pointer' : 'not-allowed',
                            }"
                        >
                            <div
                                class="ban-so"
                                :style="{
                                    backgroundColor:
                                        trangThaiMap[ban.trangThai].color,
                                }"
                            >
                                {{ ban.maBan }}
                            </div>
                            <div class="ban-info">
                                Loại: {{ ban.tenLoai }}<br />
                                <span
                                    class="trangthai-text"
                                    :style="{
                                        color: trangThaiMap[ban.trangThai]
                                            .color,
                                    }"
                                >
                                    {{ trangThaiMap[ban.trangThai].text }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bàn lớn -->
                <div class="ban-group">
                    <h4>Bàn Lớn (tối đa 12 người)</h4>
                    <div class="ban-list">
                        <div
                            v-for="ban in banLon"
                            :key="ban.maBan"
                            class="ban-item"
                            :class="{ active: ban.maBan === activeBan }"
                            @click="maHoaDon ? handleBanClick(ban) : null"
                            :style="{
                                cursor: maHoaDon ? 'pointer' : 'not-allowed',
                            }"
                        >
                            <div
                                class="ban-so"
                                :style="{
                                    backgroundColor:
                                        trangThaiMap[ban.trangThai].color,
                                }"
                            >
                                {{ ban.maBan }}
                            </div>
                            <div class="ban-info">
                                Loại: {{ ban.tenLoai }}<br />
                                <span
                                    class="trangthai-text"
                                    :style="{
                                        color: trangThaiMap[ban.trangThai]
                                            .color,
                                    }"
                                >
                                    {{ trangThaiMap[ban.trangThai].text }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
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

.layout {
    display: flex;
    gap: 30px;
}

.left-panel {
    width: 200px;
    border: 1px solid var(--light-gray-color);
    padding: 12px 10px;
    border-radius: 4px;
    background: var(--white-color);
}

.header-left {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.title-left {
    font-weight: 600;
    font-size: 1.6rem;
}

.btn-edit {
    border: none;
    background-color: transparent;
    color: #007bff;
    font-size: 1.2rem;
    cursor: pointer;
    user-select: none;
}

.btn-edit:hover {
    text-decoration: underline;
}

.khuvuc-list {
    list-style: none;
}

.khuvuc-list li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.4rem;
    user-select: none;
    transition: background-color 0.3s ease;
}

.khuvuc-list li i.fa-location-dot {
    font-size: 1.4rem;
}

.khuvuc-list li:hover {
    background-color: var(--light-gray-color);
}

.khuvuc-list li.selected {
    background-color: var(--dark-gray-color);
    color: var(--white-color);
    font-weight: 600;
}

.right-panel {
    flex: 1;
    border: 1px solid var(--light-gray-color);
    padding: 14px 30px;
    border-radius: 6px;
    background: var(--white-color);
    box-shadow: 1px 1px 6px rgb(0 0 0 / 0.1);
}

.header-right {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.title-right {
    font-weight: 600;
    font-size: 1.8rem;
}

.ban-group {
    margin-bottom: 25px;
}

.ban-group h4 {
    font-weight: 600;
    font-size: 1.6rem;
    margin-bottom: 12px;
}

.ban-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
}

.ban-item {
    border: 1px solid var(--light-gray-color);
    width: 150px;
    padding: 15px;
    border-radius: 4px;
    text-align: center;
    cursor: pointer;
    user-select: none;
    background: var(--white-color);
    box-shadow: 1px 1px 6px rgba(0, 0, 0, 0.2);
}

.ban-item:hover {
    background: var(--dark-blue-color);
}

.ban-item.active {
    box-shadow: 0 0 5px 2px #4b87b1;
    border: 2px solid #4c66af;
    background-color: #c0e6f0;
}

.ban-so {
    width: 38px;
    height: 40px;
    margin: 0 auto 15px auto;
    color: var(--white-color);
    font-weight: 700;
    display: flex;
    justify-content: center;
    align-items: center;
    user-select: none;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
}

.ban-info {
    font-size: 1.2rem;
    white-space: pre-line;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.trangthai-text {
    font-weight: 600;
    font-size: 1.4rem;
    user-select: none;
}

/* Responsive cho tablet (768px đến 1024px) */
@media (max-width: 1024px) and (min-width: 768px) {
    .page-container {
        margin: 15px 40px;
    }
    .title {
        font-size: 1.6rem;
    }
    .layout {
        flex-direction: column;
        gap: 20px;
    }
    .left-panel {
        width: 100%;
        padding: 10px;
        border-radius: 6px;
    }
    .right-panel {
        width: 100%;
        padding: 20px;
        border-radius: 6px;
    }
    .title-left {
        font-size: 1.4rem;
    }
    .title-right {
        font-size: 1.4rem;
    }
    .khuvuc-list li {
        font-size: 1.2rem;
        padding: 6px 10px;
    }
    .ban-group h4 {
        font-size: 1.3rem;
    }
    .ban-item {
        width: 120px;
        padding: 12px;
    }
    .ban-so {
        width: 32px;
        height: 34px;
        font-size: 1.2rem;
    }
    .ban-info {
        font-size: 1rem;
    }
    .trangthai-text {
        font-size: 1.2rem;
    }
}

/* Responsive cho mobile (dưới 768px) */
@media (max-width: 767px) {
    .page-container {
        margin: 10px 15px;
    }
    .title {
        font-size: 1.4rem;
    }
    .layout {
        flex-direction: column;
        gap: 15px;
    }
    .left-panel {
        width: 100%;
        padding: 8px;
        border-radius: 6px;
    }
    .right-panel {
        width: 100%;
        padding: 15px;
        border-radius: 6px;
    }
    .header-left,
    .header-right {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
    .title-left,
    .title-right {
        font-size: 1.2rem;
    }
    .btn-edit {
        font-size: 1rem;
    }
    .khuvuc-list li {
        font-size: 1rem;
        padding: 6px 10px;
    }
    .ban-group h4 {
        font-size: 1.2rem;
    }
    .ban-list {
        gap: 15px;
        justify-content: flex-start;
    }
    .ban-item {
        width: 100px;
        padding: 10px;
    }
    .ban-so {
        width: 28px;
        height: 30px;
        font-size: 1rem;
    }
    .ban-info {
        font-size: 0.9rem;
    }
    .trangthai-text {
        font-size: 1rem;
    }
}
</style>
