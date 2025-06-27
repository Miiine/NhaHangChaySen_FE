<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { format } from "date-fns";
import BreadCrumb from "@/components/BreadCrumb.vue";

import { fetchKhuyenMai } from "@/services/khuyenmai";

const route = useRoute();

const maKhuyenMai = ref(route.params.maKhuyenMai);
const offerDetail = ref([]);

const formatDate = (date) => {
    if (date) {
        const formattedDate = new Date(date);
        if (!isNaN(formattedDate)) {
            return format(formattedDate, "dd/MM/yyyy");
        } else {
            console.error("Ngày không hợp lệ: ", date);
            return "Ngày không hợp lệ";
        }
    }
    return "Ngày không xác định";
};

const breadcrumbText = computed(() => {
    return [
        { text: "Trang chủ", to: "/" },
        { text: "Ưu đãi", to: "/UuDai" },
        { text: offerDetail.value.tenKhuyenMai },
    ];
});

async function loadData() {
    try {
        const kmData = await fetchKhuyenMai();
        console.log("Dữ liệu ưu đãi trả về:", kmData);

        const khuyenMai = kmData.find(
            (km) => km.maKhuyenMai === parseInt(maKhuyenMai.value)
        );

        if (khuyenMai) {
            offerDetail.value = khuyenMai;
            console.log("Mã ưu đãi chi tiết: ", offerDetail.value.maKhuyenMai);
            route.meta.breadcrumb[2] = { text: khuyenMai.tenKhuyenMai };
        } else {
            console.error(
                "Không tìm thấy khuyến mãi với mã: ",
                maKhuyenMai.value
            );
        }
    } catch (err) {
        console.error("Lỗi loadData:", err);
    }
}

onMounted(loadData);
</script>

<template>
    <BreadCrumb :breadcrumb="breadcrumbText" />
    <div class="page-container">
        <h1 class="detail-title">{{ offerDetail.tenKhuyenMai }}</h1>
        <section class="offer-detail" v-if="offerDetail">
            <div class="offer-detail__left">
                <img
                    :src="offerDetail.hinhAnh"
                    :alt="offerDetail.tenKhuyenMai"
                    class="offer-image"
                />
            </div>

            <div class="offer-detail__right">
                <h3 class="condition-title">Điều kiện áp dụng:</h3>
                <ul class="condition-list">
                    <li>
                        Hóa đơn trên:
                        <b
                            >{{
                                parseInt(
                                    offerDetail.dieuKienApDung
                                ).toLocaleString("vi-VN")
                            }}đ</b
                        >
                    </li>
                    <li>
                        Thời gian áp dụng:
                        <b>{{ formatDate(offerDetail.thoiGianApDung) }}</b>
                    </li>
                    <li>
                        Thời gian hết hạn:
                        <b>{{ formatDate(offerDetail.thoiGianHetHan) }}</b>
                    </li>
                    <li>
                        Phần trăm giảm:
                        <b>{{ offerDetail.phanTram }}%</b>
                    </li>
                    <li>
                        Số lượng còn: <b>{{ offerDetail.soLuong }}</b>
                    </li>
                </ul>
            </div>
        </section>

        <section class="offer-description">
            <h3>Mô tả ưu đãi:</h3>
            <p v-html="offerDetail.moTa"></p>
        </section>
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

.detail-title {
    font-size: 3rem;
    color: var(--red-color);
    text-transform: uppercase;
    text-align: center;
}

.offer-detail {
    display: flex;
    gap: 40px;
    padding: 50px;
}

.offer-detail__left {
    flex: 0 0 30%;
}

.offer-image {
    width: 100%;
    height: auto;
    object-fit: cover;
}

.offer-detail__right {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.condition-title {
    font-size: 2rem;
    margin-bottom: 20px;
    color: var(--yellow-color);
}

.condition-list {
    font-size: 1.6rem;
    color: var(--black-color);
    list-style-type: none;
}

.condition-list li {
    margin-bottom: 15px;
}

.offer-description h3 {
    font-size: 2rem;
    color: var(--yellow-color);
    margin-bottom: 15px;
}

.offer-description ::v-deep p {
    font-size: 1.6rem;
    color: var(--black-color);
    text-align: justify;
    line-height: 1.8;
    margin-top: 10px;
}

/* Responsive Styles */
@media (max-width: 480px) {
    .page-container {
        padding: 30px 10px;
    }

    .detail-title {
        font-size: 2rem;
        margin-bottom: 15px;
    }

    .offer-detail {
        flex-direction: column;
        gap: 15px;
        padding: 15px;
    }

    .offer-detail__left {
        flex: 0 0 100%;
    }

    .offer-detail__right {
        flex: 1;
    }

    .condition-title {
        font-size: 1.6rem;
    }

    .condition-list {
        font-size: 1.2rem;
    }

    .offer-description h3 {
        font-size: 1.6rem;
    }

    .offer-description ::v-deep p {
        font-size: 1.2rem;
    }
}
</style>
