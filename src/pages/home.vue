<script setup lang="ts">
import { ref, onUnmounted } from "vue";

const isConnected = ref(false);
const receivedData = ref("");
let port: any = null;
let reader: any = null;

async function connectSerial() {
  try {
    // 請求串行端口
    port = await (navigator as any).serial.requestPort();

    // 打開串行端口
    await port.open({ baudRate: 9600 });

    console.log("串行端口連接成功");
    isConnected.value = true;
    startReading();
  } catch (error) {
    console.error("連接失敗:", error);
    isConnected.value = false;
  }
}

async function startReading() {
  while (port.readable) {
    reader = port.readable.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        // 將接收到的數據轉換為字符串並添加到 receivedData
        const decoded = new TextDecoder().decode(value);
        // console.log(value, "decoded");
        receivedData.value += decoded;
      }
    } catch (error) {
      console.error("讀取錯誤:", error);
    } finally {
      reader.releaseLock();
    }
  }
}

async function sendMessage() {
  if (!isConnected.value || !port) {
    console.error("串行端口未連接");
    return;
  }

  try {
    const writer = port.writable.getWriter();
    const encoder = new TextEncoder();
    const data = encoder.encode("Hello, Serial Port!");
    await writer.write(data);
    writer.releaseLock();
    console.log("訊息發送成功");
  } catch (error) {
    console.error("發送訊息失敗:", error);
  }
}

async function closeConnection() {
  if (isConnected.value && port) {
    if (reader) {
      await reader.cancel();
    }
    await port.close();
    isConnected.value = false;
    port = null;
    reader = null;
    console.log("連接已關閉");
  }
}

onUnmounted(() => {
  closeConnection();
});
</script>

<template>
  <div>
    <q-btn @click="connectSerial" label="連接串行端口" :disable="isConnected" />
    <q-btn
      @click="sendMessage"
      label="發送訊息"
      :disable="!isConnected"
      class="q-ml-sm"
    />
    <q-btn
      @click="closeConnection"
      label="關閉連接"
      :disable="!isConnected"
      class="q-ml-sm"
    />

    <div v-if="isConnected" class="q-mt-md">
      <h3>接收到的數據：</h3>
      <pre>{{ receivedData }}</pre>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home-card {
  margin: 20px;
  width: 400px;
  background: #eeeeee;
}

.box {
  border-radius: 28px;
  border: #ffffff 5px solid;
  box-shadow: #e2a307 0.5px 0.5px 0.5px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #f4f4f4;
  padding: 10px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}
</style>
