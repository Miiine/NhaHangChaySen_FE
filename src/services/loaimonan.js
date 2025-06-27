import api from "@/services/axios";

export const fetchLoaiMonAn = async () => {
    const res = await api.get("/loaimonan");
    console.log("Dữ liệu loại món ăn từ API: ", res.data);
    return res.data.map((ma) => ({
        ...ma,
        label: ma.tenLoai.toUpperCase(),
    }));
};

export const deleteLoaiMonAn = async (maLoai) => {
    try {
        const response = await api.delete(`/loaimonan/${maLoai}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa loại món ăn:", error);
        throw error;
    }
};

// Thêm loại món ăn
export const addLoaiMonAn = async (data) => {
    try {
        const response = await api.post(`/loaimonan`, data);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi thêm loại món ăn:", error);
        throw error;
    }
};

// Cập nhật loại món ăn
export const updateLoaiMonAn = async (maLoai, data) => {
    try {
        const response = await api.put(`/loaimonan/${maLoai}`, data);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật loại món ăn:", error);
        throw error;
    }
};
