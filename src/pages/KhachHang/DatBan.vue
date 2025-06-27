<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import slugify from "slugify";
import Swal from "sweetalert2";
import moment from "moment";
import BreadCrumb from "@/components/BreadCrumb.vue";
import BaseButton from "@/components/BaseButton.vue";

import { fetchMonAn } from "@/services/monan";
import { fetchKhuVuc } from "@/services/khuvuc";
import { fetchKhuyenMai } from "@/services/khuyenmai";
import { fetchBan } from "@/services/ban";
import {
    fetchGioHang,
    addDishesToCart,
    deleteDishFromCart,
    updateSLInCart,
} from "@/services/giohang";
import { fetchHoaDon, addHoaDon } from "@/services/hoadon";
import { fetchTaiKhoan } from "@/services/taikhoan";

const router = useRouter();
const { user } = useAuthStore();
const cartStore = useCartStore();
const danhSachMonAn = ref([]);
const currentPage = ref(1);
const itemsPerPage = 5;
const danhSachGioHang = ref([]);
const selectedItems = ref([]);
const danhSachKhuVuc = ref([]);
const danhSachKhuyenMai = ref([]);
const danhSachBan = ref([]);
const danhSachTaiKhoan = ref([]);
const thisTaiKhoan = ref([]);
const danhSachHoaDon = ref([]);

const selectedArea = ref("");
const selectedDiscount = ref("");
const selectedTable = ref("");
const fullName = ref("");
const phone = ref("");
const email = ref(user.email);
const numberOfGuests = ref(1);
const reservationDate = ref("");
const reservationTime = ref("");
const message = ref("");
const surcharge = ref(0);
const discountValue = ref(0);
const filteredBan = ref([]);
const filteredDiscount = ref([]);

const toPage = (page) => {
    router.push({ name: page });
    window.scrollTo(0, 0);
};

// Hàm lấy ảnh chính
function getMainImage(images = []) {
    if (!Array.isArray(images)) return "";
    const main = images.find((i) => i.anhChinh) || images[0] || {};
    return main.url || "";
}

const decreaseQuantity = async (item) => {
    if (item.soLuongThem > 1) {
        item.soLuongThem--;
        await updateQuantityInCart(item);

        //cập nhật totalItemCount
        await cartStore.calculateTotalItemCount(user.id);
    } else {
        Swal.fire({
            title: "Bạn có chắc chắn muốn xóa món ăn này không?",
            text: "Món ăn sẽ bị xóa khỏi giỏ hàng.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        }).then(async (result) => {
            if (result.isConfirmed) {
                item.soLuongThem--;
                await deleteDishFromCart(user.id, item.maMonAn);

                //cập nhật totalItemCount
                await cartStore.calculateTotalItemCount(user.id);

                loadData();
            }
        });
    }
};

const increaseQuantity = async (item) => {
    if (item.soLuongThem < item.soLuongMonCon) {
        item.soLuongThem++;
        await updateQuantityInCart(item);

        //cập nhật totalItemCount
        await cartStore.calculateTotalItemCount(user.id);
    } else {
        Swal.fire({
            title: "Số lượng tối đa đã đạt!",
            text: "Bạn đã thêm đủ số lượng món ăn này vào giỏ hàng.",
            icon: "info",
            confirmButtonText: "OK",
        });
    }
};

const updateQuantityInCart = async (item) => {
    try {
        await updateSLInCart(user.id, item.maMonAn, item.soLuongThem);
    } catch (err) {
        console.error("Lỗi cập nhật số lượng món ăn:", err);
    }
};

