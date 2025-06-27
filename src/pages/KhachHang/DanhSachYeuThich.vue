<script setup>
import { useRouter } from "vue-router";
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import slugify from "slugify";
import Swal from "sweetalert2";
import BreadCrumb from "@/components/BreadCrumb.vue";
import BaseButton from "@/components/BaseButton.vue";

import { saveSearchHistory } from "@/services/lichsutimkiem";
import { fetchMAYeuThich, toggleFavoriteDishes } from "@/services/yeuthich";
import {
    fetchGioHang,
    addDishesToCart,
    deleteDishFromCart,
    updateSLInCart,
} from "@/services/giohang";

const { user } = useAuthStore();
const auth = useAuthStore();
const router = useRouter();

const danhSachYeuThich = ref([]);
const danhSachGioHang = ref([]);
const isCartOpen = ref(false);
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 8;

const toPage = (page) => {
    router.push({ name: page });
    window.scrollTo(0, 0);
};

const logout = async () => {
    const result = await Swal.fire({
        title: "Bạn có chắc chắn muốn đăng xuất không?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Đăng xuất",
        cancelButtonText: "Hủy",
        reverseButtons: true,
    });

    if (result.isConfirmed) {
        auth.logout(); // Xoá token, user trong store
        await Swal.fire({
            icon: "success",
            title: "Bạn đã đăng xuất thành công!",
            timer: 1500,
            showConfirmButton: false,
        });
        router.push("/DangNhap"); // Chuyển về trang đăng nhập
    }
};

function getMainImage(images = []) {
    if (!Array.isArray(images)) return "";
    const main = images.find((i) => i.anhChinh) || images[0] || {};
    return main.url || "";
}

const goToDishDetail = (dish) => {
    const slug = slugify(dish.tenMonAn, { lower: true });
    router.push({
        name: "ChiTietMonAnFromLike",
        params: {
            maMonAn: dish.maMonAn,
            slug: slug,
        },
    });
};

function normalizeRating(rating) {
    const integer = Math.floor(rating);
    const fraction = rating - integer;

    if (fraction < 0.5) {
        return integer;
    } else if (fraction === 0.5) {
        return integer + 0.5;
    } else {
        return integer + 1;
    }
}

function getStarIcons(rating) {
    const value = normalizeRating(rating);
    const fullCount = Math.floor(value);
    const hasHalf = value % 1 === 0.5;
    const stars = [];

    for (let i = 1; i <= 5; i++) {
        if (i <= fullCount) {
            stars.push("full");
        } else if (hasHalf && i === fullCount + 1) {
            stars.push("half");
        } else {
            stars.push("empty");
        }
    }
    return stars;
}

