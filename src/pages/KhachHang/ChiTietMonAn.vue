<script setup>
import { ref, computed, onMounted, toRaw, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import slugify from "slugify";
import Swal from "sweetalert2";
import { Carousel, Slide } from "vue3-carousel";
import { Pagination, Navigation } from "vue3-carousel";
import "vue3-carousel/dist/carousel.css";
import { format } from "date-fns";
import BreadCrumb from "@/components/BreadCrumb.vue";
import BaseButton from "@/components/BaseButton.vue";

import { fetchMonAn } from "@/services/monan";
import { fetchMAYeuThich, toggleFavoriteDishes } from "@/services/yeuthich";
import { fetchRecommendDishes } from "@/services/recommender-system";
import {
    fetchGioHang,
    addDishesToCart,
    deleteDishFromCart,
    updateSLInCart,
} from "@/services/giohang";

const route = useRoute();
const router = useRouter();
const { user } = useAuthStore();
const cartStore = useCartStore();
const maMonAn = ref(route.params.maMonAn);
const monAnDetail = ref({});
const soLuongChon = ref(1);
const currentTab = ref(0);
const comments = ref([]);
const sortOrder = ref("desc");
const danhSachYeuThich = ref([]);
const danhSachGioHang = ref([]);
const danhSachGoiY = ref([]);
const isCartOpen = ref(false);

const tabs = [
    { title: "Thông tin món ăn" },
    { title: "Thành phần chính" },
    { title: "Bình luận" },
];

const carouselOptions = {
    itemsToShow: 1,
    wrapAround: true,
    autoplay: 3000,
    pauseAutoplayOnHover: true,
    transition: 800,
    pagination: true,
    navigation: true,
};

const toPage = (page) => {
    router.push({ name: page });
    window.scrollTo(0, 0);
};

const formatDate = (date) => {
    return format(new Date(date), "dd/MM/yyyy");
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

function customRound(value) {
    if (value < 0) {
        return 0;
    }
    return Math.floor(value);
}

// Hàm tăng số lượng
const increaseQuantityDetail = () => {
    if (soLuongChon.value < monAnDetail.value.soLuongMonCon) {
        soLuongChon.value++;
    }
};

const decreaseQuantityDetail = () => {
    if (soLuongChon.value > 1) {
        soLuongChon.value--;
    }
};
//Hàm để đổi thứ tự lọc bình luận
const toggleSortOrder = () => {
    sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc";
};

// Hàm lấy ảnh chính
function getMainImage(images = []) {
    if (!Array.isArray(images)) return "";
    const main = images.find((i) => i.anhChinh) || images[0] || {};
    return main.url || "";
}

const goToDishDetail = (dish) => {
    const slug = slugify(dish.tenMonAn, { lower: true });
    console.log("Navigating to:", `/ThucDon/${dish.maMonAn}/${slug}`);
    router.push(`/ThucDon/${dish.maMonAn}/${slug}`).then(() => {
        nextTick(() => {
            loadData();
        });
    });
};

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
        danhSachYeuThich.value = MAYTData.slice(0, 8);
        danhSachYeuThich.value = MAYTData.filter(
            (dish) => dish.maMonAn !== monAnDetail.value.maMonAn
        ).slice(0, 8);
        console.log("Dữ liệu món ăn yêu thích: ", danhSachYeuThich.value);
    } catch (error) {
        console.error("Lỗi khi tải lại danh sách món ăn yêu thích:", error);
    }
};

//Hàm sắp xếp bình luận theo ngày
const sortedComments = computed(() => {
    const sorted = comments.value.sort((a, b) => {
        const dateA = new Date(a.thoiGianDanhGia);
        const dateB = new Date(b.thoiGianDanhGia);
        return sortOrder.value === "desc" ? dateB - dateA : dateA - dateB;
    });

    return sorted;
});

