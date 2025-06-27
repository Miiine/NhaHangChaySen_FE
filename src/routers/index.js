import { createRouter, createWebHistory } from "vue-router";
import Swal from "sweetalert2";
import { useAuthStore } from "@/stores/auth";

import DangNhap from "@/pages/DangNhap_DangKy/DangNhap.vue";
import ActivateAccount from "@/pages/DangNhap_DangKy/ActivateAccount.vue";
import RequestPasswordReset from "@/pages/DangNhap_DangKy/RequestPasswordReset.vue";
import ResetPassword from "@/pages/DangNhap_DangKy/ResetPassword.vue";
import DangKy from "@/pages/DangNhap_DangKy/DangKy.vue";
import CustomerLayout from "@/layouts/CustomerLayout.vue";
import TrangChu from "@/pages/KhachHang/TrangChu.vue";
import GioiThieuNhaHang from "@/pages/KhachHang/GioiThieuNhaHang.vue";
import GioiThieuKhuVuc from "@/pages/KhachHang/GioiThieuKhuVuc.vue";
import ThucDon from "@/pages/KhachHang/ThucDon.vue";
import ChiTietMonAn from "@/pages/KhachHang/ChiTietMonAn.vue";
import UuDai from "@/pages/KhachHang/UuDai.vue";
import ChiTietUuDai from "@/pages/KhachHang/ChiTietUuDai.vue";
import LienHe from "@/pages/KhachHang/LienHe.vue";
import GioHang from "@/pages/KhachHang/GioHang.vue";
import DatBan from "@/pages/KhachHang/DatBan.vue";
import ThanhToan from "@/pages/KhachHang/ThanhToan.vue";
import ThongTinCaNhan from "@/pages/KhachHang/ThongTinCaNhan.vue";
import DanhSachYeuThich from "@/pages/KhachHang/DanhSachYeuThich.vue";
import LichSuDatBan from "@/pages/KhachHang/LichSuDatBan.vue";
import ThongBao from "@/pages/KhachHang/ThongBao.vue";
import ChiTietHoaDon from "@/pages/KhachHang/ChiTietHoaDon.vue";
import DanhGia from "@/pages/KhachHang/DanhGia.vue";
import XemDanhGia from "@/pages/KhachHang/XemDanhGia.vue";

// phần quản lý
import AdminLayout from "@/layouts/AdminLayout.vue";
import ThongKe from "@/pages/QuanLy/ThongKe.vue";
import SoDoBan from "@/pages/QuanLy/SoDoBan.vue";
import DanhSachBan from "@/pages/QuanLy/DanhSachBan.vue";
import LichDatBan from "@/pages/QuanLy/LichDatBan.vue";
import ThemDonDatBan from "@/pages/QuanLy/ThemDonDatBan.vue";
import TaiKhoan from "@/pages/QuanLy/TaiKhoan.vue";
import QuanLyLichSuDatBan from "@/pages/QuanLy/QuanLyLichSuDatBan.vue";
import ChiTietDonDatBan from "@/pages/QuanLy/ChiTietDonDatBan.vue";
import ChinhSuaDonDatBan from "@/pages/QuanLy/ChinhSuaDonDatBan.vue";
import QuanLyUuDai from "@/pages/QuanLy/QuanLyUuDai.vue";
import DanhSachMonAn from "@/pages/QuanLy/DanhSachMonAn.vue";
import DanhMucMonAn from "@/pages/QuanLy/DanhMucMonAn.vue";
import DanhMucNguyenLieu from "@/pages/QuanLy/DanhMucNguyenLieu.vue";
import DanhSachNguyenLieu from "@/pages/QuanLy/DanhSachNguyenLieu.vue";
import NhaCungCap from "@/pages/QuanLy/NhaCungCap.vue";
import ThemMonAn from "@/pages/QuanLy/ThemMonAn.vue";
import ThongBaoAdmin from "@/pages/QuanLy/ThongBaoAdmin.vue";
import LichSuNhapKho from "@/pages/QuanLy/LichSuNhapKho.vue";
import ThemPhieuNhapKho from "@/pages/QuanLy/ThemPhieuNhapKho.vue";
import ThemMoiUuDai from "@/pages/QuanLy/ThemMoiUuDai.vue";
import ChinhSuaUuDai from "@/pages/QuanLy/ChinhSuaUuDai.vue";
import ChiTietQLUuDai from "@/pages/QuanLy/ChiTietQLUuDai.vue";
import ChiTietMonAnQL from "@/pages/QuanLy/ChiTietMonAnQL.vue";
import ChinhSuaMonAn from "@/pages/QuanLy/ChinhSuaMonAn.vue";
import ChiTietPhieuNhapKho from "@/pages/QuanLy/ChiTietPhieuNhapKho.vue";
import ChinhSuaPhieuNhapKho from "@/pages/QuanLy/ChinhSuaPhieuNhapKho.vue";

