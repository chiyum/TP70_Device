<script setup>
import { useTGP58Printer } from "@/composables/TGP58";

const input = ref("請輸入文字檔");

const {
  connectSerial,
  printReceipt,
  printText,
  cutPaper,
  printReport,
  clearReceivedData,
  getFirmwareVersion,
  printWithPadding,
  getPrinterStatus,
  advancePaper,
  printSimpleGraphic
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

const handleInputPaddingPrint = async () => {
  await printWithPadding(input.value);
  console.log("打印完成");
};

const handelPrintReceipt = async () => {
  await printReceipt();
  console.log("打印收據完成");
};
</script>

<template>
  <div class="gtp58test">
    <q-btn @click="connectSerial">連接印表機</q-btn>
    <q-btn @click="cutPaper">切紙</q-btn>
    <q-btn @click="printReport">打印報表</q-btn>
    <q-btn @click="clearReceivedData">清除接收數據</q-btn>
    <q-btn @click="handleGetFirmwareVersion">獲取韌體版本</q-btn>
    <q-btn @click="handleGetPrinterStatus">獲取打印機狀態</q-btn>
    <q-btn @click="advancePaper(10)">出紙10行</q-btn>
    <q-btn @click="handleInputPrint">打印輸入的文本</q-btn>
    <q-btn @click="printSimpleGraphic">打印圖檔</q-btn>
    <q-btn @click="handelPrintReceipt">打印收據</q-btn>
    <q-btn @click="handleInputPaddingPrint">
      打印輸入的文本並在前後加空格
    </q-btn>
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