//Hàm thêm món ăn vào giỏ hàng:
const addDetailDishToCart = async () => {
    isCartOpen.value = true;
    const data = {
        maMonAn: monAnDetail.value.maMonAn,
        soLuongThem: soLuongChon.value,
    };

    if (monAnDetail.value.soLuongMonCon === 0) {
        Swal.fire({
            title: "Món ăn đã hết!",
            text: "Món ăn này hiện tại không còn trong kho.",
            icon: "error",
            confirmButtonText: "OK",
        });
        return;
    }

    // Tìm món ăn trong giỏ hàng
    const currentDishInCart = danhSachGioHang.value.find(
        (item) => item.maMonAn === data.maMonAn
    );

    if (currentDishInCart) {
        if (currentDishInCart.soLuongThem === monAnDetail.value.soLuongMonCon) {
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

            if (totalQuantity > monAnDetail.value.soLuongMonCon) {
                data.soLuongThem =
                    monAnDetail.value.soLuongMonCon -
                    currentDishInCart.soLuongThem;
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

        //cập nhật totalItemCount
        await cartStore.calculateTotalItemCount(user.id);

        loadData();
    } catch (error) {
        console.error("Lỗi thêm món vào giỏ hàng:", error);
        Swal.fire("Lỗi!", "Không thể thêm món ăn vào giỏ hàng.", "error");
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

        //cập nhật totalItemCount
        await cartStore.calculateTotalItemCount(user.id);

        loadData();
    } catch (error) {
        console.error("Lỗi thêm món vào giỏ hàng:", error);
        Swal.fire("Lỗi!", "Không thể thêm món ăn vào giỏ hàng.", "error");
    }
};
const closeCart = () => {
    isCartOpen.value = false;
};

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

const breadcrumbText = computed(() => {
    return [
        { text: "Trang chủ", to: "/" },
        { text: "Thực đơn", to: "/ThucDon" },
        { text: monAnDetail.value.tenMonAn },
    ];
});

async function loadData() {
    try {
        const monAnData = await fetchMonAn();
        console.log("Dữ liệu món ăn trả về:", monAnData);

        const monAn = monAnData.find(
            (mon) => mon.maMonAn === parseInt(maMonAn.value)
        );

        if (monAn) {
            monAnDetail.value = monAn;
            console.log("Mã món ăn chi tiết: ", monAnDetail.value.maMonAn);
            console.log("Ảnh món ăn nn:", monAnDetail.value.anhMonAn);
            route.meta.breadcrumb[2] = { text: monAn.tenMonAn };

            comments.value = monAn.danhGia;
            console.log("Bình luận món ăn: ", comments.value);
        } else {
            console.error("Không tìm thấy món ăn với mã: ", maMonAn.value);
        }

        // Lấy danh sách món ăn yêu
        console.log("User ID: ", user.id);
        const MAYTData = await fetchMAYeuThich(user.id);
        danhSachYeuThich.value = MAYTData.slice(0, 8);
        danhSachYeuThich.value = MAYTData.filter(
            (dish) => dish.maMonAn !== monAnDetail.value.maMonAn
        ).slice(0, 8);
        console.log("Dữ liệu món ăn yêu thích: ", danhSachYeuThich.value);
        window.scrollTo(0, 0);

        //Lấy danh sách giỏ hàng
        const ghData = await fetchGioHang(user.id);
        danhSachGioHang.value = ghData;
        console.log("Dữ liệu món ăn trong giỏ hàng: ", danhSachGioHang.value);

        //Lấy danh sách món ăn gợi ý (content-based-filtering)
        const response = await fetchRecommendDishes(monAnDetail.value.maMonAn);
        if (response["Mon an goi y"]) {
            const rawMonAnData = toRaw(monAnData);
            danhSachGoiY.value = rawMonAnData.filter((dish) =>
                response["Mon an goi y"].some(
                    (recommendedDish) =>
                        recommendedDish.maMonAn === dish.maMonAn
                )
            );
            //Giữ thứ từ của `response["Mon an goi y"]`
            const recommendedDishIds = response["Mon an goi y"].map(
                (dish) => dish.maMonAn
            );
            // Sắp xếp lại danh sách món ăn gợi ý theo thứ tự trong `response["Mon an goi y"]`
            danhSachGoiY.value = danhSachGoiY.value.sort((a, b) => {
                return (
                    recommendedDishIds.indexOf(a.maMonAn) -
                    recommendedDishIds.indexOf(b.maMonAn)
                );
            });
        }
        console.log("Món ăn gợi ý: ", danhSachGoiY.value);
    } catch (err) {
        console.error("Lỗi loadData:", err);
    }
}

onMounted(loadData);

watch(
    () => route.params.maMonAn,
    (newMaMonAn) => {
        if (newMaMonAn !== maMonAn.value) {
            console.log("Mã món ăn thay đổi:", newMaMonAn);
            maMonAn.value = newMaMonAn;
            loadData();
        }
    }
);
</script>

<template>
    <div :key="route.params.maMonAn">
        <BreadCrumb :breadcrumb="breadcrumbText" />
        <div class="page-container">
            <section class="monan-detail" v-if="monAnDetail">
                <div class="monan-detail__left">
                    <Carousel v-bind="carouselOptions">
                        <Slide
                            v-for="(img, i) in monAnDetail.anhMonAn"
                            :key="i"
                        >
                            <img :src="img.url" :alt="monAnDetail.tenMonAn" />
                        </Slide>
                        <template #addons>
                            <Navigation />
                            <Pagination />
                        </template>
                    </Carousel>
                </div>

                <div class="monan-detail__right">
                    <h2 class="detail-title">{{ monAnDetail.tenMonAn }}</h2>
                    <div class="stars-icon">
                        <i
                            v-for="(type, idx) in getStarIcons(
                                monAnDetail.avgRating
                            )"
                            :key="idx"
                            :class="{
                                'fas fa-star': type === 'full',
                                'fas fa-star-half-alt': type === 'half',
                                'far fa-star': type === 'empty',
                            }"
                        ></i>
                    </div>
                    <p class="detail-price">
                        <strong
                            >{{
                                parseInt(monAnDetail.donGia).toLocaleString(
                                    "vi-VN"
                                )
                            }}đ</strong
                        >
                    </p>
                    <p class="detail-original-price">
                        {{
                            parseInt(monAnDetail.giaGoc).toLocaleString(
                                "vi-VN"
                            )
                        }}đ
                    </p>
                    <p class="detail-category">
                        Phân loại: <strong>{{ monAnDetail.tenLoai }}</strong>
                    </p>
                    <p class="detail-quantity">
                        Số lượng còn:
                        <strong>{{
                            customRound(monAnDetail.soLuongMonCon)
                        }}</strong>
                    </p>
                    <p class="detail-units">
                        Đơn vị tính:
                        <strong>{{ monAnDetail.donViTinh }}</strong>
                    </p>
                    <div class="quantity-selector">
                        <button @click="decreaseQuantityDetail">-</button>
                        <input v-model="soLuongChon" />
                        <button @click="increaseQuantityDetail">+</button>
                    </div>
                    <BaseButton
                        btnTitle="THÊM VÀO GIỎ HÀNG"
                        variant="primary"
                        class="btn"
                        @click="addDetailDishToCart"
                    />
                </div>
            </section>
            <!-- Thông tin chi tiết -->
            <section class="tabs-section">
                <div class="tabs">
                    <button
                        v-for="(tab, index) in tabs"
                        :key="index"
                        :class="{ active: currentTab === index }"
                        @click="currentTab = index"
                    >
                        {{ tab.title }}
                    </button>
                </div>

                <div class="tab-content">
                    <div v-if="currentTab === 0" class="moTa">
                        <div v-html="monAnDetail.moTa"></div>
                    </div>
                    <div v-if="currentTab === 1" class="nguyenLieu">
                        <h3 class="ingredient-title">
                            Các thành phần chính của {{ monAnDetail.tenMonAn }}
                        </h3>
                        <ul>
                            <li
                                v-for="(
                                    nguyenLieu, index
                                ) in monAnDetail.chiTietMonAn"
                                :key="index"
                            >
                                <strong>{{ nguyenLieu.tenNguyenLieu }}</strong>
                                <span>
                                    {{ nguyenLieu.soLuongNL }}
                                    {{ nguyenLieu.donViTinh }}</span
                                >
                            </li>
                        </ul>
                    </div>
                    <div v-if="currentTab === 2" class="binhLuan">
                        <div class="comment-header">
                            <span>{{ comments.length }} bình luận</span>
                            <div class="dropdown">
                                <button class="dropdown-button">
                                    Sắp xếp theo:
                                    {{
                                        sortOrder === "desc"
                                            ? "Mới nhất"
                                            : "Cũ nhất"
                                    }}
                                </button>
                                <div class="dropdown-content">
                                    <button
                                        @click="toggleSortOrder"
                                        :class="{
                                            active: sortOrder === 'desc',
                                        }"
                                    >
                                        Mới nhất
                                    </button>
                                    <button
                                        @click="toggleSortOrder"
                                        :class="{ active: sortOrder === 'asc' }"
                                    >
                                        Cũ nhất
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="comment-list">
                            <div
                                v-for="(comment, index) in sortedComments"
                                :key="comment.maDanhGia"
                                class="comment-item"
                            >
                                <img
                                    :src="
                                        comment.anhTaiKhoan ||
                                        '/assets/images/taikhoan/avatar.png'
                                    "
                                    alt="Avatar"
                                    class="comment-avatar"
                                />
                                <div class="comment-content">
                                    <h4>{{ comment.tenTaiKhoan }}</h4>
                                    <p class="comment-date">
                                        {{
                                            formatDate(comment.thoiGianDanhGia)
                                        }}
                                    </p>
                                    <div class="stars-icon">
                                        <i
                                            v-for="(type, idx) in getStarIcons(
                                                comment.soSao
                                            )"
                                            :key="idx"
                                            :class="{
                                                'fas fa-star': type === 'full',
                                                'fas fa-star-half-alt':
                                                    type === 'half',
                                                'far fa-star': type === 'empty',
                                            }"
                                        ></i>
                                    </div>
                                    <p>{{ comment.binhLuan }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <!-- phần gợi ý món ăn -->
            <section class="recommended-dishes">
                <h2 class="section-title">CÓ THỂ BẠN THÍCH</h2>
                <div class="dishes-list">
                    <div
                        v-for="(dish, index) in danhSachGoiY"
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
                <!-- <BaseButton
                    btnTitle="XEM THÊM"
                    variant="primary"
                    class="see-more-btn"
                /> -->
            </section>
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
    padding: 50px 100px;
    width: 100%;
    background-image: url("/assets/images/cream-bg.png");
    background-size: cover;
    background-repeat: no-repeat;
    background-position: top top;
}

