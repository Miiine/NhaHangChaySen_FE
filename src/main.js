// import { createApp } from "vue";
// import App from "./App.vue";
// import { createRouter, createWebHistory } from "vue-router";

// import { createPinia } from "pinia";
// // import routes from "@/routers/index.js";
// import { routes } from "@/routers/index.js";

// const router = createRouter({
//     history: createWebHistory(),
//     routes,
//     scrollBehavior(to, from, savedPosition) {
//         if (savedPosition) {
//             return savedPosition; // Quay lại vị trí trước đó khi sử dụng nút back/forward
//         } else {
//             return { top: 0 }; // Cuộn lên đầu trang khi chuyển route
//         }
//     },
// });

// const app = createApp(App);
// app.use(createPinia());
// app.use(router);

// // Đảm bảo cuộn lên đầu trang mỗi khi tải lại trang (F5, nút reload)
// window.addEventListener("load", () => {
//     window.scrollTo(0, 0);
// });

// // Điều này đảm bảo cuộn lên đầu trang khi chuyển route
// router.afterEach(() => {
//     window.scrollTo(0, 0);
// });

// app.mount("#app");

import { createApp } from "vue";
import App from "./App.vue";
import router from "@/routers/index.js"; // import đúng router đã khai báo guard
import { createPinia } from "pinia";

const app = createApp(App);
app.use(createPinia());
app.use(router); // dùng router này luôn

app.mount("#app");
