import api from "@/services/axios";

export const fetchNguyenLieu = async () => {
    const res = await api.get("/nguyenlieu");
    console.log("Dữ liệu món ăn từ API: ", res.data);
    return res.data;
};

export const deleteNguyenLieu = async (maNguyenLieu) => {
    try {
        const response = await api.delete(`/nguyenlieu/${maNguyenLieu}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa nguyên liệu:", error);
        throw error;
    }
};

// Thêm nguyên liệu
export const addNguyenLieu = async (nguyenLieuData) => {
    try {
        const response = await api.post("/nguyenlieu", nguyenLieuData);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi thêm nguyên liệu:", error);
        throw error;
    }
};

// Cập nhật nguyên liệu
export const updateNguyenLieu = async (maNguyenLieu, nguyenLieuData) => {
    try {
        const response = await api.put(
            `/nguyenlieu/${maNguyenLieu}`,
            nguyenLieuData
        );
        return response.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật nguyên liệu:", error);
        throw error;
    }
};
