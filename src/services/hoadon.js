import api from "@/services/axios";

export const fetchHoaDon = async () => {
    const res = await api.get("/hoadon");

    console.log("Dữ liệu hóa đơn từ API: ", res.data);
    return res.data;
};

export const addHoaDon = async (hoaDonData) => {
    try {
        const res = await api.post("/hoadon", hoaDonData);

        console.log("Hóa đơn đã được thêm thành công: ", res.data);
        return res.data;
    } catch (error) {
        console.error("Lỗi khi thêm hóa đơn: ", error);
        throw error;
    }
};

export const updatePayment = async (maHoaDon, paymentData) => {
    try {
        const res = await api.put(`/hoadon/${maHoaDon}/payment`, paymentData);
        console.log("Cập nhật thanh toán thành công:", res.data);
        return res.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật thanh toán:", error);
        throw error;
    }
};

// Tạo URL thanh toán VNPay
export const createVNPayUrl = async (maHoaDon, amount, paymentType) => {
    try {
        const res = await api.post("/hoadon/create-payment", {
            maHoaDon,
            amount,
            paymentType,
        });
        console.log("URL thanh toán VNPay:", res.data.paymentUrl);
        return res.data.paymentUrl;
    } catch (error) {
        console.error("Lỗi khi tạo URL thanh toán VNPay:", error);
        throw error;
    }
};

export const updateHoaDonStatus = async (maHoaDon, trangThai) => {
    try {
        const res = await api.put(`/hoadon/${maHoaDon}/status`, { trangThai });
        console.log("Cập nhật trạng thái hóa đơn thành công: ", res.data);
        return res.data;
    } catch (err) {
        console.error("Lỗi khi cập nhật trạng thái hóa đơn", err);
        throw err;
    }
};

export const autoCancelHoaDon = async (maHoaDon) => {
    try {
        const res = await api.put("/hoadon/autocancel", { maHoaDon });
        console.log("Cập nhật trạng thái auto cancel thành công: ", res.data);
        return res.data;
    } catch (err) {
        console.error("Lỗi khi cập nhật trạng thái auto cancel", err);
        throw err;
    }
};

//--------------------Admin--------------------//
export const completeHoaDon = async (maHoaDon) => {
    try {
        const res = await api.put(`/hoadon/${maHoaDon}/complete`);
        console.log("Cập nhật trạng thái hóa đơn thành công: ", res.data);
        return res.data;
    } catch (err) {
        console.error("Lỗi khi cập nhật trạng thái hóa đơn", err);
        throw err;
    }
};

export const updateThanhToan = async (maHoaDon, payload) => {
    try {
        const res = await api.put(
            `/hoadon/${maHoaDon}/update-payment`,
            payload
        );
        console.log("Cập nhật trạng thái hóa đơn thành công: ", res.data);
        return res.data;
    } catch (err) {
        console.error("Lỗi khi cập nhật trạng thái hóa đơn", err);
        throw err;
    }
};

export const confirmHoaDon = async (maHoaDon) => {
    try {
        const res = await api.put(`/hoadon/${maHoaDon}/confirm`);
        return res.data;
    } catch (error) {
        throw error;
    }
};

export const cancelHoaDon = async (maHoaDon) => {
    try {
        const res = await api.put(`/hoadon/${maHoaDon}/cancel`);
        return res.data;
    } catch (error) {
        throw error;
    }
};

export const customerReceiveTable = async (maHoaDon) => {
    try {
        const res = await api.put(`/hoadon/${maHoaDon}/receive`);
        console.log("Khách nhận bàn thành công:", res.data);
        return res.data;
    } catch (error) {
        console.error("Lỗi khi khách nhận bàn:", error);
        throw error;
    }
};

// Cập nhật mã bàn trong hóa đơn
export const updateBanHoaDon = async (maHoaDon, maBanMoi) => {
    try {
        const res = await api.put(`/hoadon/${maHoaDon}/update-ban`, {
            maBanMoi,
        });
        console.log("Cập nhật mã bàn thành công:", res.data);
        return res.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật mã bàn:", error);
        throw error;
    }
};

export const adminAddHoaDon = async (hoaDonData) => {
    try {
        const res = await api.post("/hoadon/admin", hoaDonData);

        console.log("Hóa đơn đã được thêm thành công: ", res.data);
        return res.data;
    } catch (error) {
        console.error("Lỗi khi thêm hóa đơn: ", error);
        throw error;
    }
};

export const deleteHoaDon = async (maHoaDon) => {
    const res = await api.delete(`/hoadon/${maHoaDon}`);
    return res.data;
};

export const deleteMultipleHoaDon = async (maHoaDonList) => {
    const res = await api.delete("/hoadon/multiple", {
        data: { maHoaDonList },
    });
    return res.data;
};

export const updateHoaDon = async (maHoaDon, hoaDonData) => {
    try {
        const response = await api.put(
            `/hoadon/${maHoaDon}/update`,
            hoaDonData
        );
        console.log("Cập nhật hóa đơn thành công:", response.data);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật hóa đơn:", error);
        throw error;
    }
};
