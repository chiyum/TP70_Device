<script setup lang="ts">
import { useTGP58Printer } from "@/composables/TGP58";

const input = ref("just only number or english");

const {
  connectSerial,
  printText,
  cutPaper,
  printReport,
  clearReceivedData,
  getFirmwareVersion,
  getPrinterStatus,
  clearLog,
  wu88FormatCommend
} = useTGP58Printer();

const handleGetFirmwareVersion = async () => {
  await getFirmwareVersion();
  console.log("韌體版本請求已發送");
};

const handleGetPrinterStatus = async () => {
  await getPrinterStatus();
  console.log("打印機狀態請求已發送");
};

const handleInputPrint = async () => {
  await printText(input.value);
  console.log(input.value);
  console.log("打印完成");
};

const onUploadAmount = async (price: number) => {
  console.log(price, "price");
  await wu88FormatCommend(price);
};
</script>

<template>
  <div class="gtp58test">
    <q-btn @click="connectSerial">連接印表機</q-btn>
    <q-btn @click="clearLog">清除日誌</q-btn>
    <q-btn @click="clearReceivedData">清除接收數據</q-btn>
    <q-btn @click="cutPaper">切紙</q-btn>
    <q-btn @click="printReport">打印報表</q-btn>
    <q-btn @click="handleGetFirmwareVersion">獲取韌體版本</q-btn>
    <q-btn @click="handleGetPrinterStatus">獲取打印機狀態</q-btn>
    <q-btn @click="onUploadAmount(100)">打印100</q-btn>
    <q-btn @click="onUploadAmount(500)">打印500</q-btn>
    <q-btn @click="onUploadAmount(1000)">打印1000</q-btn>
    <q-btn @click="handleInputPrint">打印輸入的文本</q-btn>
    <q-input outlined v-model="input" type="text" />
  </div>
</template>
<style lang="scss">
.gtp58test {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0 1rem;
}
</style>
