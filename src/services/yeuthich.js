import api from "@/services/axios";

export const fetchMAYeuThich = async (maTaiKhoan) => {
    const res = await api.get(`/yeuthich/${maTaiKhoan}`);

    console.log("Dữ liệu món ăn yêu thích từ API: ", res.data);
    return res.data;
};

export const toggleFavoriteDishes = async (maTaiKhoan, maMonAn) => {
    try {
        const res = await api.post("/yeuthich/", { maTaiKhoan, maMonAn });

        console.log("Dữ liệu món ăn thay đổi: ", res.data);
        return res.data;
    } catch (err) {
        console.error("Lỗi toggleFavoriteDishes: ", err);
        throw err;
    }
};
