import api from "@/services/axios";

export const saveSearchHistory = async (maTaiKhoan, tuKhoa) => {
    try {
        const res = await api.post("/lichsutimkiem", {
            maTaiKhoan,
            tuKhoa,
        });
        console.log(res.data.message);
    } catch (err) {
        console.error("Lỗi khi lưu từ khóa tìm kiếm: ", err);
    }
};
