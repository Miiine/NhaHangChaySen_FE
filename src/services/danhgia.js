import api from "@/services/axios";

export const fetchDanhGia = async () => {
    const res = await api.get("/danhgia");
    console.log("Dữ liệu đánh giá từ API:", res.data);
    return res.data;
};

export const addDanhGia = async (payload) => {
    const res = await api.post("/danhgia", payload);
    console.log("Dữ liệu cập nhật đánh giá từ API:", res.data);
    return res.data;
};

export const updateDanhGia = async (payload) => {
    const res = await api.put("/danhgia", payload);
    console.log("Dữ liệu cập nhật đánh giá từ API:", res.data);
    return res.data;
};
