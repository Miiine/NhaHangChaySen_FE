<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Swal from "sweetalert2";
import { fetchThongBao, markNotifAsRead } from "@/services/thongbao";

const router = useRouter();
const { user } = useAuthStore();
const auth = useAuthStore();

const notifications = ref([]);
const thisNotifications = ref([]);
const currentPage = ref(1);
const itemsPerPage = 4;

const totalPages = computed(() =>
    Math.ceil(thisNotifications.value.length / itemsPerPage)
);

const pagedNotifications = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return thisNotifications.value.slice(start, start + itemsPerPage);
});

const formatTimestamp = (timestamp) => {
    const d = new Date(timestamp);
    const pad = (n) => n.toString().padStart(2, "0");
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const dd = pad(d.getDate());
    const MM = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    return `${hh}:${mm} ${dd}/${MM}/${yyyy}`;
};

const goPage = (page) => {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    window.scrollTo(0, 0);
};

async function loadData() {
    try {
        const tbData = await fetchThongBao();
        notifications.value = tbData;

        thisNotifications.value = notifications.value.filter(
            (tb) => tb.maNguoiNhan === user.id
        );

        console.log("this", thisNotifications.value);
        console.log("this", user.id);
    } catch (err) {
        console.error("API error:", err);
    }
}

let observer = null;

onMounted(async () => {
    try {
        await loadData();

        // tạo observer
        observer = new IntersectionObserver(
            async (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const id = el.dataset.id;
                        const item = thisNotifications.value.find(
                            (n) => n.maThongBao == id
                        );
                        if (item && item.trangThai === "chua_doc") {
                            try {
                                await markNotifAsRead(id);
                                item.trangThai = "da_doc";
                            } catch (e) {
                                console.error("Không mark được read:", e);
                            }
                        }
                        observer.unobserve(el);
                    }
                }
            },
            { threshold: 0.5 }
        );

        // sau khi DOM render xong, observe từng element
        await nextTick();
        document.querySelectorAll(".notification").forEach((el) => {
            observer.observe(el);
        });
    } catch (err) {
        console.error("loadData failed:", err);
    }
});

watch([pagedNotifications, currentPage], async () => {
    await nextTick(); // Đảm bảo DOM render xong
    document.querySelectorAll(".notification").forEach((el) => {
        observer.observe(el);
    });
});
</script>

<template>
    <div class="page-container">
        <div class="right-content">
            <h3 class="title">Thông báo</h3>
            <hr />

            <div
                v-for="item in pagedNotifications"
                :key="item.id"
                class="notification"
                :class="{
                    unread: item.trangThai === 'chua_doc',
                    read: item.trangThai === 'da_doc',
                }"
                :data-id="item.maThongBao"
            >
                <div class="header">
                    <strong class="title">
                        {{ item.tieuDe }}
                    </strong>
                    <span class="timestamp">{{
                        formatTimestamp(item.thoiGianTao)
                    }}</span>
                </div>
                <p class="message">{{ item.noiDung }}</p>
                <a href="#" class="action">{{ item.loaiThongBao }}</a>
            </div>

            <div class="pagination">
                <button
                    @click="goPage(currentPage - 1)"
                    :disabled="currentPage === 1"
                >
                    &lt;
                </button>
                <button
                    v-for="page in totalPages"
                    :key="page"
                    @click="goPage(page)"
                    :class="{ active: currentPage === page }"
                >
                    {{ page }}
                </button>
                <button
                    @click="goPage(currentPage + 1)"
                    :disabled="currentPage === totalPages"
                >
                    &gt;
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page-container {
    padding: 0px;
    width: 100%;
    margin-bottom: 10px;
    padding-bottom: 0;
    display: flex;
    justify-content: space-between;
    color: var(--black-color);
}

.title {
    font-weight: 600;
    font-size: 2rem;
    margin-bottom: 6px;
}

hr {
    border: none;
    border-top: 1px solid var(--dark-gray-color);
    margin-bottom: 30px;
}

.left-nav {
    width: 300px;
    background-color: var(--yellow-color);
}

.left-nav ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

.left-nav ul li {
    padding: 15px 30px;
    color: var(--cream-color);
    cursor: pointer;
    text-transform: uppercase;
    border-bottom: 1px solid var(--brown-color);
    transition: background-color 0.3s;
    font-size: 1.6rem;
    font-weight: 600;
}

.left-nav ul li:hover,
.left-nav ul li.active {
    background-color: #7e5525;
}

.right-content {
    flex: 1;
    padding: 50px 200px;
}

h2 {
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 30px;
    font-size: 3rem;
    color: var(--brown-color);
}

/* Thông báo */
.notification {
    background-color: var(--white-color);
    border-radius: 8px;
    margin-bottom: 30px;
    padding: 20px 30px;
    box-shadow: 0 0 8px rgb(0 0 0 / 0.1);
    font-size: 1.4rem;
    line-height: 1.6;
    color: #444;
    white-space: pre-line;
}

.notification .header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 10px;
}

.notification .title {
    font-weight: 700;
    font-size: 1.8rem;
    color: var(--black-color);
}

.notification .title.success {
    color: #1e7e34;
}

.notification .title.error {
    color: #dc3545;
}

.notification .timestamp {
    font-size: 1.1rem;
    color: #999;
}

.notification .message {
    margin-bottom: 15px;
}

.notification .action {
    font-weight: 600;
    text-decoration: underline;
    color: #6f4e37;
    cursor: pointer;
}

/* Phân trang */
.pagination {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 20px;
}

.pagination button {
    background: none;
    border: 1px solid #6f4e37;
    color: #6f4e37;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.4rem;
    transition: background-color 0.3s;
}

.pagination button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.pagination button.active,
.pagination button:hover:not(:disabled) {
    background-color: #6f4e37;
    color: #fff;
}

.notification.unread {
    border-left: 2px solid var(--yellow-color);
}
.notification.read {
    opacity: 0.9;
}

@media (max-width: 1200px) {
    .right-content {
        padding: 40px 50px;
    }
}

@media (max-width: 992px) {
    .page-container {
        flex-direction: column;
    }

    .left-nav {
        width: 100%;
        display: flex;
        overflow-x: auto;
    }

    .left-nav ul {
        display: flex;
        width: 100%;
        padding: 0;
        margin: 0;
    }

    .left-nav ul li {
        flex: 1 0 auto;
        text-align: center;
        white-space: nowrap;
        padding: 12px 10px;
        font-size: 1.4rem;
    }

    .right-content {
        padding: 30px 20px;
    }
}

@media (max-width: 768px) {
    h2 {
        font-size: 2.4rem;
    }

    .notification {
        padding: 15px 20px;
        font-size: 1.3rem;
    }

    .notification .title {
        font-size: 1.5rem;
    }

    .notification .timestamp {
        font-size: 1rem;
    }

    .pagination button {
        padding: 6px 10px;
        font-size: 1.2rem;
    }
}

@media (max-width: 480px) {
    .notification {
        padding: 12px 15px;
        font-size: 1.1rem;
    }

    .notification .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .notification .timestamp {
        color: #777;
        font-size: 0.9rem;
    }

    .pagination {
        flex-wrap: wrap;
        gap: 6px;
    }

    .pagination button {
        padding: 5px 8px;
        font-size: 1rem;
    }
}
</style>
