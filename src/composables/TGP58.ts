import {
  convertToHexArray,
  hexStringToUint8Array,
  textToHex
} from "@/utils/hexStringToUint8Array";

// TGP58 串行端口配置
const PORT_OPTIONS = {
  baudRate: 38400, // TGP58 使用 38400 波特率
  dataBits: 8,
  stopBits: 1,
  parity: "none", // TGP58 不使用奇偶校驗
  flowControl: "none"
};

// TGP58 命令集
const TGP58_COMMANDS = {
  readDateTime: "1BF0", // 讀取日期時間
  setDateTime: "1BF1", // 設置日期時間
  printReport: "1BF9", // 打印報表
  cutPaper: "1BF5", // 切紙
  printText: "1DF7", // 打印文字
  formatPrint: "33BB" // 排版列印功能的命令
  // 可以根據需要添加更多命令
};

export const useTGP58Printer = () => {
  interface State {
    isConnected: boolean;
    receivedData: string[];
    state: string;
    port: any;
    reader: any;
  }

  const state: State = reactive({
    isConnected: false,
    receivedData: [] as string[],
    state: "off",
    port: null as any,
    reader: null as any
  });

  const badgeState = computed(() => {
    return state.isConnected ? "green" : "red";
  });

  // 處理來自 TGP58 的響應
  const onMessage = (hexs: string[]): void => {
    const responseCode = hexs.join("");
    switch (responseCode) {
      case "7733": // 設置日期時間成功
        console.log("日期時間設置成功");
        break;
      case "06": // 一般成功響應
        console.log("命令執行成功");
        break;
      // 可以根據 TGP58 的其他響應添加更多 case
      default:
        console.log("未知響應:", responseCode);
    }
  };

  // 發送命令到 TGP58
  const sendMessage = async (
    command: string,
    data: string = ""
  ): Promise<void> => {
    if (!state.isConnected || !state.port) {
      console.error("串行端口未連接");
      return;
    }
    const hexCommand = TGP58_COMMANDS[command] + data;
    console.log("Sending hex command:", hexCommand); // 添加這行來檢查
    try {
      const writer = state.port.writable.getWriter();
      const commandData = hexStringToUint8Array(TGP58_COMMANDS[command] + data);
      await writer.write(commandData);
      writer.releaseLock();
      console.log("命令發送成功:", command);
    } catch (error) {
      console.error("發送命令失敗:", error);
    }
  };

  // 開始讀取 TGP58 的響應
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

  // 連接到 TGP58
  const connectSerial = async (): Promise<void> => {
    try {
      state.port = await (navigator as any).serial.requestPort();
      await state.port.open(PORT_OPTIONS);
      console.log("串行端口連接成功");
      state.isConnected = true;
      state.state = "啟動";
      startReading();
      // 連接成功後初始化 TGP58
      initTGP58();
    } catch (error) {
      console.error("連接失敗:", error);
      state.isConnected = false;
    }
  };

  // TGP58 特定功能
  const printText = (text: string) => {
    const hexText = textToHex(text);
    const fullCommand = TGP58_COMMANDS.printText + "00" + hexText + "0D";
    sendMessage("printText", fullCommand);
  };

  const cutPaper = () => {
    sendMessage("cutPaper");
  };

  const printReport = () => {
    sendMessage("printReport");
  };

  const setDateTime = (dateTime: Date) => {
    const formattedDateTime = dateTime
      .toISOString()
      .replace(/[-:T]/g, "")
      .slice(2, 14);

    // 將日期時間轉換為十六進制字串
    const hexDateTime = Array.from(formattedDateTime)
      .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");

    console.log("Formatted hex date time:", hexDateTime);
    sendMessage("setDateTime", hexDateTime + "00");
  };

  const initTGP58 = () => {
    if (state.isConnected) {
      // 設置當前日期時間
      const currentDateTime = new Date();
      setDateTime(currentDateTime);
    }
  };

  const clearReceivedData = () => {
    state.receivedData = [];
  };

  return {
    state,
    badgeState,
    connectSerial,
    printText,
    cutPaper,
    printReport,
    setDateTime,
    clearReceivedData
  };
};
