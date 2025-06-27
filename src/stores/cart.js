import { defineStore } from "pinia";
import { fetchGioHang } from "@/services/giohang";

export const useCartStore = defineStore("cart", {
    state: () => ({
        totalItemCount: 0,
    }),
    actions: {
        // Cập nhật tổng số lượng món ăn trong giỏ hàng khi có thay đổi
        updateTotalItemCount(newTotalItemCount) {
            this.totalItemCount = newTotalItemCount;
        },

        // Tính toán tổng số lượng món ăn trong giỏ hàng và cập nhật vào store
        async calculateTotalItemCount(userId) {
            let validData = [];
            try {
                // Lấy giỏ hàng từ API
                const ghData = await fetchGioHang(userId);

                // Kiểm tra xem ghData có phải là mảng không, nếu có thì sử dụng nó
                if (ghData && Array.isArray(ghData.data)) {
                    validData = ghData.data;
                }
                // Kiểm tra nếu ghData là đối tượng, chuyển đối tượng thành mảng giá trị
                else if (ghData && typeof ghData === "object") {
                    validData = Object.values(ghData); // Chuyển đối tượng thành mảng giá trị
                }

                // Tính tổng số lượng món ăn trong giỏ hàng
                this.totalItemCount = validData.reduce(
                    (total, item) => total + item.soLuongThem,
                    0
                );
            } catch (err) {
                console.error(
                    "Lỗi khi tính toán tổng số lượng món ăn trong giỏ hàng:",
                    err
                );
            }
        },
    },
});
