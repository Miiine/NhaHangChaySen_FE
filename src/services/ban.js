import api from "@/services/axios";

export const fetchBan = async () => {
    const res = await api.get("/ban");
    console.log("Dữ liệu bàn từ API: ", res.data);
    return res.data;
};

// ------------------admin--------------------

export const addBan = async (ban) => {
    // ban: { maLoaiBan, maKhuVuc, trangThai }
    const res = await api.post("/ban", ban);
    return res.data;
};

export const updateBan = async (ban) => {
    // ban: { maBan, maLoaiBan, maKhuVuc, trangThai }
    const res = await api.put("/ban", ban);
    return res.data;
};

export const deleteBan = async (maBan) => {
    const res = await api.delete(`/ban/${maBan}`);
    return res.data;
};

export const deleteMultipleBan = async (maBanList) => {
    // maBanList: array of IDs
    const res = await api.post("/ban/delete-multiple", { maBanList });
    return res.data;
};

export const updateTrangThaiBan = async (maBan, trangThaiBan) => {
    try {
        const res = await api.put(`/ban/${maBan}/update-status`, {
            trangThaiBan,
        });
        return res.data;
    } catch (error) {
        throw error;
    }
};
