<script setup>
import BreadCrumb from "@/components/BreadCrumb.vue";
</script>

<template>
    <BreadCrumb />
    <div class="page-container">
        <div class="main-content">
            <section class="contact-section">
                <div class="hours">
                    <h3>Giờ mở cửa</h3>
                    <p>Thứ 2 – Chủ Nhật</p>
                    <p>08:00 – 21:00</p>
                </div>

                <h3>Liên hệ với chúng tôi</h3>
                <ul class="contact-list">
                    <li>
                        <i class="fa fa-map-marker-alt"></i>
                        71 Nguyễn Thái Học, Quận 1, TP.HCM
                    </li>
                    <li>
                        <i class="fa fa-phone"></i>
                        028 6278 2838
                    </li>
                    <li>
                        <i class="fa fa-envelope"></i>
                        senrestaurant@gmail.com
                    </li>
                    <li>
                        <i class="fab fa-facebook"></i>
                        @Nhà Hàng Chay Sen
                    </li>
                </ul>
            </section>

            <section class="content-section">
                <h1 class="restaurent-name">Nhà hàng chay Sen</h1>
                <div class="intro-section">
                    <h3>
                        Chào mừng bạn đến với Nhà Hàng Chay Sen – Nơi Tinh Hoa
                        Ẩm Thực Chay Gặp Gỡ Sự Thanh Tịnh
                    </h3>
                    <p>
                        Tại Sen, chúng tôi tự hào mang đến cho bạn những món ăn
                        chay được chế biến tinh tế từ nguyên liệu tươi ngon, tự
                        nhiên và an toàn cho sức khỏe. Với sứ mệnh không chỉ
                        phục vụ những bữa ăn ngon mà còn góp phần bảo vệ sức
                        khỏe và môi trường, chúng tôi luôn nỗ lực mang đến trải
                        nghiệm ẩm thực thuần khiết, nhẹ nhàng và đầy dinh dưỡng
                        cho mỗi khách hàng.
                    </p>
                    <img
                        class="intro-image"
                        src="/assets/images/hero-slideshow/hero-slideshow-1.jpg"
                        alt="Vegan food"
                    />
                </div>

                <div class="menu-section">
                    <h3>Món Ăn Chay Độc Đáo, Hương Vị Đậm Đà</h3>
                    <p>
                        Chúng tôi cam kết đem đến cho bạn những món ăn chay đa
                        dạng, phong phú, được chế biến từ các nguyên liệu thiên
                        nhiên và thực phẩm hữu cơ, không sử dụng hóa chất hay
                        phẩm màu. Từ các món xào, nướng đến các món súp, salad,
                        mỗi món ăn đều được chuẩn bị với tất cả sự tỉ mỉ, yêu
                        thương và tâm huyết.
                    </p>

                    <img
                        class="menu-image"
                        src="/assets/images/hero-slideshow/hero-slideshow-7.jpg"
                        alt="Restaurant Space"
                    />
                </div>

                <div class="space-section">
                    <h3>Không Gian Thanh Tịnh, Thư Giãn</h3>
                    <p>
                        Được thiết kế theo phong cách tối giản, gần gũi với
                        thiên nhiên, nhà hàng chay Sen mang đến một không gian
                        yên tĩnh, thoải mái để bạn có thể thư giãn và tận hưởng
                        bữa ăn trong sự bình an. Không gian của chúng tôi luôn
                        chào đón bạn, từ những bữa tiệc gia đình, gặp gỡ bạn bè
                        đến những khoảnh khắc riêng tư.
                    </p>

                    <div class="space-images">
                        <img
                            src="/assets/images/khuvuc/tangtret/anhchinhtangtret.jpg"
                            alt="Tầng Trệt"
                        />
                        <img
                            src="/assets/images/khuvuc/tanghac/anhchinhtanghac.jpg"
                            alt="Tầng Hạc"
                        />
                        <img
                            src="/assets/images/khuvuc/tangthuong/anhchinhtangthuong.jpg"
                            alt="Tầng thượng"
                        />
                        <img
                            src="/assets/images/khuvuc/phongvip/anhchinhphongvip.jpg"
                            alt="Phòng VIP"
                        />
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.main-content {
    display: flex;
    justify-content: space-between;
    /* gap: 70px; */
    /* padding: 40px; */
    /* flex-wrap: wrap; */
}

.contact-section {
    width: 300px;
    background-color: var(--yellow-color);
    padding: 30px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.contact-section h3 {
    font-size: 1.6rem;
    color: var(--brown-color);
    text-transform: uppercase;
    font-weight: 600;
    margin: 20px 0;
}

.contact-section p {
    font-size: 1.6rem;
    color: var(--cream-color);
    margin-bottom: 10px;
}

.contact-section ul {
    list-style-type: none;
}

.contact-section li {
    font-size: 1.6rem;
    color: var(--cream-color);
    margin: 10px 0;
}

.contact-section li i {
    margin-right: 5px;
}

.content-section {
    width: 75%;
    padding: 20px 0;
}

.content-section h1 {
    text-align: center;
    font-family: "Italianno", cursive;
    font-weight: 400;
    font-size: 6rem;
    color: var(--brown-color);
    margin: 20px 0;
}

.intro-section,
.menu-section,
.space-section {
    margin-bottom: 30px;
}

.intro-section h3,
.menu-section h3,
.space-section h3 {
    font-size: 2.5rem;
    color: var(--black-color);
}

.intro-section p,
.menu-section p,
.space-section p {
    font-size: 1.6rem;
    margin: 20px 0;
    color: var(--black-color);
    line-height: 1.5;
}

.intro-image,
.menu-image {
    width: 70%;
    display: block;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
    margin: 0 auto;
}

.space-images {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
}

.space-images img {
    width: 500px;
    height: auto;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}

/* Responsive */
/* Màn hình dưới 1024px */
@media (max-width: 1024px) {
    .main-content {
        gap: 30px;
    }
    .contact-section {
        width: 100%;
        max-width: 350px;
        margin: 0 auto;
    }
    .content-section {
        width: 100%;
    }
    .intro-image,
    .menu-image {
        width: 80%;
    }
}

/* Màn hình dưới 768px (tablet & mobile ngang) */
@media (max-width: 768px) {
    .main-content {
        flex-direction: column;
        align-items: center;
    }
    .contact-section {
        padding: 20px;
    }
    .intro-section,
    .menu-section,
    .space-section {
        padding: 0 20px;
        text-align: center;
    }
    .intro-image,
    .menu-image {
        width: 100%;
        margin: 20px 0;
    }
    .space-images {
        flex-direction: column;
        gap: 15px;
    }
    .space-images img {
        width: 100%;
        max-width: 100%;
    }
}

/* Màn hình dưới 576px (mobile dọc nhỏ) */
@media (max-width: 576px) {
    .restaurent-name {
        font-size: 3.5rem;
        margin: 10px 0;
    }
    .intro-section h3,
    .menu-section h3,
    .space-section h3 {
        font-size: 2rem;
    }
    .intro-section p,
    .menu-section p,
    .space-section p {
        font-size: 1.4rem;
    }
    .contact-section h3 {
        font-size: 1.4rem;
    }
    .contact-section p,
    .contact-section li {
        font-size: 1.2rem;
    }
}
</style>
