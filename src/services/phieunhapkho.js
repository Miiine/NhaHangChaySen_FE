import api from "@/services/axios";

export const fetchPhieuNhapKho = async () => {
    try {
        const response = await api.get("/phieunhapkho");
        return response.data;
    } catch (error) {
        console.error("Lỗi khi fetch phiếu nhập kho:", error);
        throw error;
    }
};

export const deletePhieuNhapKho = async (maNhapKho) => {
    try {
        const res = await api.delete(`/phieunhapkho/${maNhapKho}`);
        return res.data;
    } catch (error) {
        console.error("Lỗi khi xóa phiếu nhập kho:", error);
        throw error;
    }
};

export const addPhieuNhapKho = async ({
    maTaiKhoan,
    maNCC,
    chiTietNhapKho,
}) => {
    // gửi JSON, axios tự set Content-Type: application/json
    return await api.post("/phieunhapkho/add", {
        maTaiKhoan,
        maNCC,
        chiTietNhapKho: JSON.stringify(chiTietNhapKho),
    });
};

export const updatePhieuNhapKho = async (
    maNhapKho,
    { maTaiKhoan, maNCC, chiTietNhapKho }
) => {
    return await api.put(`/phieunhapkho/${maNhapKho}`, {
        maTaiKhoan,
        maNCC,
        chiTietNhapKho: JSON.stringify(chiTietNhapKho),
    });
};
