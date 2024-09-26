<script setup lang="ts">
import { ref, onUnmounted } from "vue";

const isConnected = ref(false);
const receivedData = ref<string[]>([]);
const inputCommand = ref("");
let port: any = null;
let reader: any = null;

async function connectSerial() {
  try {
    // 請求串行端口
    port = await (navigator as any).serial.requestPort();

    // 打開串行端口，設定為 8E1
    await port.open({
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: "even",
      flowControl: "none"
    });

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
        // 將接收到的 Uint8Array 轉換為十六進制字符串數組
        const hexValues = Array.from(value).map((byte) => {
          if (typeof byte === "number" && !isNaN(byte)) {
            return byte.toString(16).padStart(2, "0").toUpperCase();
          } else {
            console.warn("Received invalid byte:", byte);
            return "??"; // 或者其他表示無效數據的標記
          }
        });
        receivedData.value = [...receivedData.value, ...hexValues];

        // 限制存儲的數據量
        if (receivedData.value.length > 1000) {
          receivedData.value = receivedData.value.slice(-1000);
        }
      }
    } catch (error) {
      console.error("讀取錯誤:", error);
    } finally {
      reader.releaseLock();
    }
  }
}

// 輔助函數：將十六進制字符串轉換為 Uint8Array
function hexStringToUint8Array(hexString: string): Uint8Array {
  // 移除所有空格，並確保字符串長度為偶數
  hexString = hexString.replace(/\s/g, "");
  if (hexString.length % 2 !== 0) {
    throw new Error("十六進制字符串長度必須為偶數");
  }

  const arrayBuffer = new Uint8Array(hexString.length / 2);

  for (let i = 0; i < hexString.length; i += 2) {
    const byteValue = parseInt(hexString.substr(i, 2), 16);
    if (isNaN(byteValue)) {
      throw new Error("無效的十六進制字符串");
    }
    arrayBuffer[i / 2] = byteValue;
  }

  return arrayBuffer;
}

async function sendMessage() {
  if (!isConnected.value || !port) {
    console.error("串行端口未連接");
    return;
  }

  try {
    const writer = port.writable.getWriter();
    const data = hexStringToUint8Array(inputCommand.value);
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
    <q-input label="輸入指令" v-model="inputCommand" />
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
