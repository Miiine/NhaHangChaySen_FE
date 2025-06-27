import api from "@/services/axios";

export const fetchLoaiBan = async () => {
    const res = await api.get("/loaiban");
    console.log("Dữ liệu loại bàn từ API: ", res.data);
    return res.data;
};
