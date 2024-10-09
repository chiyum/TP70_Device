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

// XC100 指令碼
const COMMAND_CODES = {
  dispense: "B", // 出鈔指令
  clearCount: "I", // 清除累計數和錯誤訊息
  getStatus: "S", // 查詢出鈔機狀態
  getCount: "C" // 查詢出鈔數目
};

export const useXC100Dispenser = () => {
  interface State {
    isConnected: boolean;
    receivedData: string[];
    state: string;
    port: any;
    reader: any;
    dispensedAmount: number;
    totalDispensed: number;
  }

  const state: State = reactive({
    isConnected: false,
    receivedData: [] as string[],
    state: "off",
    port: null as any,
    reader: null as any,
    dispensedAmount: 0,
    totalDispensed: 0
  });

  const badgeState = computed(() => {
    switch (true) {
      case state.isConnected && state.state === "出鈔中":
        return "warning";
      case state.isConnected:
        return "green";
      case !state.isConnected:
        return "red";
      default:
        return "warning";
    }
  });

  const onMessage = (hexs: string[]): void => {
    const action = hexs[3]; // XC100 的指令在第四個字節
    switch (action) {
      case "b": {
        // 出鈔回應
        const amount = parseInt(hexs.slice(5, 8).join(""), 10);
        state.dispensedAmount = amount;
        state.totalDispensed += amount;
        state.state = "出鈔完成";
        break;
      }
      case "s": {
        // 狀態回應
        const status = hexs[4];
        switch (status) {
          case "r":
            state.state = "待機中";
            break;
          case "w":
            state.state = "出鈔中";
            break;
          case "e":
            state.state = "錯誤: " + hexs[5];
            break;
          default:
            console.log("未知狀態:", hexs);
        }
        break;
      }
      case "c": {
        // 出鈔數目回應
        const count = parseInt(hexs.slice(5, 8).join(""), 10);
        state.totalDispensed = count;
        break;
      }
      default:
        console.log("未知命令:", hexs);
        break;
    }
  };

  const sendMessage = async (
    cmd: string,
    params: string = "0000"
  ): Promise<void> => {
    if (!state.isConnected || !state.port) {
      console.error("串行端口未連接");
      return;
    }

    try {
      const writer = state.port.writable.getWriter();
      const message = `0200${cmd}${params}`;
      const checksum = calculateChecksum(message);
      const fullMessage = `02${message}${checksum}03`;
      const messageData = hexStringToUint8Array(fullMessage);
      await writer.write(messageData);
      writer.releaseLock();
      console.log("訊息發送成功");
    } catch (error) {
      console.error("發送訊息失敗:", error);
    }
  };

  const calculateChecksum = (message: string): string => {
    const sum = message
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return sum.toString(16).slice(-2).padStart(2, "0").toUpperCase();
  };

  const startReading = async (): Promise<void> => {
    while (state.port.readable) {
      state.reader = state.port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await state.reader.read();
          if (done) {
            break;
          }
          const hexValues = convertToHexArray(value);
          onMessage(hexValues);
          console.log(hexValues, "hexValues");
          state.receivedData = [...hexValues, ...state.receivedData];

          if (state.receivedData.length > 1000) {
            state.receivedData = state.receivedData.slice(-1000);
          }
        }
      } catch (error) {
        state.state = "OFF";
        state.isConnected = false;
        console.error("讀取錯誤:", error);
      } finally {
        state.reader.releaseLock();
      }
    }
  };

  const connectSerial = async (): Promise<void> => {
    try {
      state.port = await (navigator as any).serial.requestPort();
      await state.port.open(PORT_OPTIONS);
      console.log("串行端口連接成功");
      state.isConnected = true;
      state.state = "待機中";
      startReading();
    } catch (error) {
      console.error("連接失敗:", error);
      state.isConnected = false;
    }
  };

  const dispense = (amount: number) => {
    const amountStr = amount.toString().padStart(4, "0");
    sendMessage(COMMAND_CODES.dispense, amountStr);
    state.state = "出鈔中";
  };

  const getStatus = () => {
    sendMessage(COMMAND_CODES.getStatus);
  };

  const clearCount = () => {
    sendMessage(COMMAND_CODES.clearCount, "0001");
    state.totalDispensed = 0;
  };

  const getCount = () => {
    sendMessage(COMMAND_CODES.getCount);
  };

  const onClearData = () => {
    state.receivedData = [];
  };

  return {
    state,
    badgeState,
    connectSerial,
    dispense,
    getStatus,
    clearCount,
    getCount,
    onClearData
  };
};
