<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { ref, computed, onMounted } from "vue";
import slugify from "slugify";
import Swal from "sweetalert2";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import BaseButton from "@/components/BaseButton.vue";

import { fetchKhuVuc } from "@/services/khuvuc";
import { fetchMonAn } from "@/services/monan";
import { fetchKhuyenMai } from "@/services/khuyenmai";
import { fetchMAYeuThich, toggleFavoriteDishes } from "@/services/yeuthich";
import {
    fetchGioHang,
    addDishesToCart,
    deleteDishFromCart,
    updateSLInCart,
} from "@/services/giohang";

const router = useRouter();
const { user } = useAuthStore();
const cartStore = useCartStore();
const danhSachKhuVuc = ref([]);
const activeMaKhuVuc = ref(1);
const danhSachMonAn = ref([]);
const danhSachKhuyenMai = ref([]);
const danhSachYeuThich = ref([]);
const danhSachGioHang = ref([]);
const isCartOpen = ref(false);

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

// Hàm làm tròn số sao:
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
// Hàm chuyển thành danh sách star icon để hiển thị:
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
    // nếu chưa login
    if (!user || !user.id) {
        return Swal.fire({
            icon: "warning",
            title: "Bạn cần đăng nhập",
            text: "Vui lòng đăng nhập để thêm món vào yêu thích!",
            confirmButtonText: "OK",
        });
    }

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
    } catch (error) {
        console.error("Lỗi khi toggle món ăn yêu thích:", error);
    }
};

//Hàm để điều hướng tới trang chi tiết
const goToDishDetail = (dish) => {
    const slug = slugify(dish.tenMonAn, { lower: true });
    router.push(`/ThucDon/${dish.maMonAn}/${slug}`);
};
const goToOfferDetail = (offer) => {
    const slug = slugify(offer.tenKhuyenMai, { lower: true });
    router.push(`/UuDai/${offer.maKhuyenMai}/${slug}`);
};

// active floor
const selectFloor = (maKhuVuc) => {
    activeMaKhuVuc.value = maKhuVuc;
};

