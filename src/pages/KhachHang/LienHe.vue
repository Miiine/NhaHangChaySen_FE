<script setup>
import { ref } from "vue";
import Swal from "sweetalert2";
import BreadCrumb from "@/components/BreadCrumb.vue";
import BaseButton from "@/components/BaseButton.vue";

const form = ref({
    fullName: "",
    phoneNumber: "",
    address: "",
    email: "",
    subject: "",
    message: "",
});

const resetForm = () => {
    form.value = {
        fullName: "",
        phoneNumber: "",
        address: "",
        email: "",
        subject: "",
        message: "",
    };
};

const submitForm = () => {
    Swal.fire({
        icon: "success",
        title: "Gửi form thành công!",
        text: "Cảm ơn bạn đã gửi mail cho Nhà hàng chay Sen nhé ạ:))",
    }).then(() => {
        resetForm();
    });
    // Thêm logic gửi form ở đây (ví dụ gọi API)
};
</script>

<template>
    <BreadCrumb :text="breadcrumbText" />
    <div class="page-container">
        <h2>Liên hệ</h2>
        <div class="contact-form-container">
            <div class="contact-info">
                <p class="restaurant-name">NHÀ HÀNG CHAY SEN</p>
                <p>Địa chỉ: 171 Nguyễn Thái Học, Quận 1, TP Hồ Chí Minh</p>
                <p>Hotline: 028 6278 2186</p>
                <p>Email: senveganhouse@gmail.com</p>
                <p>Fanpage: Nhà Hàng Chay Sen</p>
            </div>

            <div class="contact-form">
                <form @submit.prevent="submitForm">
                    <div class="form-group row">
                        <input
                            type="text"
                            id="fullName"
                            v-model="form.fullName"
                            placeholder="Họ tên"
                            required
                        />
                        <input
                            type="tel"
                            id="phoneNumber"
                            v-model="form.phoneNumber"
                            placeholder="Số điện thoại"
                            required
                        />
                    </div>
                    <div class="form-group row">
                        <input
                            type="text"
                            id="address"
                            v-model="form.address"
                            placeholder="Địa chỉ"
                            required
                        />
                        <input
                            type="email"
                            id="email"
                            v-model="form.email"
                            placeholder="Email"
                            required
                        />
                    </div>
                    <div class="form-group">
                        <input
                            type="text"
                            id="subject"
                            v-model="form.subject"
                            placeholder="Chủ đề"
                            required
                        />
                    </div>
                    <div class="form-group">
                        <textarea
                            id="message"
                            v-model="form.message"
                            placeholder="Nội dung"
                            required
                        ></textarea>
                    </div>
                    <div class="form-buttons">
                        <BaseButton
                            type="submit"
                            btnTitle="GỬI"
                            variant="primary"
                        />
                        <BaseButton
                            @click="resetForm"
                            btnTitle="HỦY"
                            variant="cancel-btn-color"
                        />
                    </div>
                </form>
            </div>
        </div>
    </div>
    <!-- map section -->
    <section class="map-section">
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
    padding-bottom: 0;
}

h2 {
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 40px;
    font-size: 3rem;
    color: var(--yellow-color);
}

.contact-form-container {
    display: flex;
    justify-content: space-between;
    gap: 50px;
}

.contact-info {
    width: 40%;
    color: var(--brown-color);
    text-align: left;
    font-weight: 600;
    line-height: 1.8;
    font-size: 1.8rem;
}

.contact-info .restaurant-name {
    font-weight: 700;
    margin-bottom: 10px;
    font-size: 2.6rem;
}

.contact-info p {
    margin: 5px 0;
}

.contact-form {
    width: 55%;
    padding: 30px;
    background-color: transparent;
}

.contact-form .form-group {
    margin-bottom: 20px;
}

.contact-form .form-group.row {
    display: flex;
    justify-content: space-between;
    gap: 20px;
}

.contact-form .form-group input,
.contact-form .form-group textarea {
    width: 48%;
    padding: 15px;
    border: 1px solid var(--light-gray-color);
    border-radius: 5px;
    font-size: 16px;
    background-color: var(--white-color);
    color: var(--black-color);
}

.contact-form .form-group input#subject {
    width: 100%;
}

.contact-form .form-group textarea {
    width: 100%;
    height: 150px;
}

.contact-form .form-group input::placeholder,
.contact-form .form-group textarea::placeholder {
    color: var(--dark-gray-color);
}

.form-buttons {
    display: flex;
    gap: 10px;
    justify-content: flex-start;
}

/* phần map */
.map-section {
    text-align: center;
}

.map-container {
    width: 100%;
}

@media (max-width: 768px) {
    .page-container {
        padding: 50px 20px;
    }

    h2 {
        font-size: 2.4rem;
        margin-bottom: 30px;
    }

    .contact-form-container {
        flex-direction: column;
        align-items: center;
    }

    .contact-info {
        width: 100%;
        text-align: center;
        font-size: 1.6rem;
    }

    .contact-form {
        width: 100%;
        padding: 20px;
    }

    .contact-form .form-group.row {
        flex-direction: column;
        align-items: center;
    }

    .contact-form .form-group input,
    .contact-form .form-group textarea {
        width: 100%;
        padding: 12px;
    }

    .form-buttons {
        flex-direction: column;
        align-items: center;
    }

    .form-buttons .base-button {
        width: 100%;
        margin-bottom: 10px;
    }
}

@media (max-width: 480px) {
    .page-container {
        padding: 40px 10px;
    }

    h2 {
        font-size: 2rem;
        margin-bottom: 20px;
    }

    .contact-info {
        font-size: 1.4rem;
    }

    .contact-form .form-group input,
    .contact-form .form-group textarea {
        padding: 10px;
        font-size: 14px;
    }

    .form-buttons .base-button {
        font-size: 14px;
        padding: 10px;
    }
}
</style>