.monan-detail {
    display: flex;
    gap: 40px;
    padding: 50px;
}

.monan-detail__left {
    flex: 0 0 40%;
}

.monan-detail__left img {
    width: 100%;
    height: auto;
    object-fit: cover;
}

.monan-detail__right {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.detail-title {
    font-size: 3rem;
    color: var(--yellow-color);
    text-transform: uppercase;
    text-align: left;
    margin-bottom: 10px;
}

.stars-icon {
    font-size: 1.6rem;
    color: var(--light-yellow);
    margin-bottom: 20px;
}

.detail-price {
    font-size: 2.2rem;
    font-weight: bold;
    color: var(--red-color);
    margin-bottom: 10px;
}

.detail-original-price {
    font-size: 1.6rem;
    color: var(--dark-gray-color);
    text-decoration: line-through;
    margin-bottom: 20px;
}

.detail-category,
.detail-units,
.detail-quantity {
    font-size: 1.8rem;
    font-weight: 500;
    color: var(--black-color);
    margin-bottom: 10px;
}

.quantity-selector {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 10px;
}

.quantity-selector button {
    padding: 5px 10px;
    font-size: 1.5rem;
    background-color: var(--light-gray-color);
    border: 1px solid var(--dark-gray-color);
    cursor: pointer;
    width: 30px;
    color: var(--black-color);
}

.quantity-selector input {
    width: 50px;
    text-align: center;
    font-size: 1.5rem;
    padding: 5px;
    color: var(--black-color);
}

.monan-detail__right .btn {
    margin-top: 20px;
    width: 200px;
}

:deep(.carousel__pagination-button) {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

:deep(.carousel__pagination-button[aria-current="true"]) {
    background-color: var(--yellow-color);
    opacity: 1;
}

/* thông tin chi tiết */
.tabs-section {
    margin-top: 10px;
    width: 100%;
}

.tabs {
    display: flex;
    margin-bottom: 20px;
    width: 100%;
}

.tabs button {
    flex: 1;
    padding: 10px 20px;
    font-size: 1.8rem;
    text-transform: uppercase;
    font-weight: 600;
    color: var(--black-color);
    background-color: var(--light-gray-color);
    border: none;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.tabs button:hover {
    background-color: var(--dark-gray-color);
}

.tabs button.active {
    background-color: var(--yellow-color);
    color: var(--cream-color);
}

.tab-content {
    margin-top: 20px;
}

.tab-content .moTa ::v-deep p {
    font-size: 1.6rem;
    color: var(--black-color);
    margin-bottom: 20px;
    line-height: 1.6;
    text-align: justify;
}

/* tab bình luận */
.comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    font-size: 1.6rem;
    color: var(--black-color);
}

.dropdown {
    position: relative;
}

.dropdown-button {
    padding: 10px;
    font-size: 1.4rem;
    cursor: pointer;
    background-color: var(--light-gray-color);
    border: none;
    color: var(--black-color);
    border-radius: 5px;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
.dropdown-button:hover {
    background-color: var(--dark-gray-color);
}

.dropdown-content {
    display: none;
    position: absolute;
    box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.2);
    min-width: 180px;
    z-index: 1;
}

.dropdown:hover .dropdown-content {
    display: block;
}

.dropdown-content button {
    padding: 10px;
    font-size: 1.4rem;
    font-weight: 600;
    width: 100%;
    background-color: var(--white-color);
    border: none;
    cursor: pointer;
    text-align: left;
}

.dropdown-content button:hover {
    background-color: var(--light-gray-color);
}

.dropdown-content button.active {
    background-color: var(--yellow-color);
    color: var(--cream-color);
}

.comment-list {
    margin-top: 20px;
    background-color: var(--white-color);
}

.comment-item {
    display: flex;
    padding: 15px;
    border-bottom: 1px solid var(--light-gray-color);
    align-items: top;
}

.comment-item:hover {
    background-color: var(--light-gray-color);
}

.comment-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 15px;
    object-fit: cover;
    border: 2px solid var(--yellow-color);
}

.comment-content {
    flex: 1;
}

.comment-content h4 {
    margin: 0;
    font-size: 1.6rem;
    font-weight: bold;
}

.comment-date {
    font-size: 1.2rem;
    color: var(--dark-gray);
    margin-top: 5px;
}

.stars-icon {
    font-size: 1.4rem;
    color: var(--light-yellow);
    margin: 15px 0 10px 0;
}

.comment-content p {
    font-size: 1.4rem;
    color: var(--black-color);
    margin-bottom: 5px;
}

/* tab nguyên liêu */
.ingredient-title {
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 30px;
    text-transform: uppercase;
    color: var(--black-color);
    display: flex;
    justify-content: center;
}

.nguyenLieu ul {
    width: 50%;
    margin: 0 auto;
}

.nguyenLieu li {
    font-size: 1.6rem;
    margin-bottom: 10px;
    line-height: 1.8;
    color: var(--black-color);
    display: flex;
    justify-content: space-between;
}

/* phần gợi ý món ăn */
.recommended-dishes {
    margin-top: 40px;
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
    gap: 30px;
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

/* Responsive Styles */
@media screen and (max-width: 1200px) {
    .dishes-list {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media screen and (max-width: 768px) {
    .dishes-list {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media screen and (max-width: 480px) {
    .dishes-list {
        grid-template-columns: 1fr;
    }
}

.see-more-btn {
    display: block;
    margin: 40px auto;
    width: fit-content;
}

/* Global responsive styles */
@media screen and (max-width: 1200px) {
    .page-container {
        padding: 40px;
    }

    .monan-detail {
        flex-direction: column;
        gap: 20px;
        padding: 30px;
    }

    .monan-detail__left {
        flex: 0 0 100%;
        margin-bottom: 20px;
    }

    .monan-detail__right {
        flex: 1;
    }

    .detail-title {
        font-size: 2.4rem;
    }

    .stars-icon {
        font-size: 1.4rem;
    }

    .detail-price {
        font-size: 1.8rem;
    }

    .detail-original-price {
        font-size: 1.4rem;
    }

    .quantity-selector button {
        font-size: 1.4rem;
    }

    .quantity-selector input {
        font-size: 1.4rem;
    }

    .monan-detail__right .btn {
        width: 100%;
    }
}

@media screen and (max-width: 768px) {
    .page-container {
        padding: 20px;
    }

    .monan-detail {
        flex-direction: column;
        gap: 20px;
        padding: 20px;
    }

    .monan-detail__left {
        flex: 0 0 100%;
        margin-bottom: 20px;
    }

    .monan-detail__right {
        flex: 1;
    }

    .detail-title {
        font-size: 2rem;
    }

    .stars-icon {
        font-size: 1.3rem;
    }

    .detail-price {
        font-size: 1.7rem;
    }

    .detail-original-price {
        font-size: 1.3rem;
    }

    .quantity-selector button {
        font-size: 1.3rem;
    }

    .quantity-selector input {
        font-size: 1.3rem;
    }

    .monan-detail__right .btn {
        width: 100%;
    }

    .comment-header {
        font-size: 1.4rem;
    }

    .comment-item {
        padding: 12px;
    }

    .comment-avatar {
        width: 35px;
        height: 35px;
    }

    .comment-content h4 {
        font-size: 1.4rem;
    }

    .comment-date {
        font-size: 1rem;
    }

    .comment-content p {
        font-size: 1.3rem;
    }
}

@media screen and (max-width: 480px) {
    .page-container {
        padding: 15px;
    }

    .monan-detail {
        flex-direction: column;
        padding: 15px;
    }

    .monan-detail__left {
        flex: 0 0 100%;
        margin-bottom: 20px;
    }

    .monan-detail__right {
        flex: 1;
    }

    .detail-title {
        font-size: 1.8rem;
    }

    .stars-icon {
        font-size: 1.2rem;
    }

    .detail-price {
        font-size: 1.5rem;
    }

    .detail-original-price {
        font-size: 1.2rem;
    }

    .quantity-selector button {
        font-size: 1.2rem;
    }

    .quantity-selector input {
        font-size: 1.2rem;
    }

    .monan-detail__right .btn {
        width: 100%;
    }

    .tabs button {
        font-size: 1.6rem;
    }

    .tabs button.active {
        font-size: 1.6rem;
    }

    .recommended-dishes {
        padding-top: 15px;
    }

    .section-title {
        font-size: 2.2rem;
    }

    .dishes-list {
        grid-template-columns: 1fr;
    }

    .dish-item {
        width: 100%;
        height: auto;
        padding: 10px;
    }

    .dish-card__thumb {
        height: 150px;
    }

    .dish-card__body {
        padding: 10px;
    }

    .dish-card__title {
        font-size: 1.4rem;
    }

    .stars-icon {
        font-size: 1.1rem;
    }

    .dish-card__price {
        font-size: 1.4rem;
    }

    .dish-card__price .current {
        font-size: 1.4rem;
    }

    .dish-card__price .original {
        font-size: 1.2rem;
    }

    .dish-card__icon {
        font-size: 1.6rem;
    }

    .dish-card__body .btn {
        width: 100%;
    }
}

:deep(.carousel__pagination-button) {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

:deep(.carousel__pagination-button[aria-current="true"]) {
    background-color: var(--yellow-color);
}

@media screen and (max-width: 768px) {
    .carousel__pagination-button {
        width: 10px;
        height: 10px;
    }
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
