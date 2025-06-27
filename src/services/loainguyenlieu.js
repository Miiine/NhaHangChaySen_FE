import api from "@/services/axios";

export const fetchLoaiNL = async () => {
    const res = await api.get("/loainguyenlieu");
    console.log("Dữ liệu loại nguyên liệu từ API: ", res.data);
    return res.data;
};

export const deleteLoaiNL = async (maLoaiNL) => {
    try {
        const response = await api.delete(`/loainguyenlieu/${maLoaiNL}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa loại nguyên liệu:", error);
        throw error;
    }
};

export const addLoaiNL = async (categoryName) => {
    try {
        const response = await api.post("/loainguyenlieu", {
            tenLoaiNL: categoryName,
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi thêm loại nguyên liệu:", error);
        throw error;
    }
};

export const updateLoaiNL = async (maLoaiNL, categoryName) => {
    try {
        const response = await api.put(`/loainguyenlieu/${maLoaiNL}`, {
            tenLoaiNL: categoryName,
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật loại nguyên liệu:", error);
        throw error;
    }
};
