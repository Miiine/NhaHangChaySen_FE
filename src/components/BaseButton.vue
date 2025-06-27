<script setup>
const props = defineProps({
    btnTitle: String,
    variant: String,
});
</script>

<template>
    <button :class="`base-button ${variant}`" type="submit">
        {{ btnTitle }}
    </button>
</template>

<style scoped>
.base-button {
    padding: 8px 16px;
    min-width: 50px;
    background-color: var(--yellow-color);
    border-radius: 6px;
    border: none;
    font-weight: 500;
    font-size: 1.6rem;
    text-align: center;
    text-transform: uppercase;
    color: var(--white-color);
    cursor: pointer;
    transition: background 0.3s;
}
.base-button:hover {
    background-color: var(--light-yellow);
    transform: scale(1.02);
}

/* Button variants */
.primary {
    background-color: var(--yellow-color);
}
.admin-btn-color {
    background-color: var(--dark-blue-color);
}
.admin-btn-color:hover {
    background-color: #89a5a7;
}
.cancel-btn-color {
    background-color: var(--dark-gray-color);
}
.cancel-btn-color:hover {
    background-color: var(--light-gray-color);
}
.delete-btn-color {
    background-color: var(--red-color);
}
.delete-btn-color:hover {
    background-color: #cf4444;
}
.payment-btn-color {
    background-color: var(--green-color);
}
.payment-btn-color:hover {
    background-color: #29885a;
}

/* --- Responsive --- */
@media (max-width: 768px) {
    .base-button {
        font-size: 1.2rem;
        padding: 9px 18px;
    }
}

@media (max-width: 480px) {
    .base-button {
        font-size: 1rem;
        padding: 8px 16px;
    }
}
</style>
