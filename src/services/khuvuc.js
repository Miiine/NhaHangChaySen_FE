import api from "@/services/axios";

export const fetchKhuVuc = async () => {
    try {
        const res = await api.get("/khuvuc");
        console.log("Dữ liệu khu vực từ API:", res.data);
        // Kiểm tra nếu dữ liệu trả về là một mảng hợp lệ
        if (Array.isArray(res.data)) {
            return res.data.map((kv) => ({
                ...kv,
                images: Array.isArray(kv.anhKhuVuc) ? kv.anhKhuVuc : [],
                label: kv.tenKhuVuc.toUpperCase(),
            }));
        } else {
            console.error("Dữ liệu không hợp lệ từ API:", res.data);
            return [];
        }
    } catch (error) {
        // In thông tin lỗi nếu có
        console.error(
            "Lỗi gọi API khu vực:",
            error.response ? error.response.data : error.message
        );
        return [];
    }
};
