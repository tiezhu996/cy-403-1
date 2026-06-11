<template>
  <main class="page">
    <van-nav-bar title="我的预约" fixed placeholder />
    <van-tabs v-model:active="active" sticky offset-top="46">
      <van-tab title="待体验">
        <BookingList :items="pendingItems" :highlight-id="highlightBookingId">
          <template #actions="{ booking }">
            <van-button size="small" plain type="danger" @click="bookingStore.cancelBooking(booking.id)">取消</van-button>
          </template>
        </BookingList>
      </van-tab>
      <van-tab title="已完成">
        <BookingList :items="completedItems" :highlight-id="highlightBookingId" />
      </van-tab>
      <van-tab title="已取消">
        <BookingList :items="cancelledItems" :highlight-id="highlightBookingId" />
      </van-tab>
    </van-tabs>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onMounted, ref, watch, type PropType } from 'vue';
import { useRoute } from 'vue-router';
import BookingCard from '@/components/common/BookingCard.vue';
import { useBookingStore } from '@/stores/booking';
import { BookingStatus } from '@/types/enums';
import type { Booking } from '@/types/entities';

const route = useRoute();
const bookingStore = useBookingStore();
const active = ref(0);
const highlightBookingId = ref<number | null>(null);

const pendingItems = computed(() =>
  bookingStore.list.filter((item) => [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(item.status)),
);
const completedItems = computed(() => bookingStore.list.filter((item) => item.status === BookingStatus.COMPLETED));
const cancelledItems = computed(() =>
  bookingStore.list.filter((item) => [BookingStatus.CANCELLED, BookingStatus.NO_SHOW].includes(item.status)),
);

function getTabIndexForBooking(booking: Booking): number {
  if ([BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) return 0;
  if (booking.status === BookingStatus.COMPLETED) return 1;
  return 2;
}

function locateBooking(bookingId: number) {
  const booking = bookingStore.list.find((b) => b.id === bookingId);
  if (booking) {
    active.value = getTabIndexForBooking(booking);
    highlightBookingId.value = bookingId;
    nextTick(() => {
      const el = document.getElementById(`booking-${bookingId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          highlightBookingId.value = null;
        }, 3000);
      }
    });
  }
}

const BookingList = defineComponent({
  props: {
    items: { type: Array as PropType<Booking[]>, required: true },
    highlightId: { type: Number as PropType<number | null>, default: null },
  },
  setup(props, { slots }) {
    return () =>
      h(
        'div',
        { class: 'list' },
        props.items.length
          ? props.items.map((booking) =>
              h(
                'div',
                {
                  key: booking.id,
                  id: `booking-${booking.id}`,
                  class: { 'booking-highlight': props.highlightId === booking.id },
                },
                [h(BookingCard, { booking }, { actions: () => slots.actions?.({ booking }) })],
              ),
            )
          : h('div', { class: 'empty' }, '暂无预约'),
      );
  },
});

onMounted(async () => {
  await bookingStore.fetchMyBookings();
  const bid = route.query.bookingId;
  if (bid) {
    locateBooking(Number(bid));
  }
});

watch(
  () => route.query.bookingId,
  (bid) => {
    if (bid && bookingStore.list.length > 0) {
      locateBooking(Number(bid));
    }
  },
);
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 72px;
  background: #f5f7f8;
}
:deep(.list) {
  display: grid;
  gap: 12px;
  padding: 12px;
}
:deep(.empty) {
  padding: 48px 0;
  color: #7a8490;
  text-align: center;
}
:deep(.booking-highlight) {
  animation: highlight-pulse 1s ease-in-out 3;
  border-radius: 8px;
}
@keyframes highlight-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(25, 137, 250, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(25, 137, 250, 0);
  }
}
</style>
