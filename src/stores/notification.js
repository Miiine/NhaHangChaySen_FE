import { defineStore } from "pinia";
import { fetchThongBao } from "@/services/thongbao";

export const useNotificationStore = defineStore("notification", {
    state: () => ({
        notifications: {}, // Lưu trữ thông báo cho từng userId
    }),
    actions: {
        // Fetch số lượng thông báo chưa đọc cho một userId cụ thể
        async fetchUnreadCount(userId) {
            try {
                // Lấy thông báo từ API
                const data = await fetchThongBao(); // Giả sử API trả về mảng thông báo

                // Lọc thông báo chưa đọc cho userId
                const unreadNotifications = data.filter(
                    (tb) =>
                        tb.maNguoiNhan === userId && tb.trangThai === "chua_doc"
                );

                // Lưu số lượng thông báo chưa đọc cho userId vào store
                this.notifications[userId] = unreadNotifications.length;
            } catch (e) {
                console.error("Lỗi khi lấy thông báo:", e);
            }
        },

        // Cập nhật số lượng thông báo của một userId (cập nhật số lượng thông báo trực tiếp)
        updateUnreadCount(userId, count) {
            this.notifications[userId] = count;
        },
    },
});
