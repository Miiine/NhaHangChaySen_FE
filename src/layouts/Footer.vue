<script setup></script>

<template>
    <div class="footer">
        <div class="footer-content">
            <div class="footer-left">
                <img
                    src="/assets/images/logo_bg.jpg"
                    alt="Sen Logo"
                    class="sen-logo"
                />
            </div>
            <div class="footer-center">
                <h3>LIÊN HỆ VỚI CHÚNG TÔI</h3>
                <p>
                    <i class="fa fa-map-marker"></i> 171 Nguyễn Thái Học, Quận
                    1, TP Hồ Chí Minh
                </p>
                <p><i class="fa fa-phone"></i> 028 6278 2186</p>
                <p><i class="fa fa-envelope"></i> senveganhouse@gmail.com</p>
                <p><i class="fab fa-facebook"></i> Nhà Hàng Chay Sen</p>
            </div>
            <div class="footer-right">
                <h3>GIỜ MỞ CỬA</h3>
                <p>Thứ 2 - Chủ Nhật</p>
                <p>08h00 đến 21h00</p>
            </div>
        </div>
        <div class="footer-bottom">
            <p>Copyright © NHÀ HÀNG CHAY SEN - Designed by Quỳnh My</p>
        </div>
    </div>
</template>

<style scoped>
.footer {
    background-image: url("/assets/images/brown-bg.png");
    background-size: cover;
    background-position: bottom;
    padding: 50px 200px;
    color: var(--brown-color);
}

.footer-content {
    background-color: var(--cream-color);
    border-radius: 30px 30px 0 0;
    display: flex;
    justify-content: space-between;
    padding: 50px 100px;
    flex-wrap: wrap;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.footer-left .sen-logo {
    width: 150px;
    height: auto;
    border-radius: 30px;
}

.footer-center,
.footer-right {
    max-width: 500px;
}

.footer-center h3,
.footer-right h3 {
    margin-bottom: 15px;
    font-size: 1.6rem;
}

.footer-center p,
.footer-right p {
    margin: 10px 0;
    font-size: 1.4rem;
}

.footer-center i,
.footer-right i {
    margin-right: 10px;
}

/* Footer Bottom */
.footer-bottom {
    text-align: center;
    margin-top: 30px;
    font-size: 1.2rem;
    color: var(--white-color);
}

/* Responsive */
@media (max-width: 768px) {
    .footer-content {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    .footer-center,
    .footer-right {
        margin-top: 20px;
    }
}
</style>
