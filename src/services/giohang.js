import api from "@/services/axios";

export const fetchGioHang = async (maTaiKhoan) => {
    const res = await api.get(`/giohang/${maTaiKhoan}`);

    console.log("Dữ liệu món ăn trong giỏ hàng từ API: ", res.data);
    return res.data;
};

export const addDishesToCart = async (maTaiKhoan, maMonAn, soLuongThem) => {
    try {
        const res = await api.post("/giohang", {
            maTaiKhoan,
            maMonAn,
            soLuongThem,
        });

        console.log("Dữ liệu món ăn thêm vào giỏ hàng: ", res.data);
        return res.data;
    } catch (err) {
        console.error("Lỗi addDishesToCart: ", err);
        throw err;
    }
};

export const deleteDishFromCart = async (maTaiKhoan, maMonAn) => {
    try {
        const res = await api.delete(`/giohang/${maTaiKhoan}/${maMonAn}`);

        console.log("Dữ liệu món ăn xóa khỏi giỏ hàng: ", res.data);
        return res.data;
    } catch (err) {
        console.error("Lỗi deleteDishFromCart: ", err);
        throw err;
    }
};

export const updateSLInCart = async (maTaiKhoan, maMonAn, soLuongThem) => {
    try {
        const res = await api.put("/giohang", {
            maTaiKhoan,
            maMonAn,
            soLuongThem,
        });

        console.log("Dữ liệu món ăn cập nhật trong giỏ hàng: ", res.data);
        return res.data;
    } catch (err) {
        console.error("Lỗi updateQuantityInCart: ", err);
        throw err;
    }
};
