<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import slugify from "slugify";
import Swal from "sweetalert2";
import BreadCrumb from "@/components/BreadCrumb.vue";
import BaseButton from "@/components/BaseButton.vue";

import { fetchMonAn } from "@/services/monan";
import {
    fetchGioHang,
    addDishesToCart,
    deleteDishFromCart,
    updateSLInCart,
} from "@/services/giohang";

const router = useRouter();
const { user } = useAuthStore();
const cartStore = useCartStore();
const danhSachMonAn = ref([]);
const currentPage = ref(1);
const itemsPerPage = 15;
const danhSachGioHang = ref([]);
const selectedItems = ref([]);

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
        name: "ChiTietMonAnFromCart",
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
    window.scrollTo(0, 0);
};

const goToOrders = () => {
    router.push({
        name: "DatBanFromCart",
    });
    window.scrollTo(0, 0);
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

async function loadData() {
    try {
        const [monAnData, ghData] = await Promise.all([
            fetchMonAn(),
            fetchGioHang(user.id),
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

        // Món ăn
        if (Array.isArray(monAnData)) {
            danhSachMonAn.value = monAnData;
            console.log("danhSachMonAn:", danhSachMonAn.value);
        } else {
            console.error("Lỗi dữ liệu món ăn:", monAnData);
        }

        console.log("Số lượng món ăn trong giỏ hàng:", ghData.soLuongMonAn);
        console.log("Dữ liệu giỏ hàng:", ghData);
        danhSachGioHang.value = ghData;
        console.log("Dữ liệu món ăn trong giỏ hàng: ", danhSachGioHang.value);
    } catch (err) {
        console.error("Lỗi loadData:", err);
    }
}

onMounted(async () => {
    //Fetch all
    await loadData();
});
</script>

<template>
    <BreadCrumb />
    <div class="page-container">
        <h1>Giỏ hàng</h1>
        <!-- Dishes List -->
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
                            {{ (currentPage - 1) * itemsPerPage + index + 1 }}
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
                                parseInt(monAn.donGia).toLocaleString("vi-VN")
                            }}đ
                        </td>
                        <td>
                            <button @click="decreaseQuantity(monAn)">-</button>
                            <span>{{ monAn.soLuongThem }}</span>
                            <button @click="increaseQuantity(monAn)">+</button>
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
                            {{ parseInt(totalAmount).toLocaleString("vi-VN") }}đ
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
            <!-- Pagination Controls -->
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
        <BaseButton
            @click="goToOrders"
            btnTitle="ĐẶT BÀN NGAY"
            variant="primary"
            class="placeOrder-btn"
        >
        </BaseButton>
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
    margin-bottom: 40px;
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

/* -------- */
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

/* Responsive*/
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
</style>
