import api from "@/services/axios";

export const fetchTinhThanh = async () => {
    const res = await api.get("/diachi/tinhthanh");
    console.log("Dữ liệu tỉnh thành từ API: ", res.data);
    return res.data;
};

export const fetchQuanHuyen = async (maTinhThanh) => {
    const res = await api.get(`/diachi/quanhuyen/${maTinhThanh}`);
    console.log("Dữ liệu tỉnh thành từ API: ", res.data);
    return res.data;
};

export const fetchPhuongXa = async (maQuanHuyen) => {
    const res = await api.get(`/diachi/phuongxa/${maQuanHuyen}`);
    console.log("Dữ liệu tỉnh thành từ API: ", res.data);
    return res.data;
};

export const fetchDiaChiDayDu = async (maPhuongXa) => {
    const res = await api.get(`/diachi/daydu/${maPhuongXa}`);
    console.log("Dữ liệu địa chỉ đầy đủ từ API: ", res.data);
    return res.data;
};