// Hàm toggle yêu thích (thêm/xóa món ăn yêu thích)
const toggleFavorite = async (dish) => {
    try {
        console.log("User ID:", user.id);
        const response = await toggleFavoriteDishes(user.id, dish.maMonAn);
        console.log("Món ăn đã được " + response.action);
        if (response.action === "added") {
            danhSachYeuThich.value.push(dish);
            Swal.fire({
                title: "Đã thêm vào yêu thích!",
                text: "Bạn có muốn xem danh sách món ăn yêu thích không?",
                icon: "success",
                showCancelButton: true,
                confirmButtonText: "Xem ngay",
                cancelButtonText: "OK",
            }).then((result) => {
                if (result.isConfirmed) {
                    router.push({ name: "DanhSachYeuThich" });
                }
            });
        } else {
            danhSachYeuThich.value = danhSachYeuThich.value.filter(
                (d) => d.maMonAn !== dish.maMonAn
            );
            Swal.fire({
                title: "Đã xóa khỏi danh sách yêu thích!",
                icon: "info",
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        }
        loadFavoriteDishes();
    } catch (error) {
        console.error("Lỗi khi toggle món ăn yêu thích:", error);
    }
};

// Hàm tải lại danh sách món ăn yêu thích
const loadFavoriteDishes = async () => {
    try {
        const MAYTData = await fetchMAYeuThich(user.id);
        danhSachYeuThich.value = MAYTData;
        console.log("Dữ liệu món ăn yêu thích: ", danhSachYeuThich.value);
    } catch (error) {
        console.error("Lỗi khi tải lại danh sách món ăn yêu thích:", error);
    }
};

const addOneDishToCart = async (dish) => {
    isCartOpen.value = true;
    const data = {
        maMonAn: dish.maMonAn,
        soLuongThem: 1,
    };

    if (dish.soLuongMonCon === 0) {
        Swal.fire({
            title: "Món ăn đã hết!",
            text: "Món ăn này hiện tại không còn trong kho.",
            icon: "error",
            confirmButtonText: "OK",
        });
        return;
    }

    const currentDishInCart = danhSachGioHang.value.find(
        (item) => item.maMonAn === data.maMonAn
    );

    if (currentDishInCart) {
        if (currentDishInCart.soLuongThem >= currentDishInCart.soLuongMonCon) {
            Swal.fire({
                title: "Số lượng tối đa đã đạt!",
                text: "Bạn đã thêm đủ số lượng món ăn này vào giỏ hàng.",
                icon: "info",
                confirmButtonText: "OK",
            });
            return;
        } else {
            const totalQuantity =
                currentDishInCart.soLuongThem + data.soLuongThem;

            if (totalQuantity > dish.soLuongMonCon) {
                data.soLuongThem =
                    dish.soLuongMonCon - currentDishInCart.soLuongThem;
            }
        }
    }

    try {
        const response = await addDishesToCart(
            user.id,
            data.maMonAn,
            data.soLuongThem
        );
        Swal.fire(
            "Thành công!",
            "Món ăn đã được thêm vào giỏ hàng.",
            "success"
        );
        loadData();
    } catch (error) {
        console.error("Lỗi thêm món vào giỏ hàng:", error);
        Swal.fire("Lỗi!", "Không thể thêm món ăn vào giỏ hàng.", "error");
    }
};
const closeCart = () => {
    isCartOpen.value = false;
};

const decreaseQuantity = (item) => {
    if (item.soLuongThem > 1) {
        item.soLuongThem--;
        updateQuantityInCart(item);
    } else {
        Swal.fire({
            title: "Bạn có chắc chắn muốn xóa món ăn này không?",
            text: "Món ăn sẽ bị xóa khỏi giỏ hàng.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                item.soLuongThem--;
                deleteDishFromCart(user.id, item.maMonAn).then(() => {
                    loadData();
                });
            }
        });
    }
};

const increaseQuantity = (item) => {
    if (item.soLuongThem < item.soLuongMonCon) {
        item.soLuongThem++;
        updateQuantityInCart(item);
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

const removeItem = (maMonAn) => {
    Swal.fire({
        title: "Bạn có chắc chắn muốn xóa món ăn này không?",
        text: "Món ăn sẽ bị xóa khỏi giỏ hàng.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    }).then((result) => {
        if (result.isConfirmed) {
            deleteDishFromCart(user.id, maMonAn).then(() => {
                loadData();
            });
        }
    });
};

//Hàm lưu từ khóa tìm kiếm
const search = async () => {
    console.log("Attempting to save search history:", searchQuery.value);
    console.log("User ID:", user.id);

    if (searchQuery.value.trim() && user) {
        await saveSearchHistory(user.id, searchQuery.value);
    }
};

//Hàm lấy các món ăn đã lọc theo từ khóa tìm kiếm
const filteredDishes = computed(() => {
    let filtered = danhSachYeuThich.value;

    if (searchQuery.value) {
        filtered = filtered.filter((dish) =>
            dish.tenMonAn
                .toLowerCase()
                .includes(searchQuery.value.toLowerCase())
        );
    }

    return filtered;
});

//Hàm chuyển trang
const goToPage = (page) => {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    window.scrollTo(0, 0);
};

// Hàm để reset trang về 1 khi thay đổi tìm kiếm hoặc loại món ăn
const resetPage = () => {
    currentPage.value = 1;
};

//Hàm tính toán số trang tổng cộng:
const totalPages = computed(() => {
    return Math.ceil(filteredDishes.value.length / itemsPerPage);
});

//Hàm lấy danh sách mon ăn cho trang hiện tại:
const paginationDishes = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = currentPage.value * itemsPerPage;
    return filteredDishes.value.slice(start, end);
});

async function loadData() {
    try {
        // Lấy danh sách món ăn yêu
        console.log("User ID: ", user.id);
        const MAYTData = await fetchMAYeuThich(user.id);
        danhSachYeuThich.value = MAYTData;
        console.log("Dữ liệu món ăn yêu thích: ", danhSachYeuThich.value);
        window.scrollTo(0, 0);

        //Lấy danh sách giỏ hàng
        const ghData = await fetchGioHang(user.id);
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
        <div class="left-nav">
            <ul>
                <li @click="toPage('ThongTinCaNhan')">Thông tin tài khoản</li>
                <li class="active" @click="toPage('DanhSachYeuThich')">
                    Món ăn yêu thích
                </li>
                <li @click="toPage('LichSuDatBan')">Lịch sử đặt bàn</li>
                <li @click="toPage('ThongBao')">Thông báo</li>
                <li @click="logout">Đăng xuất</li>
            </ul>
        </div>

        <div class="right-content">
            <h2>MÓN ĂN YÊU THÍCH</h2>
            <!-- Search Bar -->
            <div class="search-container">
                <div class="search-icon">
                    <i class="fas fa-search"></i>
                </div>
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Tìm món ăn ..."
                    @input="resetPage"
                    @keyup.enter="search"
                />
            </div>
            <section class="recommended-dishes">
                <div class="dishes-list">
                    <div
                        v-for="(dish, index) in paginationDishes"
                        :key="dish.maMonAn"
                        class="dish-item"
                    >
                        <!-- Thẻ BEST SELLER -->
                        <div v-if="dish.isBestSeller" class="best-seller-tag">
                            <img
                                src="/assets/images/bestSellerTag.png"
                                alt="Best Seller Tag"
                            />
                        </div>

                        <div
                            class="dish-card__thumb"
                            :style="`background-image:url(${getMainImage(
                                dish.anhMonAn
                            )})`"
                        ></div>
                        <div class="dish-card__body">
                            <h3
                                class="dish-card__title"
                                @click="goToDishDetail(dish)"
                            >
                                {{ dish.tenMonAn }}
                            </h3>
                            <div class="stars-icon">
                                <i
                                    v-for="(type, idx) in getStarIcons(
                                        dish.avgRating
                                    )"
                                    :key="idx"
                                    :class="{
                                        'fas fa-star': type === 'full',
                                        'fas fa-star-half-alt': type === 'half',
                                        'far fa-star': type === 'empty',
                                    }"
                                ></i>
                            </div>
                            <div class="dish-card__sub-body">
                                <div class="dish-card__price">
                                    <span class="current">
                                        {{
                                            parseInt(
                                                dish.donGia
                                            ).toLocaleString("vi-VN")
                                        }}đ
                                    </span>
                                    <span class="original">
                                        {{
                                            parseInt(
                                                dish.giaGoc
                                            ).toLocaleString("vi-VN")
                                        }}đ
                                    </span>
                                </div>
                                <div class="dish-card__icon">
                                    <i
                                        :class="{
                                            'fas fa-heart':
                                                danhSachYeuThich.some(
                                                    (d) =>
                                                        d.maMonAn ===
                                                        dish.maMonAn
                                                ), // Kiểm tra nếu món ăn có trong danh sách yêu thích
                                            'far fa-heart':
                                                !danhSachYeuThich.some(
                                                    (d) =>
                                                        d.maMonAn ===
                                                        dish.maMonAn
                                                ), // Nếu không có thì hiển thị heart rỗng
                                        }"
                                        @click="toggleFavorite(dish)"
                                    ></i>
                                </div>
                            </div>
                            <BaseButton
                                btnTitle="THÊM VÀO GIỎ HÀNG"
                                variant="primary"
                                class="btn"
                                @click="addOneDishToCart(dish)"
                            />
                        </div>
                    </div>
                </div>
            </section>
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
    </div>
    <!-- <div class="overlay"></div> -->
    <div class="cart-sidebar" v-if="isCartOpen">
        <div class="cart-header">
            <div class="cart-header-content">
                <i class="fas fa-shopping-cart"></i>
                <span class="cart-header-title">Giỏ hàng</span>
            </div>
            <button class="cart-close-btn" @click="closeCart">×</button>
        </div>
        <div class="cart-body">
            <div class="cart-list">
                <div
                    class="cart-item"
                    v-for="cartItem in danhSachGioHang"
                    :key="cartItem.maMonAn"
                >
                    <div class="cart-item-info">
                        <img
                            :src="getMainImage(cartItem.anhMonAn)"
                            alt="Ảnh món ăn"
                            class="cart-item-image"
                        />
                        <div class="cart-item-details">
                            <h3 class="cart-item-title">
                                {{ cartItem.tenMonAn }}
                            </h3>
                            <div class="cart-item-price">
                                {{
                                    parseInt(cartItem.donGia).toLocaleString(
                                        "vi-VN"
                                    )
                                }}đ
                            </div>
                        </div>
                    </div>
                    <div class="cart-item-quantity">
                        <button
                            class="quantity-decrease"
                            @click="decreaseQuantity(cartItem)"
                        >
                            -
                        </button>
                        <span class="quantity">{{ cartItem.soLuongThem }}</span>
                        <button
                            class="quantity-increase"
                            @click="increaseQuantity(cartItem)"
                        >
                            +
                        </button>
                    </div>
                    <div
                        class="remove-item"
                        @click="removeItem(cartItem.maMonAn)"
                    >
                        <i class="fas fa-trash"></i>
                    </div>
                </div>
            </div>
            <div class="cart-total">
                <div class="cart-total-label">Tổng cộng:</div>
                <div class="cart-total-price">
                    {{ parseInt(totalAmount).toLocaleString("vi-VN") }}đ
                </div>
            </div>
            <div class="cart-buttons">
                <BaseButton
                    btnTitle="XEM GIỎ HÀNG"
                    variant="primary"
                    @click="toPage('GioHang')"
                ></BaseButton>
                <BaseButton
                    btnTitle="ĐẶT BÀN NGAY"
                    variant="primary"
                    @click="toPage('DatBan')"
                ></BaseButton>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page-container {
    padding: 0px;
    width: 100%;
    background-image: url("/assets/images/cream-bg.png");
    background-size: cover;
    background-repeat: no-repeat;
    background-position: top top;
    margin-bottom: 10px;
    padding-bottom: 0;

    display: flex;
    justify-content: space-between;
}

.left-nav {
    width: 300px;
    background-color: var(--yellow-color);
}

.left-nav ul {
    list-style: none;
}

.left-nav ul li {
    padding: 15px 30px;
    color: var(--cream-color);
    cursor: pointer;
    text-transform: uppercase;
    border-bottom: 1px solid var(--brown-color);
    transition: background-color 0.3s;
    font-size: 1.6rem;
    font-weight: 600;
}

.left-nav ul li:hover,
.left-nav ul li.active {
    background-color: #7e5525;
}

.right-content {
    flex: 1;
    padding: 50px 50px;
}

h2 {
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 30px;
    font-size: 3rem;
    color: var(--brown-color);
}

/* phần danh sách món ăn */

.recommended-dishes {
    margin-top: 20px;
    padding-top: 20px;
}

.section-title {
    font-size: 2.6rem;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    color: var(--brown-color);
    margin-bottom: 40px;
    position: relative;
}

.section-title::before {
    content: "";
    display: block;
    width: 100%;
    height: 2px;
    background-color: var(--yellow-color);
    margin: 10px auto 20px auto;
}

.dishes-list {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 20px;
}

.dish-item {
    background: var(--white-color);
    color: var(--brown-color);
    border-radius: 8px;
    width: 280px;
    height: 380px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 12px;
    transform-origin: center;
    position: relative;
}

.dish-item:hover .dish-card__thumb {
    transform: scale(1.03);
}

.dish-card__thumb {
    height: 180px;
    background-size: cover;
    background-position: center;
    transition: transform 0.3s ease;
}

.dish-card__body {
    padding: 10px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.dish-card__title {
    font-size: 1.8rem;
    text-transform: uppercase;
    text-align: left;
    font-weight: 700;
    cursor: pointer;
}

.dish-card__title:hover {
    color: var(--yellow-color);
}

.stars-icon {
    font-size: 1.2rem;
    color: var(--light-yellow);
}

.dish-card__sub-body {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
}

.dish-card__price {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.dish-card__price .current {
    font-weight: 700;
    font-size: 1.6rem;
    color: var(--red-color);
}

.dish-card__price .original {
    text-decoration: line-through;
    color: var(--dark-gray-color);
    font-size: 1.2rem;
}

.dish-card__icon {
    font-size: 2rem;
    cursor: pointer;
    color: var(--red-color);
    transition: transform 0.3s ease, color 0.3s ease;
}

.dish-card__icon:hover {
    transform: scale(1.2);
}

.dish-card__body .btn {
    width: 100%;
    padding: 12px;
    font-size: 1.4rem;
}

/* Cart-slide */
/* Lớp phủ (overlay) */
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    /* display: none; */
    display: block;
    z-index: 2;
}

.overlay.show {
    display: block;
}

.cart-sidebar {
    position: fixed;
    top: 0;
    right: 0;
    width: 500px;
    height: 100vh;
    background-color: var(--white-color);
    box-shadow: -4px 0 10px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    z-index: 3;
}

.cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 30px 20px 30px 50px;
    margin-bottom: 20px;
    background-color: var(--light-green-color);
}

.cart-header-content {
    display: flex;
    align-items: center;
    color: var(--brown-color);
}

.cart-header i {
    font-size: 2rem;
    margin-right: 30px;
}

.cart-header-title {
    font-size: 2rem;
    font-weight: bold;
    text-transform: uppercase;
}

.cart-close-btn {
    background: none;
    border: none;
    font-size: 3.4rem;
    cursor: pointer;
    color: var(--brown-color);
}
.cart-close-btn:hover {
    color: var(--red-color);
    transform: scale(1.03);
}

.cart-body {
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    align-items: space-between;
    height: 100%;
}

.cart-list {
    max-height: 60vh;
    overflow-y: auto;
}

.cart-item {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 10px;
    width: 100%;
}

.cart-item-info {
    display: flex;
    align-items: center;
    color: var(--black-color);
    font-size: 1.6rem;
    flex: 1;
}

.cart-item-image {
    width: 50px;
    height: 50px;
    object-fit: cover;
    margin-right: 10px;
    width: 20%;
    flex-shrink: 0;
}

.cart-item-details {
    display: flex;
    flex-direction: column;
    width: 80%;
}

.cart-item-title {
    font-weight: bold;
    margin-bottom: 5px;
}

.cart-item-price {
    color: var(--red-color);
}

.cart-item-quantity {
    display: flex;
    align-items: center;
    margin-left: 20px;
    width: 15%;
}

.quantity {
    margin: 0 10px;
}

.cart-item-quantity button {
    background-color: var(--light-gray-color);
    border: none;
    padding: 5px 10px;
    cursor: pointer;
}

.cart-item-quantity button:hover {
    background-color: var(--dark-gray-color);
}

.remove-item {
    background-color: none;
    color: var(--red-color);
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    font-size: 2rem;
    margin-left: 30px;
}

.cart-total {
    margin-top: auto;
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    padding: 10px 0;
    border-top: 1px solid var(--light-gray-color);
    border-bottom: 1px solid var(--light-gray-color);
}

.cart-total-label {
    font-weight: bold;
}

.cart-total-price {
    color: var(--red-color);
}

.cart-buttons {
    width: 100%;
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
}

.cart-buttons button {
    margin: 10px 0;
}
/* phần search */
.search-container {
    margin-bottom: 20px;
    text-align: center;
    position: relative;
}

.search-container input {
    padding: 10px 30px 10px 40px;
    font-size: 1.6rem;
    width: 60%;
    border-radius: 20px;
    color: var(--black-color);
}

.search-icon {
    position: absolute;
    left: 250px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.8rem;
    color: var(--black-color);
}

/* phân trang */
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

@media (max-width: 1200px) {
    .right-content {
        padding: 40px 30px;
    }

    .dish-item {
        width: 240px;
        height: 360px;
    }

    .dishes-list {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 992px) {
    .page-container {
        flex-direction: column;
    }

    .left-nav {
        width: 100%;
        display: flex;
        overflow-x: auto;
    }

    .left-nav ul {
        display: flex;
        width: 100%;
        padding: 0;
        margin: 0;
    }

    .left-nav ul li {
        flex: 1 0 auto;
        text-align: center;
        white-space: nowrap;
    }

    .dishes-list {
        grid-template-columns: repeat(2, 1fr);
    }

    .search-container input {
        width: 80%;
    }

    .search-icon {
        left: 20px;
    }
}

@media (max-width: 768px) {
    .right-content {
        padding: 20px;
    }

    .dish-item {
        width: 100%;
    }

    .dish-card__title {
        font-size: 1.6rem;
    }

    .dish-card__price .current {
        font-size: 1.4rem;
    }

    .dish-card__icon {
        font-size: 1.6rem;
    }

    .pagination-btn,
    .pagination-number {
        width: 36px;
        height: 36px;
        font-size: 1.4rem;
    }
}

@media (max-width: 576px) {
    .cart-sidebar {
        width: 100%;
    }

    .dish-item {
        height: auto;
    }

    .cart-item-info {
        font-size: 1.4rem;
    }

    .search-container input {
        width: 100%;
        padding-left: 35px;
    }

    .search-icon {
        left: 10px;
    }

    h2 {
        font-size: 2.4rem;
    }

    .pagination-controls {
        flex-wrap: wrap;
    }
}

/* best seller tag */
.best-seller-tag {
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 2;
}

.best-seller-tag img {
    width: 100px;
    height: auto;
}
</style>
