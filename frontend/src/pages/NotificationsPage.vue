<template>
  <main class="page">
    <van-nav-bar title="消息通知" fixed placeholder>
      <template #right>
        <span class="read-all" @click="handleMarkAllRead">全部已读</span>
      </template>
    </van-nav-bar>

    <div class="notification-list">
      <div v-if="!loading && notificationStore.list.length === 0" class="empty">
        <van-empty description="暂无消息" />
      </div>

      <div
        v-for="item in notificationStore.list"
        :key="item.id"
        class="notification-item"
        :class="{ unread: !item.isRead }"
        @click="handleItemClick(item)"
      >
        <div class="dot" v-if="!item.isRead"></div>
        <div class="content">
          <div class="title-row">
            <span class="title">{{ item.title }}</span>
            <span class="time">{{ formatTime(item.createdAt) }}</span>
          </div>
          <p class="desc">{{ item.content }}</p>
        </div>
        <van-icon name="arrow" class="arrow" />
      </div>

      <van-loading v-if="loading" class="loading" />
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { useNotificationStore } from '@/stores/notification';
import type { Notification } from '@/types/entities';

const router = useRouter();
const notificationStore = useNotificationStore();
const loading = ref(false);

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

async function handleItemClick(item: Notification) {
  if (!item.isRead) {
    await notificationStore.markAsRead(item.id, true);
  }
  if (item.bookingId) {
    router.push('/my-bookings');
  }
}

async function handleMarkAllRead() {
  if (notificationStore.unreadCount === 0) {
    showToast('没有未读消息');
    return;
  }
  await notificationStore.markAllAsRead();
  showToast('已全部标记为已读');
}

async function loadData() {
  loading.value = true;
  try {
    await notificationStore.fetchList();
    await notificationStore.fetchUnreadCount();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 72px;
  background: #f5f7f8;
}

.read-all {
  font-size: 14px;
  color: #1989fa;
  cursor: pointer;
}

.notification-list {
  padding: 12px;
}

.notification-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 10px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.notification-item.unread {
  background: #f0f9ff;
}

.dot {
  position: absolute;
  top: 14px;
  left: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ee0a24;
}

.content {
  flex: 1;
  min-width: 0;
  margin-left: 8px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.title {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}

.time {
  font-size: 12px;
  color: #969799;
  flex-shrink: 0;
  margin-left: 8px;
}

.desc {
  font-size: 13px;
  color: #646566;
  margin: 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.arrow {
  color: #dcdee0;
  font-size: 16px;
  flex-shrink: 0;
}

.empty {
  padding: 60px 0;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 20px;
}
</style>
