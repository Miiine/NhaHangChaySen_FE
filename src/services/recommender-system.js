import api from "@/services/axios";

export const fetchRecommendDishes = async (maMonAn) => {
    try {
        const res = await api.get(`/recommend-dishes`, {
            params: { maMonAn },
        });

        console.log("Dữ liệu món ăn gợi ý: ", res.data);
        return res.data;
    } catch (error) {
        console.error("Lỗi khi lấy món ăn gợi ý: ", error);
        throw error;
    }
};

export const fetchRecommendDishesByUser = async (maTaiKhoan) => {
    try {
        const response = await api.get(`/recommend-dishes-byUser`, {
            params: { maTaiKhoan },
        });

        console.log("Món ăn gợi ý:", response.data);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy món ăn gợi ý:", error);
        throw error;
    }
};
