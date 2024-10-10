import {
  convertToHexArray,
  hexStringToUint8Array
} from "@/utils/hexStringToUint8Array";

// 串行端口配置
const PORT_OPTIONS = {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  flowControl: "none"
};

// ESC/POS 指令常量
const ESC_POS_COMMANDS = {
  init: "1B40", // 初始化打印機
  printText: "1B21", // 打印文字
  lineFeed: "0A", // 換行
  cutPaper: "1D5600" // 切紙命令
};

export const useEpsonPrinter = () => {
  interface State {
    isConnected: boolean; // 是否已連接
    receivedData: string[]; // 接收到的數據
    state: string; // 狀態
    port: any; // 串行端口
    reader: any; // 串行讀取器
  }

  const state: State = reactive({
    isConnected: false,
    receivedData: [] as string[],
    state: "off",
    port: null as any,
    reader: null as any
  });

  // 計算當前狀態的徽章顏色
  const badgeState = computed(() => {
    return state.isConnected ? "green" : "red";
  });

  // 發送 ESC/POS 指令
  const sendMessage = async (hex: string): Promise<void> => {
    if (!state.isConnected || !state.port) {
      console.error("串行端口未連接");
      return;
    }

    try {
      const writer = state.port.writable.getWriter();
      const data = hexStringToUint8Array(hex);
      await writer.write(data);
      writer.releaseLock();
      console.log("訊息發送成功");
    } catch (error) {
      console.error("發送訊息失敗:", error);
    }
  };

  // 發送文字到打印機
  const printText = async (text: string): Promise<void> => {
    const encodedText = new TextEncoder().encode(text);
    const hexText = Array.from(encodedText)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    // 發送初始化和打印指令
    await sendMessage(ESC_POS_COMMANDS.init); // 初始化打印機
    await sendMessage(ESC_POS_COMMANDS.printText + hexText); // 發送文字
    await sendMessage(ESC_POS_COMMANDS.lineFeed); // 換行
    await sendMessage(ESC_POS_COMMANDS.cutPaper); // 切紙
  };

  // 開始讀取
  const startReading = async (): Promise<void> => {
    while (state.port.readable) {
      state.reader = state.port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await state.reader.read();
          if (done) break;

          // 將接收到的 Uint8Array 轉換為十六進制字符串數組
          const hexValues = convertToHexArray(value);
          console.log(hexValues, "hexValues");
          state.receivedData = [...hexValues, ...state.receivedData];
        }
      } catch (error) {
        state.isConnected = false;
        console.error("讀取錯誤:", error);
      } finally {
        state.reader.releaseLock();
      }
    }
  };

  // 連接串行端口
  const connectSerial = async (): Promise<void> => {
    try {
      state.port = await (navigator as any).serial.requestPort();
      await state.port.open(PORT_OPTIONS);
      console.log("串行端口連接成功");
      state.isConnected = true;
      state.state = "啟動";
      startReading();
    } catch (error) {
      console.error("連接失敗:", error);
      state.isConnected = false;
    }
  };

  return {
    state,
    badgeState,
    connectSerial,
    printText
  };
};
