import api from "@/services/axios";

export const fetchSoLuongBanMonAn = async () => {
    try {
        const res = await api.get("/thongke");
        console.log("Dữ liệu số lượng bán các món ăn từ API: ", res.data);
        return res.data;
    } catch (error) {
        console.error("Lỗi khi gọi API để lấy số lượng bán món ăn: ", error);
        throw error;
    }
};

// Lấy số lượng hóa đơn có trạng thái "da_hoan_thanh" theo tháng và năm
export const fetchSoLuongHoaDonDaHoanThanh = async (year, month) => {
    try {
        const res = await api.get("/thongke/soLuongHoaDonDaHoanThanh", {
            params: { year, month },
        });
        console.log(
            "Dữ liệu số lượng hóa đơn da_hoan_thanh từ API: ",
            res.data
        );
        return res.data;
    } catch (error) {
        console.error(
            "Lỗi khi gọi API để lấy số lượng hóa đơn da_hoan_thanh: ",
            error
        );
        throw error;
    }
};

// Lấy tổng doanh thu của các hóa đơn có trạng thái "da_hoan_thanh" theo tháng và năm
export const fetchTongDoanhThuDaHoanThanh = async (year, month) => {
    try {
        const res = await api.get("/thongke/tongDoanhThuDaHoanThanh", {
            params: { year, month },
        });
        console.log("Dữ liệu tổng doanh thu da_hoan_thanh từ API: ", res.data);
        return res.data;
    } catch (error) {
        console.error(
            "Lỗi khi gọi API để lấy tổng doanh thu da_hoan_thanh: ",
            error
        );
        throw error;
    }
};

// Lấy số lượng khách hàng có mã vai trò = 1 theo tháng và năm
export const fetchSoLuongKhachHangVaiTro1 = async (year, month) => {
    try {
        const res = await api.get("/thongke/soLuongKhachHangVaiTro1", {
            params: { year, month },
        });
        console.log("Dữ liệu số lượng khách hàng vai trò 1 từ API: ", res.data);
        return res.data;
    } catch (error) {
        console.error(
            "Lỗi khi gọi API để lấy số lượng khách hàng vai trò 1: ",
            error
        );
        throw error;
    }
};

//Lấy daonh thu và lợi nhuận theo ngày hoặc tháng
export const fetchDoanhThuVaLoiNhuan = async (year, month) => {
    try {
        const res = await api.get("/thongke/doanhThuVaLoiNhuan", {
            params: { year, month },
        });
        console.log("Dữ liệu doanh thu và lợi nhuận từ API: ", res.data);
        return res.data;
    } catch (error) {
        console.error("Lỗi khi gọi API để lấy doanh thu và lợi nhuận: ", error);
        throw error;
    }
};
