<script setup>
import Header from "@/layouts/Header.vue";
import Footer from "@/layouts/Footer.vue";
</script>

<template>
    <div class="container">
        <Header />
        <div class="content">
            <RouterView />
        </div>
        <Footer />
    </div>
</template>

<style scoped></style>