export const routes = [
    {
        path: "/DangNhap",
        name: "DangNhap",
        component: DangNhap,
        meta: {
            roles: [1, 2, 3],
        },
    },
    {
        path: "/DangKy",
        name: "DangKy",
        component: DangKy,
        meta: {
            roles: [1, 2, 3],
        },
    },
    {
        path: "/activate-account",
        name: "ActivateAccount",
        component: ActivateAccount,
        meta: {
            roles: [1, 2, 3],
        },
    },
    {
        path: "/request-password-reset",
        name: "RequestPasswordReset",
        component: RequestPasswordReset,
        meta: {
            roles: [1, 2, 3],
        },
    },
    {
        path: "/reset-password",
        name: "ResetPassword",
        component: ResetPassword,
        meta: {
            roles: [1, 2, 3],
        },
    },
    {
        path: "/",
        component: CustomerLayout,
        children: [
            {
                path: "/",
                name: "TrangChu",
                component: TrangChu,
                meta: {
                    roles: [1],
                },
            },
            {
                path: "/NhaHang",
                name: "NhaHang",
                component: GioiThieuNhaHang,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Giới thiệu nhà hàng" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/KhuVuc",
                name: "KhuVuc",
                component: GioiThieuKhuVuc,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Giới thiệu khu vực" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/ThucDon",
                name: "ThucDon",
                component: ThucDon,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Thực đơn" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/ThucDon",
                name: "ThucDonFromCart",
                component: ThucDon,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Giỏ hàng", to: "/GioHang" },
                        { text: "Thực đơn" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/ThucDon/:maMonAn/:slug",
                name: "ChiTietMonAn",
                component: ChiTietMonAn,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Thực đơn", to: "/ThucDon" },
                        { text: "Tên món ăn ne" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/GioHang/:maMonAn/:slug",
                name: "ChiTietMonAnFromCart",
                component: ChiTietMonAn,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Giỏ hàng", to: "/GioHang" },
                        { text: "Tên món ăn ne" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/GioHang/:maMonAn/:slug",
                name: "ChiTietMonAnFromOrder",
                component: ChiTietMonAn,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Đặt bàn", to: "/DatBan" },
                        { text: "Tên món ăn ne" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/UuDai",
                name: "UuDai",
                component: UuDai,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Ưu đãi" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/UuDai/:maKhuyenMai/:slug",
                name: "ChiTietUuDai",
                component: ChiTietUuDai,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Ưu đãi", to: "/UuDai" },
                        { text: "Tên ưu đãi ne" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/LienHe",
                name: "LienHe",
                component: LienHe,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Liên hệ" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/GioHang",
                name: "GioHang",
                component: GioHang,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Giỏ hàng" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/DatBan",
                name: "DatBan",
                component: DatBan,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Đặt bàn" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/DatBan",
                name: "DatBanFromCart",
                component: DatBan,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Giỏ hàng", to: "/GioHang" },
                        { text: "Đặt bàn" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/ThanhToan/:maHoaDon",
                name: "ThanhToanFromDatBan",
                component: ThanhToan,
                props: true,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Đặt bàn", to: "/DatBan" },
                        { text: "Thanh toán" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/ThanhToan/:maHoaDon",
                name: "ThanhToanFromLichSu",
                component: ThanhToan,
                props: true,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Lịch sử đặt bàn", to: "/LichSuDatBan" },
                        { text: "Thanh toán" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/ThongTinCaNhan",
                name: "ThongTinCaNhan",
                component: ThongTinCaNhan,
                props: true,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Thông tin cá nhân" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/DanhSachYeuThich",
                name: "DanhSachYeuThich",
                component: DanhSachYeuThich,
                props: true,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Thông tin cá nhân", to: "/ThongTinCaNhan" },
                        { text: "Danh sách yêu thích" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/DanhSachYeuThich/:maMonAn/:slug",
                name: "ChiTietMonAnFromLike",
                component: ChiTietMonAn,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        {
                            text: "Danh sách yêu thích",
                            to: "/DanhSachYeuThich",
                        },
                        { text: "Tên món ăn ne" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/LichSuDatBan",
                name: "LichSuDatBan",
                component: LichSuDatBan,
                props: true,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Thông tin cá nhân", to: "/ThongTinCaNhan" },
                        { text: "Lịch sử đặt bàn" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/ThongBao",
                name: "ThongBao",
                component: ThongBao,
                props: true,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Thông tin cá nhân", to: "/ThongTinCaNhan" },
                        { text: "Thông báo" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/LichSuDatBan/:maHoaDon",
                name: "ChiTietHoaDon",
                component: ChiTietHoaDon,
                props: true,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Lịch sử đặt bàn", to: "/LichSuDatBan" },
                        { text: "ChiTietHoaDon" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/DanhGia/:maHoaDon",
                name: "DanhGiaFromLichSu",
                component: DanhGia,
                props: true,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Lịch sử đặt bàn", to: "/LichSuDatBan" },
                        {
                            text: "Chi tiết hóa đơn",
                            to: "/LichSuDatBan/:maHoaDon",
                        },
                        { text: "Đánh giá" },
                    ],
                    roles: [1],
                },
            },
            {
                path: "/ListDanhGia/:maHoaDon",
                name: "ListDanhGiaFromLichSu",
                component: XemDanhGia,
                props: true,
                meta: {
                    breadcrumb: [
                        { text: "Trang chủ", to: "/" },
                        { text: "Lịch sử đặt bàn", to: "/LichSuDatBan" },
                        {
                            text: "Chi tiết hóa đơn",
                            to: "/LichSuDatBan/:maHoaDon",
                        },
                        { text: "List Đánh giá" },
                    ],
                    roles: [1],
                },
            },
        ],
    },
    //admin layout
    {
        path: "/admin/",
        component: AdminLayout,
        children: [
            {
                path: "",
                name: "ThongKe",
                component: ThongKe,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "datban/sodo",
                name: "SoDoBan",
                component: SoDoBan,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "datban/sodo/danhsachban",
                name: "DanhSachBan",
                component: DanhSachBan,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "datban/lichdat",
                name: "LichDatBan",
                component: LichDatBan,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "datban/lichdat/themdondatban",
                name: "ThemDonDatBan",
                component: ThemDonDatBan,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "datban/lichsudatban",
                name: "QuanLyLichSuDatBan",
                component: QuanLyLichSuDatBan,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "datban/lichsudatban/:maHoaDon",
                name: "ChiTietDonDatBan",
                component: ChiTietDonDatBan,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "taikhoan",
                name: "TaiKhoan",
                component: TaiKhoan,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "uudai",
                name: "QuanLyUuDai",
                component: QuanLyUuDai,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "monan/danhsach",
                name: "DanhSachMonAn",
                component: DanhSachMonAn,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "monan/danhsach/themmoi",
                name: "ThemMonAn",
                component: ThemMonAn,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "monan/danhmuc",
                name: "DanhMucMonAn",
                component: DanhMucMonAn,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "nguyenlieu/danhmuc",
                name: "DanhMucNguyenLieu",
                component: DanhMucNguyenLieu,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "nguyenlieu/danhsach",
                name: "DanhSachNguyenLieu",
                component: DanhSachNguyenLieu,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "nhacungcap",
                name: "NhaCungCap",
                component: NhaCungCap,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "thongbao",
                name: "ThongBaoAdmin",
                component: ThongBaoAdmin,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "datban/lichdat/:maHoaDon",
                name: "ChinhSuaDonDatBan",
                component: ChinhSuaDonDatBan,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "nguyenlieu/nhapkho",
                name: "LichSuNhapKho",
                component: LichSuNhapKho,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "nguyenlieu/nhapkho/themphieunhapkho",
                name: "ThemPhieuNhapKho",
                component: ThemPhieuNhapKho,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "uudai/themmoi",
                name: "ThemMoiUuDai",
                component: ThemMoiUuDai,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "uudai/chitiet/:maKhuyenMai",
                name: "ChiTietQLUuDai",
                component: ChiTietQLUuDai,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "uudai/chitiet/chinhsua/:maKhuyenMai",
                name: "ChinhSuaUuDai",
                component: ChinhSuaUuDai,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "monan/danhsach/chitiet/:maMonAn",
                name: "ChiTietMonAnQL",
                component: ChiTietMonAnQL,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "monan/danhsach/chitiet/chinhsua/:maMonAn",
                name: "ChinhSuaMonAn",
                component: ChinhSuaMonAn,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "nguyenlieu/nhapkho/chitiet/:maNhapKho",
                name: "ChiTietPhieuNhapKho",
                component: ChiTietPhieuNhapKho,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "nguyenlieu/nhapkho/chitiet/chinhsua/:maNhapKho",
                name: "ChinhSuaPhieuNhapKho",
                component: ChinhSuaPhieuNhapKho,
                meta: {
                    roles: [2, 3],
                },
            },
            {
                path: "nguyenlieu/nhapkho/chitiet/chinhsua/:maNhapKho",
                name: "ChinhSuaPhieuNhapKho",
                component: ChinhSuaPhieuNhapKho,
                meta: {
                    roles: [2, 3],
                },
            },
        ],
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Navigation guard để check Authentication
router.beforeEach((to, from, next) => {
    const auth = useAuthStore();

    const publicPages = [
        "DangNhap",
        "DangKy",
        "ActivateAccount",
        "RequestPasswordReset",
        "ResetPassword",
        "LienHe",
        "UuDai",
        "ThucDon",
        "KhuVuc",
        "NhaHang",
        "TrangChu",
    ];

    const authRequired = !publicPages.includes(to.name);

    // Chưa đăng nhập, chuyển về login
    if (authRequired && !(auth.token || localStorage.getItem("token"))) {
        Swal.fire({
            icon: "error",
            title: "Bạn chưa đăng nhập",
            text: "Vui lòng đăng nhập để truy cập trang này!",
            confirmButtonText: "Đăng nhập",
        }).then(() => {
            next({ path: "/DangNhap", query: { redirect: to.fullPath } });
        });
        return;
    }

    // Kiểm tra phân quyền nếu có roles
    if (authRequired && to.meta.roles) {
        const userRole = auth.user?.maVaiTro;

        if (!userRole || !to.meta.roles.includes(userRole)) {
            Swal.fire({
                icon: "error",
                title: "Bạn không có quyền truy cập",
                text: "Bạn không đủ quyền để vào trang này.",
                confirmButtonText: "Trang chủ",
            }).then(() => {
                next({ name: "TrangChu" });
            });
            return;
        }
    }

    next();
});

export default router;
