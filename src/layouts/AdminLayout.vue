<script setup>
import Admin_Header from "@/layouts/Admin_Header.vue";
import Admin_SideBar from "@/layouts/Admin_SideBar.vue";
</script>

<template>
    <div class="container">
        <Admin_Header />
        <div class="content">
            <Admin_SideBar />
            <div class="admin-page">
                <RouterView />
            </div>
        </div>
    </div>
</template>

<style scoped>
.container {
    display: flex;
    flex-direction: column;
    height: auto;
}

.content {
    display: flex;
    flex: 1;
    margin-top: 80px;
    margin-left: 260px;
}

/* Nội dung chính (admin-page) */
.admin-page {
    overflow-y: auto;
    background-color: var(--light-blue-color);
    width: 100%;
    min-height: 1000px;
}
</style>
