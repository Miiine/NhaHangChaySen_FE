import api from "@/services/axios";

export const fetchNhaCungCap = async () => {
    const res = await api.get("/nhacungcap");
    console.log("Dữ liệu nhà cung cấp từ API: ", res.data);
    return res.data;
};

export const deleteNhaCungCap = async (maNCC) => {
    const res = await api.delete(`/nhacungcap/${maNCC}`);
    return res.data;
};

// Thêm mới nhà cung cấp
export const addNhaCungCap = async (data) => {
    const res = await api.post("/nhacungcap", data);
    return res.data;
};

// Cập nhật nhà cung cấp
export const updateNhaCungCap = async (maNCC, data) => {
    const res = await api.put(`/nhacungcap/${maNCC}`, data);
    return res.data;
};
