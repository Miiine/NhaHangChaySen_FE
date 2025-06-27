import { defineStore } from "pinia";

export const useSearchStore = defineStore("search", {
    state: () => ({
        searchText: "",
    }),
    actions: {
        setSearchText(newSearchText) {
            console.log("setSearchText gọi với giá trị: ", newSearchText);
            this.searchText = newSearchText; // Cập nhật searchText khi người dùng nhập
        },
    },
    getters: {
        // Getter để lấy searchText từ store
        getSearchText: (state) => state.searchText,
    },
});
