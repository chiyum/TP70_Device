<template>
  <div>
    <h1>XC100 出鈔機控制台</h1>
    <div>
      <button @click="connectSerial" :disabled="state.isConnected">
        連接出鈔機
      </button>
      <span :class="['badge', badgeState]">{{ state.state }}</span>
    </div>
    <div v-if="state.isConnected">
      <h2>出鈔操作</h2>
      <input v-model="dispenseAmount" type="number" min="1" max="100" />
      <button @click="handleDispense" :disabled="state.state === '出鈔中'">
        出鈔
      </button>
      <p>本次出鈔數量: {{ state.dispensedAmount }}</p>
      <p>總出鈔數量: {{ state.totalDispensed }}</p>
      <button @click="getStatus">獲取狀態</button>
      <button @click="getCount">獲取總數</button>
      <button @click="clearCount">清除計數</button>
      <button @click="onClearData">清除數據</button>
    </div>
    <div>
      <h2>接收數據</h2>
      <ul>
        <li
          v-for="(data, index) in state.receivedData.slice(0, 10)"
          :key="index"
        >
          {{ data }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useXC100Dispenser } from "@/composables/XC100";

const {
  state,
  badgeState,
  connectSerial,
  dispense,
  getStatus,
  clearCount,
  getCount,
  onClearData
} = useXC100Dispenser();

const dispenseAmount = ref(1);

const handleDispense = () => {
  dispense(dispenseAmount.value);
};
</script>

<style scoped>
.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}
.green {
  background-color: #4caf50;
  color: white;
}
.red {
  background-color: #f44336;
  color: white;
}
.warning {
  background-color: #ffc107;
  color: black;
}
</style>
