<template>
  <div>
    <div id="printSection">
      <h1>這是一個要打印的 HTML 區塊</h1>
      <p>內容可以打印出來。</p>
    </div>

    <button @click="handlePrintHtml">打印 HTML</button>
    <button @click="handlePrintPdf">打印 PDF</button>
    <button @click="handlePrintJson">打印 JSON</button>

    <p v-if="isPrinting">正在打印中...</p>
  </div>
</template>

<script setup lang="ts">
import { usePrint } from "@/composables/printer"; // 引入剛剛建立的 usePrint composable

const { printHtml, printPdf, printJson, isPrinting } = usePrint(); // 使用 composable 中的函式

// 打印 HTML 元素
const handlePrintHtml = () => {
  printHtml("printSection"); // 傳入 HTML 區塊的 ID
};

// 打印 PDF 文件
const handlePrintPdf = () => {
  printPdf("https://example.com/sample.pdf"); // 傳入 PDF 文件的 URL
};

// 打印 JSON 數據
const handlePrintJson = () => {
  const jsonData = [
    { name: "John", age: 30 },
    { name: "Jane", age: 25 }
  ];
  const properties = ["name", "age"]; // 指定要顯示的屬性
  printJson(jsonData, properties); // 傳入 JSON 數據和屬性
};
</script>
