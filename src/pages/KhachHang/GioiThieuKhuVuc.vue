<script setup>
import { ref, computed, onMounted } from "vue";
import BreadCrumb from "@/components/BreadCrumb.vue";
import { Carousel, Slide } from "vue3-carousel";
import { Pagination, Navigation } from "vue3-carousel";
import "vue3-carousel/dist/carousel.css";
import { fetchKhuVuc } from "@/services/khuvuc";

const danhSachKhuVuc = ref([]);
const activeMaKhuVuc = ref(1);

// đổi tầng
const selectFloor = (ma) => {
    activeMaKhuVuc.value = ma;
};

// cấu hình carousel
const carouselOptions = {
    itemsToShow: 1,
    wrapAround: true,
    autoplay: 3000,
    pauseAutoplayOnHover: true,
    transition: 800,
    pagination: true,
    navigation: true,
};

// computed object khu vực đang chọn
const selectedKhuVuc = computed(() => {
    const kv =
        danhSachKhuVuc.value.find((k) => k.maKhuVuc === activeMaKhuVuc.value) ||
        {};
    return {
        ...kv,
        images: Array.isArray(kv.anhKhuVuc) ? kv.anhKhuVuc : [],
    };
});

// chỉ những ảnh không phải chính
const slideshowImages = computed(() =>
    selectedKhuVuc.value.images.filter((img) => !img.anhChinh)
);

// fetch data
async function loadData() {
    try {
        const kvData = await fetchKhuVuc();
        if (Array.isArray(kvData) && kvData.length) {
            danhSachKhuVuc.value = kvData;
            activeMaKhuVuc.value = kvData[0].maKhuVuc;
        } else {
            console.error("Dữ liệu khu vực không hợp lệ:", kvData);
        }
    } catch (err) {
        console.error(err);
    }
}

onMounted(loadData);
</script>

<template>
    <BreadCrumb />
    <div class="page-container">
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
        <!-- detail khu vực -->
        <section class="khuvuc-detail" v-if="selectedKhuVuc.maKhuVuc">
            <div class="khuvuc-detail__left">
                <Carousel v-bind="carouselOptions">
                    <Slide v-for="(img, i) in slideshowImages" :key="i">
                        <img :src="img.url" :alt="selectedKhuVuc.tenKhuVuc" />
                    </Slide>
                    <template #addons>
                        <Navigation />
                        <Pagination />
                    </template>
                </Carousel>
            </div>

            <div class="khuvuc-detail__right">
                <h2 class="detail-title">{{ selectedKhuVuc.tenKhuVuc }}</h2>
                <div class="detail-desc" v-html="selectedKhuVuc.moTa" />
                <p class="detail-phuphi">
                    <strong>Phụ phí:</strong>
                    {{
                        parseInt(selectedKhuVuc.phuPhi).toLocaleString("vi-VN")
                    }}đ
                </p>
            </div>
        </section>
    </div>
</template>

<style scoped>
/* Floor Navigation */
.floor-nav {
    background-color: #114b4c;
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
    color: var(--cream-color);
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
    display: flex;
    gap: 40px;
    padding: 50px;
}
.khuvuc-detail__left {
    flex: 0 0 40%;
    height: 100%;
}
.khuvuc-detail__left img {
    width: 100%;
    height: auto;
    object-fit: cover;
}

.khuvuc-detail__right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.detail-title {
    font-size: 3rem;
    color: var(--yellow-color);
    text-transform: uppercase;
    text-align: center;
}
.detail-desc {
    font-size: 1.6rem;
    color: var(--black-color);
    text-align: justify;
    line-height: 1.6;
}
.khuvuc-detail__right .detail-desc ::v-deep p {
    margin: 20px 0;
}
.khuvuc-detail__right .detail-desc ::v-deep ul {
    margin: 20px 30px;
}

.detail-phuphi {
    font-size: 1.6rem;
    color: var(--red-color);
    margin-top: auto;
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

/* Desktop */
@media (min-width: 1024px) {
    .floor-nav {
        padding: 20px 80px;
    }

    .khuvuc-detail {
        gap: 40px;
        padding: 50px;
    }

    .khuvuc-detail__left {
        flex: 0 0 40%;
    }

    .khuvuc-detail__right {
        flex: 1;
    }

    .detail-title {
        font-size: 3rem;
    }

    .detail-desc {
        font-size: 1.6rem;
    }

    .detail-phuphi {
        font-size: 1.6rem;
    }
}

/* Tablet lớn */
@media (max-width: 1024px) {
    .floor-nav {
        padding: 20px 40px;
    }

    .khuvuc-detail {
        gap: 20px;
        padding: 40px 20px;
    }

    .khuvuc-detail__left {
        flex: 0 0 50%;
    }

    .khuvuc-detail__right {
        flex: 1;
    }

    .detail-title {
        font-size: 2.4rem;
    }

    .detail-desc {
        font-size: 1.4rem;
    }

    .detail-phuphi {
        font-size: 1.4rem;
    }

    .carousel__pagination-button {
        width: 12px;
        height: 12px;
    }
}

/* Tablet nhỏ & Mobile Landscape */
@media (max-width: 768px) {
    .floor-nav {
        padding: 20px 15px;
    }

    .khuvuc-detail {
        gap: 16px;
        padding: 30px 10px;
    }

    .khuvuc-detail__left {
        flex: 0 0 60%;
    }

    .khuvuc-detail__right {
        flex: 1;
    }

    .detail-title {
        font-size: 2rem;
    }

    .detail-desc {
        font-size: 1.4rem;
    }

    .detail-phuphi {
        font-size: 1.4rem;
    }

    .carousel__pagination-button {
        width: 14px;
        height: 14px;
    }
}

/* Mobile dọc */
@media (max-width: 480px) {
    .floor-nav {
        padding: 20px 10px;
    }

    .khuvuc-detail {
        gap: 12px;
        padding: 20px;
    }

    .khuvuc-detail__left {
        flex: 0 0 100%;
        height: auto;
    }

    .khuvuc-detail__right {
        flex: 1;
    }

    .detail-title {
        font-size: 1.6rem;
    }

    .detail-desc {
        font-size: 1.2rem;
    }

    .detail-phuphi {
        font-size: 1.2rem;
    }

    .carousel__pagination-button {
        width: 8px;
        height: 8px;
    }
}
</style>
