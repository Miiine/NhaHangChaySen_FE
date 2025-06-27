import api from "@/services/axios";

export const fetchMonAn = async () => {
    const res = await api.get("/monan");
    console.log("Dữ liệu món ăn từ API:", res.data);
    return res.data.map((monAn) => ({
        ...monAn,
        images: Array.isArray(monAn.anhMonAn) ? monAn.anhMonAn : [],
        danhGia: Array.isArray(monAn.danhGia) ? monAn.danhGia : [],
        avgRating: monAn.avgRating,
        label: monAn.tenMonAn.toUpperCase(),
    }));
};

export const addMonAn = async (data) => {
    return await api.post("/monan/add", data, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

// ------------------------Admin----------------------
export const deleteMonAn = async (maMonAn) => {
    await api.delete(`/monan/${maMonAn}`);
};

export const updateMonAn = async (maMonAn, data) => {
    return await api.put(`/monan/${maMonAn}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};
