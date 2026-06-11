<template>
  <ErrorBoundary>
    <router-view />
    <van-tabbar v-model="active" route safe-area-inset-bottom>
      <van-tabbar-item to="/workshops" icon="shop-o">工坊</van-tabbar-item>
      <van-tabbar-item to="/my-bookings" icon="orders-o">预约</van-tabbar-item>
      <van-tabbar-item v-if="auth.isInstructor" to="/instructor/dashboard" icon="manager-o">工作台</van-tabbar-item>
      <van-tabbar-item v-if="auth.isAuthenticated" to="/notifications" icon="bell-o">
        消息
        <template #icon>
          <van-icon name="bell-o" />
          <van-badge v-if="notificationStore.unreadCount > 0" :content="notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount" class="badge" />
        </template>
      </van-tabbar-item>
      <van-tabbar-item to="/login" icon="contact-o">{{ auth.user ? auth.user.name : '登录' }}</van-tabbar-item>
    </van-tabbar>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import ErrorBoundary from '@/components/common/ErrorBoundary.vue';
import { useAuthStore } from '@/stores/user';
import { useNotificationStore } from '@/stores/notification';

const active = ref(0);
const auth = useAuthStore();
const notificationStore = useNotificationStore();

watch(
  () => auth.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      notificationStore.fetchUnreadCount();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.badge {
  position: absolute;
  top: -6px;
  right: -8px;
}
</style>

