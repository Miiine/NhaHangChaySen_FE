import api from "@/services/axios";

export const fetchTaiKhoan = async () => {
    const res = await api.get("/taikhoan");
    console.log("Dữ liệu tài khoản từ API: ", res.data);
    return res.data;
};

export const updateTaiKhoan = async (maTaiKhoan, tkData) => {
    const res = await api.put(`/taikhoan/${maTaiKhoan}`, tkData);
    console.log("Dữ liệu tài khoản cập nhật từ API: ", res.data);
    return res.data;
};

export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await api.post("/taikhoan/upload-avatar", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return res.data;
};

export const createKhachHang = async (khachHangData) => {
    const res = await api.post("/taikhoan/khachhang", khachHangData);
    console.log("Kết quả tạo khách hàng mới: ", res.data);
    return res.data;
};

export const deleteTaiKhoan = async (maTaiKhoan) => {
    try {
        const res = await api.delete(`/taikhoan/${maTaiKhoan}`);
        console.log("Tài khoản đã xóa thành công: ", res.data);
        return res.data;
    } catch (error) {
        console.error("Lỗi khi xóa tài khoản: ", error);
        throw error;
    }
};

// Hàm cập nhật trạng thái tài khoản
export const updateTrangThaiTaiKhoan = async (maTaiKhoan, trangThai) => {
    console.log("Trạng thái gửi lên:", trangThai);
    const res = await api.put(`/taikhoan/${maTaiKhoan}/trangthai`, {
        trangThai: trangThai,
    });
    console.log("Dữ liệu cập nhật trạng thái tài khoản: ", res.data);
    return res.data;
};

// Tạo tài khoản khách hàng
export const createKhachHangQL = async (khachHangData) => {
    try {
        const response = await api.post(
            "/taikhoan/ql_khachhang",
            khachHangData
        );
        console.log("Kết quả tạo khách hàng mới: ", response.data);
        return response.data;
    } catch (error) {
        console.error("Lỗi tạo khách hàng:", error);
        throw error;
    }
};

// Cập nhật tài khoản admin
export const adminUpdateTaiKhoan = async (maTaiKhoan, taiKhoanData) => {
    try {
        const response = await api.put(
            `/taikhoan/${maTaiKhoan}/admin`,
            taiKhoanData
        );
        console.log("Dữ liệu cập nhật tài khoản: ", response.data);
        return response.data;
    } catch (error) {
        console.error("Lỗi cập nhật tài khoản:", error);
        throw error;
    }
};
