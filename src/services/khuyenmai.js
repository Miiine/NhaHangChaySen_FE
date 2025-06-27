import api from "@/services/axios";

export const fetchKhuyenMai = async () => {
    const res = await api.get("/khuyenmai");
    console.log("Dữ liệu khuyến mãi từ API: ", res.data);
    return res.data.map((ma) => ({
        ...ma,
        label: ma.tenKhuyenMai.toUpperCase(),
    }));
};

// ---------------------Admin----------------------
export const deleteKhuyenMai = async (maKhuyenMai) => {
    await api.delete(`/khuyenmai/${maKhuyenMai}`);
};

export const addKhuyenMai = async (data) => {
    return await api.post("/khuyenmai/add", data, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

// Cập nhật khuyến mãi
export const updateKhuyenMai = async (maKhuyenMai, data) => {
    return await api.put(`/khuyenmai/update/${maKhuyenMai}`, data, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};