//Hàm thêm món ăn vào giỏ hàng:
const addOneDishToCart = async (dish) => {
    // nếu chưa login
    if (!user || !user.id) {
        return Swal.fire({
            icon: "warning",
            title: "Bạn cần đăng nhập",
            text: "Vui lòng đăng nhập để thêm món vào giỏ hàng!",
            confirmButtonText: "OK",
        });
    }

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

//TÌm object khu vực đang chọn
const selectedKhuVuc = computed(() => {
    const kv =
        danhSachKhuVuc.value.find((k) => k.maKhuVuc === activeMaKhuVuc.value) ||
        {};
    return {
        ...kv,
        images: kv.anhKhuVuc || [],
        mainImage: getMainImage(kv.anhKhuVuc),
    };
});

// Select top 10 món ăn bán chạy nhất
const top10MonAn = computed(() => {
    // Sắp xếp danh sách món ăn theo số lượng bán (soLuongBan) từ cao đến thấp
    const sortedDishes = [...danhSachMonAn.value].sort(
        (a, b) => b.soLuongBan - a.soLuongBan
    );

    // Lấy 10 món ăn đầu tiên
    return sortedDishes.slice(0, 10);
});

async function loadData() {
    try {
        const [kvData, monAnData, kmData, MAYTData, ghData] = await Promise.all(
            [
                fetchKhuVuc(),
                fetchMonAn(),
                fetchKhuyenMai(),
                user && user.id
                    ? fetchMAYeuThich(user.id)
                    : Promise.resolve([]),
                user && user.id ? fetchGioHang(user.id) : Promise.resolve([]),
            ]
        );

        // Khu vực
        if (Array.isArray(kvData) && kvData.length) {
            danhSachKhuVuc.value = kvData;
            activeMaKhuVuc.value = kvData[0].maKhuVuc || 1;
            console.log("Danh sách khu vực:", danhSachKhuVuc.value);
        } else {
            console.error("Lỗi dữ liệu khu vực:", kvData);
        }

        // Món ăn
        if (Array.isArray(monAnData)) {
            danhSachMonAn.value = monAnData;
            console.log("danhSachMonAn:", danhSachMonAn.value);
        } else {
            console.error("Lỗi dữ liệu món ăn:", monAnData);
        }

        // Khuyến mãi
        if (Array.isArray(kmData)) {
            danhSachKhuyenMai.value = kmData;
            console.log("danhSachKhuyenMai:", danhSachKhuyenMai.value);
        } else {
            console.error("Lỗi dữ liệu khuyến mãi:", kmData);
        }

        //Món ăn yêu thích
        danhSachYeuThich.value = MAYTData;
        console.log("Dữ liệu món ăn yêu thích: ", danhSachYeuThich.value);

        //Món ăn trong giỏ hàng:
        danhSachGioHang.value = ghData;
        console.log("Dữ liệu món ăn trong giỏ hàng: ", danhSachGioHang.value);
    } catch (err) {
        console.error("Lỗi loadData:", err);
    }
}
const closeCart = () => {
    isCartOpen.value = false;
};

onMounted(async () => {
    // hero-slideshow
    let index = 0;
    const slides = document.querySelectorAll(".slide");
    slides[index].classList.add("active");

    setInterval(() => {
        slides[index].classList.remove("active");
        index = (index + 1) % slides.length;
        slides[index].classList.add("active");
    }, 5000);

    //Fetch all
    await loadData();

    console.log("User id:", user.id);
});
</script>

<template>
    <!-- <div class="content"> -->
    <section class="hero-slideshow">
        <div class="slides">
            <div
                class="slide"
                style="
                    background-image: url('/assets/images/hero-slideshow/hero-slideshow-1.jpg');
                "
            ></div>
            <div
                class="slide"
                style="
                    background-image: url('/assets/images/hero-slideshow/hero-slideshow-2.jpg');
                "
            ></div>
            <div
                class="slide"
                style="
                    background-image: url('/assets/images/hero-slideshow/hero-slideshow-4.jpg');
                "
            ></div>
            <div
                class="slide"
                style="
                    background-image: url('/assets/images/hero-slideshow/hero-slideshow-6.png');
                "
            ></div>
            <div
                class="slide"
                style="
                    background-image: url('/assets/images/hero-slideshow/hero-slideshow-7.jpg');
                "
            ></div>
        </div>
        <div class="overlay">
            <h1>Nhà hàng chay Sen</h1>
            <div class="btns">
                <router-link to="/ThucDon">
                    <BaseButton
                        class="btn"
                        btnTitle="THỰC ĐƠN"
                        variant="primary"
                    />
                </router-link>
                <router-link to="/DatBan">
                    <BaseButton
                        class="btn"
                        btnTitle="ĐẶT BÀN"
                        variant="primary"
                    />
                </router-link>
            </div>
        </div>
    </section>
    <!-- About Hero Section -->
    <section class="about-hero">
        <div class="about-overlay"></div>
        <div class="about-container">
            <p class="about-text">
                Nhà hàng chay Sen là điểm đến lý tưởng cho những ai yêu thích ẩm
                thực chay ngon miệng. Với tôn chỉ “Trọn vẹn an yên – Đong đầy vị
                giác”, nhà hàng mang đến cho thực khách không chỉ những món ăn
                ngon miệng và đẹp mắt mà còn là những trải nghiệm tinh tế về văn
                hóa ẩm thực chay!
            </p>
        </div>
    </section>
    <!-- Floor Navigation -->
    <section class="floor-nav">
        <div class="floor-nav-inner">
            <div class="floor-nav-title">
                <span>KHU VỰC</span>
                <span>BÀN ĂN</span>
            </div>
            <ul class="floor-list">
                <li
                    :class="{ active: activeMaKhuVuc === 1 }"
                    @click="selectFloor(1)"
                >
                    <img
                        src="/assets/images/khuvuc/tangtret.png"
                        alt="Tầng Trệt"
                    />
                    <span>Tầng Trệt</span>
                </li>
                <li
                    :class="{ active: activeMaKhuVuc === 2 }"
                    @click="selectFloor(2)"
                >
                    <img
                        src="/assets/images/khuvuc/tanghac.png"
                        alt="Tầng Hạc"
                    />
                    <span>Tầng Hạc</span>
                </li>
                <li
                    :class="{ active: activeMaKhuVuc === 3 }"
                    @click="selectFloor(3)"
                >
                    <img
                        src="/assets/images/khuvuc/tangthuong.png"
                        alt="Tầng Thượng"
                    />
                    <span>Tầng Thượng</span>
                </li>
                <li
                    :class="{ active: activeMaKhuVuc === 4 }"
                    @click="selectFloor(4)"
                >
                    <img
                        src="/assets/images/khuvuc/phongvip.png"
                        alt="Phòng VIP"
                    />
                    <span>Phòng VIP</span>
                </li>
            </ul>
        </div>
    </section>
    <section v-if="selectedKhuVuc.maKhuVuc" class="khuvuc-detail">
        <div
            class="detail-bg"
            :style="`background-image:url(${selectedKhuVuc.mainImage});`"
        ></div>

        <div class="detail-info">
            <div class="thumb">
                <img
                    :src="selectedKhuVuc.mainImage"
                    :alt="selectedKhuVuc.tenKhuVuc"
                />
            </div>
            <h2>{{ selectedKhuVuc.tenKhuVuc }}</h2>
            <p>{{ selectedKhuVuc.gioiThieu }}</p>
            <div class="btns">
                <BaseButton
                    @click="toPage('KhuVuc')"
                    btnTitle="XEM CHI TIẾT"
                    variant="primary"
                />
                <BaseButton
                    @click="toPage('DatBan')"
                    btnTitle="ĐẶT BÀN"
                    variant="primary"
                />
            </div>
        </div>
    </section>
    <!-- Món ăn bán chạy -->
    <section class="popular-dishes">
        <div class="popular-dishes__header">
            <h2>MÓN ĂN BÁN CHẠY</h2>
            <p>Nhà hàng chay Sen – Sự yêu thương trong từng món ăn!</p>
        </div>
        <Swiper
            v-if="top10MonAn.length"
            :modules="[Navigation, Pagination, Autoplay]"
            :slides-per-view="4"
            :space-between="24"
            navigation
            :pagination="{ clickable: true }"
            loop
            :autoplay="{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            }"
            class="popular-dishes__swiper"
        >
            <SwiperSlide v-for="monAN in top10MonAn" :key="monAN.maMonAn">
                <div class="dish-card">
                    <!-- Thẻ BEST SELLER -->
                    <div v-if="monAN.isBestSeller" class="best-seller-tag">
                        <img
                            src="/assets/images/bestSellerTag.png"
                            alt="Best Seller Tag"
                        />
                    </div>
                    <div
                        class="dish-card__thumb"
                        :style="`background-image:url(${getMainImage(
                            monAN.anhMonAn
                        )})`"
                    ></div>
                    <div class="dish-card__body">
                        <h3
                            class="dish-card__title"
                            @click="goToDishDetail(monAN)"
                        >
                            {{ monAN.tenMonAn }}
                        </h3>
                        <div class="stars-icon">
                            <i
                                v-for="(type, idx) in getStarIcons(
                                    monAN.avgRating
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
                                <span class="current"
                                    >{{
                                        parseInt(monAN.donGia).toLocaleString(
                                            "vi-VN"
                                        )
                                    }}đ</span
                                >
                                <span class="original"
                                    >{{
                                        parseInt(monAN.donGia).toLocaleString(
                                            "vi-VN"
                                        )
                                    }}đ</span
                                >
                            </div>
                            <div class="dish-card__icon">
                                <i
                                    :class="{
                                        'fas fa-heart': danhSachYeuThich.some(
                                            (d) => d.maMonAn === monAN.maMonAn
                                        ), // Kiểm tra nếu món ăn có trong danh sách yêu thích
                                        'far fa-heart': !danhSachYeuThich.some(
                                            (d) => d.maMonAn === monAN.maMonAn
                                        ), // Nếu không có thì hiển thị heart rỗng
                                    }"
                                    @click="toggleFavorite(monAN)"
                                ></i>
                            </div>
                        </div>
                        <BaseButton
                            btnTitle="THÊM VÀO GIỎ HÀNG"
                            variant="primary"
                            class="btn"
                            @click="addOneDishToCart(monAN)"
                        />
                    </div>
                </div>
            </SwiperSlide>
        </Swiper>

        <div class="popular-dishes__footer">
            <BaseButton
                @click="toPage('ThucDon')"
                btnTitle="XEM TẤT CẢ"
                variant="primary"
            />
        </div>
    </section>
    <!-- Offers section -->
    <section class="offers-container">
        <div class="offers-content">
            <div class="offer-title">
                <span>CÁC ƯU ĐÃI TRONG THÁNG</span>
            </div>
            <div class="offer-list">
                <Swiper
                    v-if="danhSachKhuyenMai.length"
                    :modules="[Pagination, Autoplay]"
                    :slides-per-view="3"
                    :space-between="24"
                    :pagination="{ clickable: true }"
                    loop
                    :autoplay="{
                        delay: 4000,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                    }"
                    class="offers__swiper"
                >
                    <SwiperSlide
                        v-for="(km, index) in danhSachKhuyenMai"
                        :key="index"
                    >
                        <div
                            class="offer-card"
                            :style="`background-image:url(${km.hinhAnh});`"
                        >
                            <div class="offer-card__overlay">
                                <div class="offer-card__content">
                                    <div class="offer-card__expiry">
                                        HSD:
                                        {{
                                            new Date(
                                                km.thoiGianHetHan
                                            ).toLocaleDateString("vi-VN")
                                        }}
                                    </div>
                                    <h3 class="offer-card__title">
                                        {{ km.label }}
                                    </h3>
                                    <p class="offer-card__description">
                                        {{ km.moTa }}
                                    </p>

                                    <div
                                        class="offer-card__link"
                                        @click="goToOfferDetail(km)"
                                    >
                                        <strong><em>Xem chi tiết</em></strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                </Swiper>
                <div class="offer__footer">
                    <BaseButton
                        @click="toPage('UuDai')"
                        class="see-more-offer-btn"
                        btnTitle="XEM TẤT CẢ"
                        variant="primary"
                    />
                </div>
            </div>
        </div>
    </section>
    <!-- map section -->
    <section class="map-section">
        <h2>Vị trí nhà hàng</h2>
        <div class="map-container">
            <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.60071895409!2d106.69422687420936!3d10.765223889382906!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f15a991054b%3A0x8cb8411089a35acc!2zMTcxIE5ndXnhu4VuIFRow6FpIEjhu41jLCBQaMaw4budbmcgQ-G6p3Ugw5RuZyBMw6NuaCwgUXXhuq1uIDEsIEjhu5MgQ2jDrSBNaW5oIDcwMDAwMCwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1746186140883!5m2!1svi!2s"
                width="100%"
                height="450px"
                style="border: 0"
                allowfullscreen=""
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
        </div>
    </section>

    <!-- </div> -->
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
/* hero slideshow*/
.hero-slideshow {
    position: relative;
    width: 100%;
    height: 500px;
    overflow: hidden;
}

.slides {
    position: relative;
    width: 100%;
    height: 100%;
}

.slide {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    opacity: 0;
    transition: opacity 1s ease-in-out;
}
.slide.active {
    opacity: 1;
}

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    pointer-events: none;
}
.overlay h1 {
    font-family: "Italianno", cursive;
    font-weight: 400;
    font-size: 6rem;
    color: var(--cream-color);
    margin: 20px 0;
}
.btns {
    display: inline-flex;
    gap: 1rem;
}
.btn {
    pointer-events: auto;
}

/* About Hero */
.about-hero {
    position: relative;
    background-image: url("/assets/images/about-hero.jpg");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    padding: 40px 20px;
    overflow: hidden;
}

.about-hero .about-overlay {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    pointer-events: none;
}

.about-hero .about-container {
    position: relative;
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
}

.about-hero .about-text {
    font-family: "Italianno", cursive;
    font-size: 3rem;
    line-height: 1.6;
    color: var(--cream-color);
    margin: 0;
}

/* Floor Navigation */
.floor-nav {
    background-color: var(--cream-color);
    padding: 20px 80px 20px 20px;
    display: flex;
    align-items: center;
}
.floor-nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.floor-nav-title {
    margin-right: 200px;
    text-align: left;
}

.floor-nav-title span {
    display: block;
    font-size: 2.2rem;
    font-weight: 600;
    color: var(--yellow-color);
    white-space: nowrap;
    line-height: 1.6;
}

.floor-list {
    display: flex;
    list-style: none;
}
.floor-list li {
    text-align: center;
    cursor: pointer;
    padding: 0px 60px;
}
.floor-list li img {
    display: block;
    margin: 0 auto 8px;
    width: 80px;
    height: 80px;
    filter: grayscale(100%);
    transition: filter 0.3s;
}
.floor-list li span {
    display: block;
    font-size: 1.8rem;
    color: var(--black-color);
    font-weight: 500;
    transition: color 0.3s;
    white-space: nowrap;
}

.floor-list li:hover img {
    filter: none;
}
.floor-list li:hover span {
    color: var(--yellow-color);
}

.floor-list li.active img {
    filter: none;
}
.floor-list li.active span {
    color: var(--yellow-color);
}
/* Mũi tên chỉ tầng active */
.floor-list li.active {
    position: relative;
}

.floor-list li.active::after {
    content: "";
    position: absolute;
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 15px solid transparent;
    border-right: 15px solid transparent;
    border-bottom: 15px solid rgba(0, 0, 0, 0.6);
}

/* Chi tiết khu vực */
.khuvuc-detail {
    position: relative;
    width: 100%;
    height: 400px;
    overflow: hidden;
}

.detail-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    z-index: 1;
}

.detail-info {
    position: relative;
    z-index: 2;
    width: 35%;
    height: 100%;
    padding: 20px;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 20px;
}

.thumb {
    width: 400px;
    height: auto;
    overflow: hidden;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}

.thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform 0.5s ease;
}

.thumb img:hover {
    transform: scale(1.03);
}

.detail-info h2 {
    margin: 0;
    font-size: 2.4rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--yellow-color);
}

.detail-info p {
    margin: 0;
    font-size: 1.6rem;
    line-height: 1.5;
    color: var(--cream-color);
    text-align: justify;
}

.btns {
    display: flex;
    gap: 12px;
}

/* món ăn bán chạy */
.popular-dishes {
    background-image: url("/assets/images/brown-bg.png");
    background-size: cover;
    background-position: top center;
    overflow: hidden;
    padding: 40px;
    text-align: center;
}
.popular-dishes__header h2 {
    font-size: 2.6rem;
    margin-bottom: 8px;
    color: var(--yellow-color);
}
.popular-dishes__header p {
    font-size: 1.6rem;
    margin-bottom: 24px;
    color: var(--cream-color);
}

/* .popular-dishes__list {
    display: flex;
    gap: 24px;
    overflow-x: auto;
    padding-bottom: 16px;
} */
.dish-card {
    background: var(--cream-color);
    color: var(--brown-color);
    border-radius: 8px;
    width: 280px;
    height: 360px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 12px;
    transform-origin: center;
}
.dish-card:hover .dish-card__thumb {
    transform: scale(1.05);
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
    align-items: start;
}

.dish-card__body .stars-icon {
    font-size: 1.2rem;
    color: var(--light-yellow);
}
.dish-card__title {
    font-size: 1.8rem;
    text-transform: uppercase;
    text-align: left;
}
.dish-card__title:hover {
    color: var(--yellow-color);
}
.dish-card__sub-body {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    width: 100%;
}
.dish-card__price {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: start;
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

.popular-dishes__footer {
    margin-top: 10px;
}

.dish-card__body .btn {
    width: 100%;
    padding: 12px;
    font-size: 1.4rem;
}

.popular-dishes__swiper {
    padding: 0 60px !important;
}

.popular-dishes__swiper .swiper-slide {
    height: 400px !important;
}

.popular-dishes__swiper ::v-deep .swiper-button-prev,
.popular-dishes__swiper ::v-deep .swiper-button-next {
    top: 50%;
    transform: translateY(-50%);
    color: var(--cream-color);
    z-index: 10;
}

.popular-dishes__swiper ::v-deep .swiper-pagination {
    bottom: 5px;
}

.popular-dishes__swiper ::v-deep .swiper-pagination-bullet-active {
    background: var(--yellow-color);
    transform: scale(1.2);
}

/* phần ưu đãi */
.offers-container {
    background-color: var(--yellow-color);
    background-size: cover;
    background-position: top center;
    overflow: hidden;
    padding: 40px 0;
}

.offers-content {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
    padding: 0 20px;
}

.offer-title {
    display: inline-flex;
    gap: 8px;
    margin-bottom: 24px;
}
.offer-title span {
    display: block;
    font-size: 2.6rem;
    font-weight: 600;
    text-transform: uppercase;
    line-height: 1;
    color: var(--cream-color);
}

.offers__swiper {
    padding: 0 60px !important;
    height: 400px;
}
.offers__swiper .swiper-slide {
    height: 350px !important;
}

.offers__swiper ::v-deep .swiper-pagination {
    bottom: 10px;
}
.offers__swiper ::v-deep .swiper-pagination-bullet-active {
    background: var(--cream-color);
    transform: scale(1.2);
}

.offer-card {
    position: relative;
    width: 100%;
    height: 350px;
    background-size: cover;
    background-position: center;
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.3s ease;
}
.offer-card:hover {
    transform: scale(1.02);
}

.offer-card__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    opacity: 0;
    transition: opacity 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}
.offer-card:hover .offer-card__overlay {
    opacity: 1;
}

.offer-card__content {
    color: var(--cream-color);
    text-align: center;
    max-width: 260px;
}
.offer-card__expiry {
    font-size: 1.4rem;
    margin-bottom: 8px;
    color: var(--light-yellow);
}
.offer-card__title {
    font-size: 1.8rem;
    margin: 0 0 12px;
}
.offer-card__description {
    font-size: 1.4rem;
    margin-bottom: 16px;
    line-height: 1.3;
}
.offer-card__link {
    color: var(--light-yellow);
    text-decoration: none;
    font-size: 1.2rem;
}
.offer-card__link:hover {
    text-decoration: underline;
}

.offer__footer .see-more-offer-btn {
    background-color: var(--cream-color);
    color: var(--yellow-color);
    margin-top: 5px;
}
.offer__footer .see-more-offer-btn:hover {
    background-color: #ffe9d2;
}

/* phần map */
.map-section {
    text-align: center;
}
.map-section h2 {
    margin: 20px auto;
    text-transform: uppercase;
    color: var(--brown-color);
    font-size: 2.6rem;
    font-weight: 700;
}
.map-container {
    width: 100%;
}

/* Responsive */
/* Large desktop → giảm padding, thu nhỏ detail-info, slides */
@media (max-width: 1200px) {
    .floor-nav {
        padding: 20px 40px;
    }
    .detail-info {
        width: 45%;
        padding: 15px;
    }
    .popular-dishes__swiper {
        padding: 0 40px !important;
    }
    .offers__swiper {
        padding: 0 40px !important;
    }
    .map-container iframe {
        height: 400px;
    }
}

/* Desktop → tablet lớn */
@media (max-width: 1024px) {
    .hero-slideshow {
        height: 400px;
    }
    .overlay h1 {
        font-size: 4.5rem;
    }
    .about-hero {
        padding: 50px 20px;
    }
    .about-text {
        font-size: 2.4rem;
    }
    .floor-nav {
        flex-direction: column;
    }
    .floor-list li {
        padding: 0 30px;
    }
    .detail-info {
        width: 100%;
        height: auto;
    }
    .dish-card {
        width: 240px;
        height: 340px;
    }
    .popular-dishes__swiper {
        padding: 0 30px !important;
    }
    .offers__swiper {
        padding: 0 30px !important;
    }
}

/* Tablet nhỏ & landscape mobile */
@media (max-width: 768px) {
    .hero-slideshow {
        height: 350px;
    }
    .overlay h1 {
        font-size: 3.5rem;
    }
    .btns {
        gap: 0.5rem;
    }
    .btn {
        width: 100%;
    }
    .about-hero {
        padding: 40px 15px;
    }
    .about-text {
        font-size: 1.6rem;
    }
    .floor-nav-inner {
        padding: 10px;
    }
    .floor-list {
        flex-wrap: wrap;
        gap: 10px;
    }
    .floor-list li {
        padding: 0 20px;
    }
    .floor-list li img {
        width: 60px;
        height: 60px;
    }
    .floor-list li span {
        font-size: 1.4rem;
    }
    .khuvuc-detail {
        flex-direction: column;
        height: auto;
    }
    .detail-bg {
        height: 200px;
    }
    .detail-info {
        padding: 15px;
    }
    .detail-info h2 {
        font-size: 2rem;
    }
    .detail-info p {
        font-size: 1.4rem;
    }
    .dish-card {
        width: 220px;
        height: 320px;
    }
    .popular-dishes__swiper .swiper-slide {
        height: auto !important;
    }
    .popular-dishes__swiper {
        padding: 0 20px !important;
    }
    .offers__swiper .swiper-slide {
        height: auto !important;
    }
    .offers__swiper {
        padding: 0 20px !important;
    }
    .offer-title span {
        font-size: 2.2rem;
    }
    .offer-card__title {
        font-size: 1.6rem;
    }
    .offer-card__description {
        font-size: 1.2rem;
    }
    .map-container iframe {
        height: 300px;
    }
}

/* Mobile dọc nhỏ */
@media (max-width: 480px) {
    .hero-slideshow {
        height: 250px;
    }
    .overlay h1 {
        font-size: 3rem;
    }
    .btns {
        gap: 0.5rem;
    }
    .btn {
        width: 100%;
        font-size: 1.2rem;
    }
    .about-hero {
        padding: 30px 10px;
    }
    .about-text {
        font-size: 1.4rem;
    }
    .floor-nav-inner {
        padding: 8px;
    }
    .floor-list li {
        padding: 0 16px;
    }
    .floor-list li img {
        width: 50px;
        height: 50px;
    }
    .floor-list li span {
        font-size: 1.2rem;
    }
    .detail-bg {
        height: 150px;
    }
    .detail-info {
        padding: 10px;
    }
    .detail-info h2 {
        font-size: 1.8rem;
    }
    .detail-info p {
        font-size: 1.2rem;
    }
    .dish-card {
        width: 200px;
        height: 300px;
    }
    .popular-dishes__swiper {
        padding: 0 10px !important;
    }
    .offers__swiper {
        padding: 0 10px !important;
    }
    .offer-title span {
        font-size: 1.8rem;
    }
    .offer-card__title {
        font-size: 1.4rem;
    }
    .offer-card__description {
        font-size: 1rem;
    }
    .offer-card__expiry {
        font-size: 1.2rem;
    }
    .map-container iframe {
        height: 200px;
    }
}

/* Cart slide */
/* Lớp phủ (overlay) */
/* .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    display: block;
    z-index: 2;
}

.overlay.show {
    display: block;
} */

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
