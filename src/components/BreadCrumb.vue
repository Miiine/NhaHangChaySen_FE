<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const props = defineProps({
    text: {
        type: String,
        default: "",
    },
});

const route = useRoute();
const router = useRouter();

const crumbs = computed(() => {
    return Array.isArray(route.meta.breadcrumb) ? route.meta.breadcrumb : [];
});

const breadcrumbText = computed(() => {
    return props.text ? `${props.text}` : "";
});

function formatTo(to) {
    if (!to) return to;
    if (typeof to === "string" && to.includes(":maHoaDon")) {
        return to.replace(":maHoaDon", route.params.maHoaDon || "");
    }
    return to;
}
</script>

<template>
    <nav v-if="crumbs.length || breadcrumbText" class="breadcrumb">
        <template v-for="(item, i) in crumbs" :key="i">
            <router-link
                v-if="item.to"
                :to="formatTo(item.to)"
                class="breadcrumb-link"
            >
                {{ item.text }}
            </router-link>
            <span v-else class="breadcrumb-text"> {{ item.text }}</span>
            <span v-if="i < crumbs.length - 1" class="separator">/</span>
        </template>

        <span v-if="breadcrumbText" class="separator">/</span>
        <span v-if="breadcrumbText" class="breadcrumb-text">{{
            breadcrumbText
        }}</span>
    </nav>
</template>

<style scoped>
.breadcrumb {
    display: flex;
    align-items: center;
    font-size: 1.4rem;
    background-color: var(--light-gray-color);
    padding: 8px 15px;
}

.breadcrumb-link {
    color: var(--black-color);
}

.breadcrumb-link:hover {
    text-decoration: underline;
    color: var(--yellow-color);
}

.breadcrumb-text {
    color: var(--dark-gray-color);
}

.separator {
    margin: 0 0.5rem;
    color: var(--dark-gray-color);
}
</style>