const totalAmount = computed(() => {
    return danhSachGioHang.value.reduce(
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

const removeItem = async (maMonAn) => {
    Swal.fire({
        title: "Bạn có chắc chắn muốn xóa món ăn này không?",
        text: "Món ăn sẽ bị xóa khỏi giỏ hàng.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    }).then(async (result) => {
        if (result.isConfirmed) {
            await deleteDishFromCart(user.id, maMonAn);

            // Cập nhật totalItemCount trong store
            await cartStore.calculateTotalItemCount(user.id);

            loadData();
        }
    });
};

// Hàm chọn hoặc bỏ chọn tất cả các món ăn trong giỏ hàng
const toggleSelectAll = () => {
    if (
        selectedItems.value.length === 0 ||
        selectedItems.value.length < danhSachGioHang.value.length
    ) {
        selectedItems.value = danhSachGioHang.value.map((item) => item.maMonAn);
    } else {
        selectedItems.value = [];
    }
};

const removeSelectedItems = async () => {
    Swal.fire({
        title: "Bạn có chắc chắn muốn xóa món ăn này không?",
        text: "Món ăn sẽ bị xóa khỏi giỏ hàng.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    }).then(async (result) => {
        if (result.isConfirmed) {
            selectedItems.value.forEach(async (maMonAn) => {
                await deleteDishFromCart(user.id, maMonAn);

                // Cập nhật totalItemCount trong store
                await cartStore.calculateTotalItemCount(user.id);

                loadData();
            });
        }
    });
};

//Hàm chuyển trang
const goToPage = (page) => {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
};
//Hàm để điều hướng tới trang chi tiết
const goToDishDetail = (dish) => {
    const slug = slugify(dish.tenMonAn, { lower: true });
    router.push({
        name: "ChiTietMonAnFromOrder",
        params: {
            maMonAn: dish.maMonAn,
            slug: slug,
        },
    });
};

const goToDishMenu = () => {
    router.push({
        name: "ThucDonFromCart",
    });
};

const resetForm = () => {
    fullName.value = thisTaiKhoan.value.tenTaiKhoan;
    phone.value = thisTaiKhoan.value.SDT;
    email.value = user.email;
    numberOfGuests.value = 1;
    reservationDate.value = "";
    reservationTime.value = "";
    message.value = "";

    selectedArea.value = 1;
    selectedDiscount.value = "";
    selectedTable.value = "";
};

const reservationDateTime = new Date(
    reservationDate.value + "T" + reservationTime.value + ":00"
);

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

// Danh sách bàn bị đặt cho ngày được chọn
const reservedTableIds = computed(() => {
    if (!reservationDate.value) return [];

    // Lọc hoá đơn có ngày đặt trùng ngày chọn, trạng thái phù hợp (chờ duyệt, đã duyệt)
    return danhSachHoaDon.value
        .filter((hd) => {
            // So sánh ngày (bỏ giờ phút)
            const hdDate = moment(hd.thoiGianSuDung).format("YYYY-MM-DD");
            return (
                hdDate === reservationDate.value &&
                ["cho_duyet", "da_duyet"].includes(hd.trangThai)
            );
        })
        .map((hd) => hd.maBan); // Lấy danh sách mã bàn đã đặt
});

function filterBans() {
    filteredBan.value = danhSachBan.value.filter((ban) => {
        return (
            ban.maKhuVuc === selectedArea.value &&
            // ban.trangThai === "trong" &&
            ban.soLuongKhachToiDa >= numberOfGuests.value &&
            !reservedTableIds.value.includes(ban.maBan) // Không bị đặt ngày đó
        );
    });
}

//Hàm thêm hóa đơn
const submitForm = async () => {
    const isQuantityValid = checkQuantityBeforeSubmit(danhSachGioHang.value);
    if (!isQuantityValid) return;

    console.log("reservationDate", reservationDate.value);
    console.log("reservationTỉe", reservationTime.value);
    if (!reservationDate.value || !reservationTime.value) {
        Swal.fire({
            title: "Lỗi!",
            text: "Vui lòng chọn ngày và giờ hợp lệ.",
            icon: "error",
            confirmButtonText: "OK",
        });
        return;
    }

    const formattedDateTime =
        reservationDate.value + " " + reservationTime.value + ":00";

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
        maTaiKhoan: user.id,
        maBan: selectedTable.value,
        maKhuyenMai: selectedDiscount.value || null,
        hoTen: fullName.value,
        sdt: phone.value,
        email: email.value,
        soLuongKhach: numberOfGuests.value,
        note: message.value,
        tongTienMonAn: totalAmount.value,
        phuPhiKV: surcharge.value,
        tienGiam: discountValue.value,
        thue: taxValue.value,
        thanhTien: finalAmount.value,
        thoiGianSuDung: formattedDateTime,
        chiTietHoaDon: danhSachGioHang.value.map((item) => ({
            maMonAn: item.maMonAn,
            soLuong: item.soLuongThem,
        })),
    };

    try {
        const response = await addHoaDon(hoaDonData);
        // In ra phản hồi từ API để kiểm tra
        console.log("API Response:", response);

        // Kiểm tra xem phản hồi có chứa maHoaDon không
        if (response && response.maHoaDon) {
            const maHoaDon = response.maHoaDon;
            console.log("Mã hóa đơn: ", maHoaDon);

            // Tiến hành các bước tiếp theo nếu có mã hóa đơn
            await Promise.all(
                danhSachGioHang.value.map((item) => {
                    return deleteDishFromCart(user.id, item.maMonAn);
                })
            );

            Swal.fire({
                title: "Vui lòng thanh toán hoặc cọc!",
                text: "Đơn đặt bàn sẽ tự động hủy sau 60 phút nên chưa thanh toán hoặc cọc trước.",
                icon: "success",
                confirmButtonText: "OK",
            }).then(() => {
                // window.location.reload();
                resetForm();
                router.push({
                    name: "ThanhToanFromDatBan",
                    params: { maHoaDon },
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

//Hàm tính toán số trang tổng cộng:
const totalPages = computed(() => {
    return Math.ceil(danhSachGioHang.value.length / itemsPerPage);
});

//Hàm lấy danh sách mon ăn cho trang hiện tại:
const paginationDishes = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = currentPage.value * itemsPerPage;
    return danhSachGioHang.value.slice(start, end);
});

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

async function loadData() {
    try {
        const [monAnData, ghData, kvData, udData, bData, tkData, hdData] =
            await Promise.all([
                fetchMonAn(),
                fetchGioHang(user.id),
                fetchKhuVuc(),
                fetchKhuyenMai(),
                fetchBan(),
                fetchTaiKhoan(),
                fetchHoaDon(),
            ]);

        // Kiểm tra số lượng món ăn trong giỏ hàng và cập nhật
        ghData.forEach((item) => {
            // Nếu soLuongThem > soLuongMonCon thì cập nhật lại soLuongThem
            if (item.soLuongThem > item.soLuongMonCon) {
                item.soLuongThem = item.soLuongMonCon;
                updateSLInCart(user.id, item.maMonAn, item.soLuongThem);
            }

            // Nếu soLuongMonCon == 0 thì xóa món ăn khỏi giỏ hàng
            if (item.soLuongMonCon === 0) {
                deleteDishFromCart(user.id, item.maMonAn);
            }
        });

        danhSachMonAn.value = monAnData;
        danhSachGioHang.value = ghData;
        danhSachKhuVuc.value = kvData;
        danhSachKhuyenMai.value = udData.sort(
            (a, b) => b.phanTram - a.phanTram
        );

        danhSachBan.value = bData;
        danhSachTaiKhoan.value = tkData;
        danhSachHoaDon.value = hdData;

        thisTaiKhoan.value = danhSachTaiKhoan.value.find(
            (tk) => tk.maTaiKhoan === user.id
        );

        fullName.value = thisTaiKhoan.value?.tenTaiKhoan || "";
        phone.value = thisTaiKhoan.value?.SDT || "";

        // Mặc định chọn khu vực đầu tiên
        selectedArea.value = kvData[0]?.maKhuVuc || "";

        // // Lọc danh sách bàn theo khu vực đã chọn
        // filteredBan.value = bData.filter(
        //     (ban) =>
        //         ban.maKhuVuc === selectedArea.value &&
        //         ban.trangThai === "trong" &&
        //         ban.soLuongKhachToiDa >= numberOfGuests.value
        // );
        filterBans();

        filteredDiscount.value = danhSachKhuyenMai.value.filter((km) => {
            const thoiGianApDung = moment(
                km.thoiGianApDung,
                "YYYY-MM-DD HH:mm:ss"
            );
            const thoiGianHetHan = moment(
                km.thoiGianHetHan,
                "YYYY-MM-DD HH:mm:ss"
            );
            const currentDate = moment();

            const isValid = km.dieuKienApDung <= totalAmount && km.soLuong > 0;
            const isInDateRange =
                thoiGianApDung <= currentDate && thoiGianHetHan >= currentDate;

            return isValid && isInDateRange;
        });

        console.log("filter: ", filteredDiscount.value);
    } catch (err) {
        console.error("Lỗi loadData:", err);
    }
}

onMounted(async () => {
    //Fetch all
    await loadData();
    console.log("Danh sách khuyến mãi:", danhSachKhuyenMai.value);
    console.log("Khuyến mãi đã lọc:", filteredDiscount.value);
});

// Cập nhật phụ phí khi khu vực thay đổi
watch([selectedArea, numberOfGuests], () => {
    console.log(
        "Selected Area or number of guests changed to: ",
        selectedArea.value,
        numberOfGuests.value
    );
    const selected = danhSachKhuVuc.value.find(
        (khuVuc) => khuVuc.maKhuVuc === selectedArea.value
    );
    surcharge.value = selected ? selected.phuPhi : 0;
    console.log("Surcharge updated:", surcharge.value);

    // // Lọc bàn theo khu vực đã chọn
    // filteredBan.value = danhSachBan.value.filter(
    //     (ban) =>
    //         ban.maKhuVuc === selectedArea.value &&
    //         ban.trangThai === "trong" &&
    //         ban.soLuongKhachToiDa >= numberOfGuests.value
    // );
    filterBans();
});

//Cập nhật discountValue khi chọn mã giảm giá
watch(selectedDiscount, (newDiscount) => {
    const discount = danhSachKhuyenMai.value.find(
        (d) => d.maKhuyenMai === newDiscount
    );

    if (discount) {
        discountValue.value = (totalAmount.value * discount.phanTram) / 100;
    } else {
        discountValue.value = 0;
    }
});

//Cập nhật tổng tiền khi thay đổi mã giảm giá
watch(totalAmount, (newTotal) => {
    filteredDiscount.value = danhSachKhuyenMai.value.filter((km) => {
        const thoiGianApDung = moment(km.thoiGianApDung, "YYYY-MM-DD HH:mm:ss");
        const thoiGianHetHan = moment(km.thoiGianHetHan, "YYYY-MM-DD HH:mm:ss");
        const currentDate = moment();

        const isValid = km.dieuKienApDung <= newTotal && km.soLuong > 0;
        const isInDateRange =
            thoiGianApDung <= currentDate && thoiGianHetHan >= currentDate;

        return isValid && isInDateRange;
    });

    //Kiểm tra nếu mã giảm giá đang chọn không còn thỏa điều kiện nữa thì reset chọn mã giảm giá
    const selected = danhSachKhuyenMai.value.find(
        (d) => d.maKhuyenMai === selectedDiscount.value
    );
    if (selected && newTotal < selected.dieuKienApDung) {
        selectedDiscount.value = ""; // bỏ chọn mã giảm giá
        discountValue.value = 0; // reset giảm giá
    } else if (selected) {
        // Nếu vẫn hợp lệ, cập nhật lại discountValue
        discountValue.value = (newTotal * selected.phanTram) / 100;
    } else {
        discountValue.value = 0;
    }
});

//Cập nhật list bàn khi thay đổi số lượng khách, khu vực và ngày chọn
watch(
    [selectedArea, numberOfGuests, reservationDate, reservedTableIds],
    () => {
        filterBans();
    },
    { immediate: true }
);
</script>

<template>
    <BreadCrumb />
    <div class="page-container">
        <h1>Đặt bàn</h1>
        <section class="cart-section">
            <h2 class="cart-section-title">Danh sách món ăn trong giỏ hàng:</h2>
            <div class="cart-table">
                <table>
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    @click="toggleSelectAll"
                                    :checked="
                                        selectedItems.length ===
                                        danhSachGioHang.length
                                    "
                                />
                            </th>
                            <th>STT</th>
                            <th>Ảnh</th>
                            <th>Tên món ăn</th>
                            <th>Đơn giá</th>
                            <th>Số lượng</th>
                            <th>Thành tiền</th>
                            <th>Xóa</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(monAn, index) in paginationDishes"
                            :key="monAn.maMonAn"
                        >
                            <td>
                                <input
                                    type="checkbox"
                                    v-model="selectedItems"
                                    :value="monAn.maMonAn"
                                />
                            </td>
                            <td>
                                {{
                                    (currentPage - 1) * itemsPerPage + index + 1
                                }}
                            </td>
                            <td>
                                <img
                                    :src="getMainImage(monAn.anhMonAn)"
                                    alt="Ảnh món ăn"
                                    class="dish-image"
                                    @click="goToDishDetail(monAn)"
                                />
                            </td>
                            <td @click="goToDishDetail(monAn)">
                                {{ monAn.tenMonAn }}
                            </td>
                            <td>
                                {{
                                    parseInt(monAn.donGia).toLocaleString(
                                        "vi-VN"
                                    )
                                }}đ
                            </td>
                            <td>
                                <button @click="decreaseQuantity(monAn)">
                                    -
                                </button>
                                <span>{{ monAn.soLuongThem }}</span>
                                <button @click="increaseQuantity(monAn)">
                                    +
                                </button>
                            </td>
                            <td>
                                {{
                                    parseInt(
                                        monAn.soLuongThem * monAn.donGia
                                    ).toLocaleString("vi-VN")
                                }}đ
                            </td>
                            <td>
                                <button
                                    @click="removeItem(monAn.maMonAn)"
                                    class="trash-icon"
                                >
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="6" class="total-label">Tổng cộng:</td>
                            <td colspan="2" class="total-amount">
                                {{
                                    parseInt(totalAmount).toLocaleString(
                                        "vi-VN"
                                    )
                                }}đ
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="action-container">
                <div class="cart-actions">
                    <BaseButton
                        @click="removeSelectedItems"
                        btnTitle="XÓA"
                        variant="delete-btn-color"
                    ></BaseButton>
                    <BaseButton
                        @click="goToDishMenu"
                        btnTitle="CHỌN THÊM MÓN"
                        variant="primary"
                    ></BaseButton>
                </div>
                <div class="pagination-controls">
                    <button
                        class="pagination-btn"
                        :disabled="currentPage === 1"
                        @click="goToPage(currentPage - 1)"
                    >
                        <i class="fas fa-chevron-left"></i>
                    </button>

                    <button
                        v-for="page in totalPages"
                        :key="page"
                        class="pagination-number"
                        :class="{ active: currentPage === page }"
                        @click="goToPage(page)"
                    >
                        {{ page }}
                    </button>

                    <button
                        class="pagination-btn"
                        :disabled="currentPage === totalPages"
                        @click="goToPage(currentPage + 1)"
                    >
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </section>
        <section class="order-section">
            <div class="order-info">
                <h2 class="order-info-title">Thông tin đặt bàn</h2>
                <form @submit.prevent="submitForm">
                    <div class="form-group">
                        <div class="form-row">
                            <!-- <input
                                type="email"
                                id="email"
                                v-model="email"
                                placeholder="Email"
                                readonly
                            /> -->
                            <input
                                type="text"
                                id="name"
                                v-model="fullName"
                                required
                                placeholder="Họ tên (*)"
                            />
                            <input
                                type="text"
                                id="phone"
                                v-model="phone"
                                required
                                placeholder="Số điện thoại (*)"
                            />
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="form-row">
                            <input
                                type="number"
                                id="guests"
                                v-model="numberOfGuests"
                                min="1"
                                required
                                placeholder="Số khách (*)"
                            />
                            <select id="discount" v-model="selectedDiscount">
                                <option value="">
                                    --Chọn mã giảm giá (nếu có)--
                                </option>
                                <option
                                    v-for="(
                                        discount, index
                                    ) in filteredDiscount"
                                    :key="index"
                                    :value="discount.maKhuyenMai"
                                >
                                    {{ discount.tenKhuyenMai }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="form-row">
                            <input
                                type="date"
                                id="date"
                                v-model="reservationDate"
                                required
                                placeholder="Chọn ngày (*)"
                                :min="minDate"
                                :max="maxDate"
                            />
                            <input
                                type="time"
                                id="time"
                                v-model="reservationTime"
                                required
                                placeholder="Chọn giờ (*)"
                                :min="'08:00'"
                                :max="'21:00'"
                            />
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="radio-group">
                            <div
                                v-for="(khuVuc, index) in danhSachKhuVuc"
                                :key="index"
                                class="group-item"
                            >
                                <input
                                    type="radio"
                                    :value="khuVuc.maKhuVuc"
                                    :id="`area-${khuVuc.maKhuVuc}`"
                                    v-model="selectedArea"
                                />
                                <label :for="`area-${khuVuc.maKhuVuc}`">{{
                                    khuVuc.tenKhuVuc
                                }}</label>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="form-row">
                            <select id="table" v-model="selectedTable" required>
                                <option value="">--Chọn bàn--</option>
                                <option
                                    v-for="table in filteredBan"
                                    :key="table.maBan"
                                    :value="table.maBan"
                                >
                                    Bàn số: {{ table.maBan }} -
                                    {{ table.tenKhuVuc }} - SL ghế:
                                    {{ table.soLuongKhachToiDa }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <textarea
                            id="message"
                            v-model="message"
                            placeholder="Lời nhắn với Nhà hàng"
                        ></textarea>
                    </div>

                    <div class="form-buttons">
                        <BaseButton
                            type="submit"
                            btnTitle="ĐẶT BÀN NGAY"
                            variant="primary"
                        />
                        <BaseButton
                            @click="resetForm"
                            btnTitle="NHẬP LẠI"
                            variant="cancel-btn-color"
                        />
                    </div>
                </form>
            </div>

            <div class="order-summary">
                <h2 class="order-summary-title">Tổng cộng</h2>
                <ul>
                    <li>
                        <b>Tổng cộng:</b>
                        <span
                            >{{
                                parseInt(totalAmount).toLocaleString("vi-VN")
                            }}đ</span
                        >
                    </li>
                    <li>
                        <b>Phụ phí KV:</b>
                        <span
                            >{{
                                parseInt(surcharge).toLocaleString("vi-VN")
                            }}đ</span
                        >
                    </li>
                    <li>
                        <b>Giảm giá:</b>
                        <span
                            >{{
                                parseInt(discountValue).toLocaleString("vi-VN")
                            }}đ</span
                        >
                    </li>
                    <li>
                        <b>Thuế VAT (8%):</b>
                        <span
                            >{{
                                parseInt(taxValue).toLocaleString("vi-VN")
                            }}đ</span
                        >
                    </li>
                    <li>
                        <b>Thành tiền:</b>
                        <span
                            >{{
                                parseInt(finalAmount).toLocaleString("vi-VN")
                            }}đ</span
                        >
                    </li>
                </ul>
            </div>
        </section>
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

.cart-section-title {
    font-size: 2rem;
    color: var(--brown-color);
    margin-bottom: 10px;
}

.cart-table table {
    width: 100%;
    border-collapse: collapse;
}

.cart-table th,
.cart-table td {
    padding: 10px;
    text-align: center;
    border: 1px solid var(--dark-gray-color);
    font-size: 1.6rem;
    color: var(--black-color);
}

.cart-table th {
    background-color: var(--light-green-color);
}

.cart-table tr {
    background-color: var(--white-color);
}

.cart-table tr:hover {
    background-color: var(--blue-color);
}

.cart-table td:hover {
    background-color: var(--light-blue-color);
}

.cart-table td:nth-child(4) {
    text-align: left;
}
.cart-table td:nth-child(4):hover {
    color: var(--yellow-color);
    cursor: pointer;
}

.cart-table tr:hover {
    background-color: var(--light-blue-color);
}

.cart-table tfoot {
    font-weight: bold;
}

.total-label {
    text-align: right !important;
    padding-right: 40px !important;
}

.total-amount {
    text-align: left !important;
    color: var(--red-color) !important;
    padding-left: 45px !important;
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

.cart-table td button {
    background-color: var(--light-gray-color);
    border: 1px solid var(--dark-gray-color);
    padding: 5px;
    margin: 0 10px;
}

.cart-table td button:hover {
    transform: scale(1.04);
}

.cart-table td .trash-icon {
    background-color: var(--white-color);
    border: none;
    color: var(--red-color);
    font-size: 2rem;
    padding: 5px;
    margin: 0 5px;
}
.cart-table td .trash-icon:hover {
    transform: scale(1.04);
}

.action-container {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 0 30px;
}

.cart-actions button {
    padding: 10px 20px;
    margin-right: 20px;
}

.placeOrder-btn {
    display: block;
    margin: 50px auto;
}

.pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 40px;
    gap: 10px;
}

.pagination-btn,
.pagination-number {
    padding: 10px 20px;
    font-size: 1.6rem;
    cursor: pointer;
    background: var(--cream-color);
    border: 1px solid var(--yellow-color);
    border-radius: 50%;
    transition: background 0.3s ease, color 0.3s ease;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--brown-color);
    width: 40px;
    height: 40px;
}

.pagination-btn:hover,
.pagination-number:hover {
    background-color: var(--light-yellow);
    color: var(--cream-color);
}

.pagination-btn:disabled,
.pagination-number:disabled {
    background: var(--light-gray-color);
    cursor: not-allowed;
}

.pagination-btn i,
.pagination-number i {
    font-size: 1.4rem;
}

.pagination-btn.active,
.pagination-number.active {
    background-color: var(--yellow-color);
    color: var(--cream-color);
}

@media (max-width: 1200px) {
    .page-container {
        padding: 50px 50px;
    }

    h1 {
        font-size: 2.5rem;
    }

    .cart-table th,
    .cart-table td {
        font-size: 1.4rem;
    }

    .total-label,
    .total-amount {
        font-size: 1.4rem;
    }

    .pagination-btn,
    .pagination-number {
        padding: 8px 16px;
        font-size: 1.4rem;
    }

    .dish-image {
        width: 40px;
        height: 40px;
    }

    .action-container {
        flex-direction: column;
        align-items: center;
    }

    .cart-actions button {
        margin-bottom: 10px;
    }
}

@media (max-width: 768px) {
    .page-container {
        padding: 40px 20px;
    }

    h1 {
        font-size: 2rem;
    }

    .cart-table th,
    .cart-table td {
        font-size: 1.2rem;
    }

    .total-label,
    .total-amount {
        font-size: 1.2rem;
    }

    .pagination-btn,
    .pagination-number {
        padding: 6px 12px;
        font-size: 1.2rem;
    }

    .dish-image {
        width: 35px;
        height: 35px;
    }

    .action-container {
        flex-direction: column;
        align-items: center;
        padding: 0;
    }

    .cart-actions button {
        margin-bottom: 15px;
    }

    .placeOrder-btn {
        margin-top: 20px;
    }
}

@media (max-width: 480px) {
    .page-container {
        padding: 30px 10px;
    }

    h1 {
        font-size: 1.5rem;
    }

    .cart-table th,
    .cart-table td {
        font-size: 1rem;
        padding: 8px;
    }

    .total-label,
    .total-amount {
        font-size: 1.2rem;
    }

    .pagination-btn,
    .pagination-number {
        padding: 6px 12px;
        font-size: 1rem;
    }

    .dish-image {
        width: 30px;
        height: 30px;
    }

    .action-container {
        flex-direction: column;
        align-items: center;
        padding: 0;
    }

    .cart-actions button {
        margin-bottom: 10px;
    }

    .placeOrder-btn {
        margin-top: 20px;
    }
}

/* order section */
.order-section {
    display: flex;
    justify-content: space-between;
    margin-top: 60px;
    color: var(--black-color);
    font-size: 1.6rem;
}

.order-info {
    flex: 0 0 70%;
    padding: 30px;
    background-color: var(--white-color);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    margin-right: 50px;
}

.order-summary {
    flex: 0 0 25%;
    padding: 30px;
    background-color: var(--white-color);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}

.order-info-title,
.order-summary-title {
    font-size: 2.4rem;
    font-weight: bold;
    margin-bottom: 30px;
    text-align: center;
}

.form-group {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
}

.form-row {
    display: flex;
    justify-content: space-between;
    gap: 30px;
}
input,
select,
textarea {
    width: 100%;
    padding: 12px;
    font-size: 1.6rem;
    border: 1px solid var(--light-gray-color);
    border-radius: 5px;
}

input::placeholder,
select::placeholder,
textarea::placeholder {
    color: var(--dark-gray-color);
}

textarea {
    resize: vertical;
    height: 100px;
}
.radio-group {
    display: flex;
    justify-content: space-around;
    align-items: center;
}

.group-item {
    display: flex;
    justify-content: space-between;
}

.radio-group input {
    margin-right: 10px;
    width: 50px;
}

.radio-group label {
    font-size: 1.6rem;
    margin-right: 15px;
    display: inline-block;
}
.form-buttons {
    display: flex;
    justify-content: center;
    margin-top: 30px;
    gap: 50px;
}

.order-summary ul {
    list-style: none;
}

.order-summary li {
    font-size: 1.6rem;
    margin-bottom: 12px;
    color: var(--black-color);
    border-top: 1px solid var(--light-gray-color);
    padding-top: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.order-summary ul li:last-child {
    padding-top: 30px;
}

.order-summary ul li:last-child span {
    font-weight: bold;
    color: var(--red-color);
}

@media (max-width: 768px) {
    .order-section {
        flex-direction: column;
        align-items: center;
    }

    .order-info,
    .order-summary {
        margin: 0;
        width: 100%;
        max-width: 600px;
    }

    .order-info-title,
    .order-summary-title {
        font-size: 2rem;
        text-align: left;
    }

    .form-group label {
        font-size: 1.4rem;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
        font-size: 1.4rem;
    }

    .form-buttons button {
        font-size: 1.4rem;
        padding: 10px 25px;
    }

    .order-summary ul li {
        font-size: 1.4rem;
    }

    .order-summary li span,
    .order-summary li strong {
        width: 100%;
        text-align: left;
    }
}
</style>
