<script setup>
import { useTGP58Printer } from "@/composables/TGP58";

const { connectSerial, printText, cutPaper, printReport, clearReceivedData } =
  useTGP58Printer();
</script>

<template>
  <div>
    <button @click="connectSerial">連接印表機</button>
    <button @click="printText('Hello, TGP58!')">打印文本</button>
    <button @click="cutPaper">切紙</button>
    <button @click="printReport">打印報表</button>
    <button @click="clearReceivedData">清除接收數據</button>
  </div>
</template>
