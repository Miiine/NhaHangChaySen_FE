import api from "@/services/axios";

export const fetchThongBao = async () => {
    try {
        const res = await api.get("/thongbao");

        console.log("Dữ liệu thông báo từ API: ", res.data);
        return res.data;
    } catch (err) {
        console.error("Lỗi fetchThongBao: ", err);
        throw err;
    }
};

export const markNotifAsRead = async (maThongBao) => {
    await api.patch(`/thongbao/${maThongBao}/read`);
};

export const createThongBao = async (data) => {
    try {
        const res = await api.post("/thongbao", data);
        return res.data;
    } catch (error) {
        console.error("Lỗi tạo thông báo:", error);
        throw error;
    }
};
