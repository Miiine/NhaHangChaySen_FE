<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import slugify from "slugify";
import BreadCrumb from "@/components/BreadCrumb.vue";

import { fetchKhuyenMai } from "@/services/khuyenmai";

const router = useRouter();
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 6;
const danhSachKhuyenMai = ref([]);
const filteredDiscount = ref([]);

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

//Hàm để điều hướng tới trang chi tiết
const goToDishDetail = (offer) => {
    const slug = slugify(offer.tenKhuyenMai, { lower: true });
    router.push(`/UuDai/${offer.maKhuyenMai}/${slug}`);
};

//Hàm tính toán số trang tổng cộng:
const totalPages = computed(() => {
    return Math.ceil(danhSachKhuyenMai.value.length / itemsPerPage);
});

// Hàm để lọc danh sách ưu đãi theo từ khóa tìm kiếm
const filteredOffers = computed(() => {
    return filteredDiscount.value.filter((offer) => {
        return (
            offer.tenKhuyenMai
                .toLowerCase()
                .includes(searchQuery.value.toLowerCase()) ||
            offer.gioiThieu
                .toLowerCase()
                .includes(searchQuery.value.toLowerCase())
        );
    });
});

//Hàm lấy danh sách ưu đãi cho trang hiện tại:
const paginationDishes = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = currentPage.value * itemsPerPage;
    return filteredOffers.value.slice(start, end);
});

async function loadData() {
    try {
        const udData = await fetchKhuyenMai();
        danhSachKhuyenMai.value = udData;
        console.log("Dữ liệu món ăn yêu thích: ", danhSachKhuyenMai.value);

        const currentDate = new Date();
        // currentDate.setHours(0, 0, 0, 0);
        filteredDiscount.value = danhSachKhuyenMai.value.filter((km) => {
            const thoiGianApDung = new Date(km.thoiGianApDung);
            const thoiGianHetHan = new Date(km.thoiGianHetHan);

            const isValid = km.soLuong > 0;
            const isInDateRange =
                thoiGianApDung <= currentDate && thoiGianHetHan >= currentDate;

            return isValid && isInDateRange;
        });
    } catch (err) {
        console.error("Lỗi loadData:", err);
    }
}

onMounted(async () => {
    await loadData();
});
</script>

<template>
    <BreadCrumb :text="breadcrumbText" />
    <div class="page-container">
        <!-- Search Bar -->
        <div class="search-container">
            <div class="search-icon">
                <i class="fas fa-search"></i>
            </div>
            <input
                v-model="searchQuery"
                type="text"
                placeholder="Tìm kiếm ưu đãi ..."
                @input="resetPage"
            />
        </div>

        <h1>Các ưu đãi dành cho bạn</h1>

        <!-- Offers List -->
        <div class="offers-list">
            <div
                v-for="(offer, index) in paginationDishes"
                :key="offer.maKhuyenMai"
                class="offer-item"
            >
                <div
                    class="offer-card__thumb"
                    :style="`background-image:url(${offer.hinhAnh})`"
                ></div>
                <div class="offer-card__body">
                    <h3
                        class="offer-card__title"
                        @click="goToDishDetail(offer)"
                    >
                        {{ offer.tenKhuyenMai }}
                    </h3>
                    <p class="offer-card__desc">
                        {{ offer.gioiThieu }}
                    </p>
                </div>
            </div>
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

.search-container {
    margin-bottom: 40px;
    text-align: center;
    position: relative;
}

.search-container input {
    padding: 10px 30px 10px 40px;
    font-size: 1.6rem;
    width: 60%;
    border-radius: 20px;
    color: var(--black-color);
    border: 1px solid var(--dark-gray-color);
}

.search-icon {
    position: absolute;
    left: 250px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.8rem;
    color: var(--dark-gray-color);
}

h1 {
    text-align: center;
    text-transform: uppercase;
    color: var(--brown-color);
    font-size: 3rem;
    margin-bottom: 30px;
}

.offers-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    height: 1010px;
}

.offer-item {
    background: var(--white-color);
    color: var(--black-color);
    border-radius: 5px;
    width: 340px;
    height: 450px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform-origin: center;
}

.offer-item:hover .offer-card__thumb {
    transform: scale(1.03);
}

.offer-card__thumb {
    height: 300px;
    background-size: cover;
    background-position: center;
    transition: transform 0.3s ease;
}

.offer-card__body {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.offer-card__title {
    font-size: 1.8rem;
    text-transform: uppercase;
    text-align: left;
    font-weight: 700;
    color: var(--red-color);
    margin-bottom: 10px;
}

.offer-card__title:hover {
    color: var(--yellow-color);
}

.offer-card__desc {
    font-size: 1.6rem;
    text-align: justify;
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

/* Responsive Styles */

@media (max-width: 1024px) {
    .page-container {
        padding: 40px 20px;
    }

    h1 {
        font-size: 2.4rem;
        margin-bottom: 20px;
    }

    .search-container input {
        width: 70%;
        font-size: 1.4rem;
    }

    .search-icon {
        left: 20px;
        font-size: 1.6rem;
    }

    .offers-list {
        grid-template-columns: repeat(2, 1fr);
    }

    .offer-item {
        width: 100%;
        height: auto;
        margin-bottom: 20px;
    }

    .offer-card__thumb {
        height: 220px;
    }

    .offer-card__title {
        font-size: 1.6rem;
    }

    .offer-card__desc {
        font-size: 1.4rem;
    }

    .pagination-btn,
    .pagination-number {
        font-size: 1.4rem;
    }
}

@media (max-width: 768px) {
    .page-container {
        padding: 30px 10px;
    }

    h1 {
        font-size: 2rem;
        margin-bottom: 15px;
    }

    .search-container input {
        width: 80%;
        font-size: 1.2rem;
    }

    .search-icon {
        left: 15px;
        font-size: 1.4rem;
    }

    .offers-list {
        grid-template-columns: 1fr;
    }

    .offer-item {
        width: 100%;
        height: auto;
        margin-bottom: 15px;
    }

    .offer-card__thumb {
        height: 200px;
    }

    .offer-card__title {
        font-size: 1.4rem;
    }

    .offer-card__desc {
        font-size: 1.2rem;
    }

    .pagination-btn,
    .pagination-number {
        font-size: 1.2rem;
        padding: 8px 16px;
    }
}
</style>
