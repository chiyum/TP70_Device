import {
  convertToHexArray,
  hexStringToUint8Array,
  textToHex
} from "@/utils/hexStringToUint8Array";

// TGP58 串行端口配置
const PORT_OPTIONS = {
  baudRate: 38400, // 波特率
  dataBits: 8, // 數據位
  stopBits: 1, // 停止位
  parity: "none", // 奇偶校驗
  flowControl: "none" // 流控制
};

// const TEXT_ALIGN = {
//   LEFT: 0,
//   CENTER: 1,
//   RIGHT: 2
// };
//
// const FONT_SIZE = {
//   NORMAL: 1, // 1x1
//   TALL: 2, // 1x2
//   LARGE: 3, // 2x2
//   EXTRA_TALL: 4, // 2x4
//   EXTRA_LARGE: 5, // 3x3
//   HUGE: 6 // 3x6
// };

// TGP58 命令集
const TGP58_COMMANDS = {
  // 基本命令
  readDateTime: "1BF0", // 讀取日期時間
  setDateTime: "1BF1", // 設置日期時間
  clearLog: "1BF2", // 清除日誌
  cutPaper: "1BF5", // 切紙
  printReport: "1BF9", // 打印報表
  printLog: "1BF9", // 打印日誌（與打印報表相同）
  getFirmwareVersion: "1BFB", // 獲取韌體版本
  getStatus: "1BFC", // 獲取打印機狀態

  // 格式化列印功能
  formatPrint: "33BB", // 排版打印

  // 文字內容上傳
  uploadText: "33BD", // 上傳文本內容

  // NO/NC 選擇
  setNONC: "33BC", // 設置 NO/NC

  // 圖形相關
  uploadLogo: "1DF4", // 上傳商標
  printGraphics: "1DF8", // 打印圖形
  printText: "1DF7", // 打印文本

  // 其他控制命令
  newLine: "0A", // 換行
  advancePaper: "1B64" // 出紙
};

export const useTGP58Printer = () => {
  // 定義打印機狀態接口
  interface State {
    isConnected: boolean; // 是否已連接
    receivedData: string[]; // 接收到的數據
    state: string; // 當前狀態
    port: any; // 串口對象
    reader: any; // 讀取器對象
  }

  // 初始化打印機狀態
  const state: State = reactive({
    isConnected: false,
    receivedData: [] as string[],
    state: "off",
    port: null as any,
    reader: null as any
  });

  // 計算連接狀態的徽章顏色
  const badgeState = computed(() => {
    return state.isConnected ? "green" : "red";
  });

  // 處理來自 TGP58 的響應
  const onMessage = (hexs: string[]): void => {
    const responseCode = hexs.join("");
    switch (responseCode) {
      case "06":
        console.log("命令執行成功");
        break;
      case "0A":
        console.log("命令執行失敗");
        break;
      case "42":
        console.log("48字節資料接收正確");
        break;
      case "AB":
        console.log("全部資料接收完成");
        break;
      case "00":
        console.log("打印機狀態: 正常");
        break;
      case "01":
        console.log("打印機狀態: 缺紙");
        break;
      case "02":
        console.log("打印機狀態: 裁刀故障");
        break;
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
    const hexCommand = data ? data : TGP58_COMMANDS[command];
    console.log("發送十六進制命令:", hexCommand);
    try {
      const writer = state.port.writable.getWriter();
      const commandData = hexStringToUint8Array(hexCommand);
      console.log("命令數據:", commandData);
      await writer.write(commandData);
      writer.releaseLock();
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
          console.log(hexValues, "接收到的十六進制值");
          state.receivedData = [...hexValues, ...state.receivedData];

          // 限制存儲的數據量
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
      initTGP58();
    } catch (error) {
      console.error("連接失敗:", error);
      state.isConnected = false;
    }
  };

  // 切紙
  const cutPaper = () => {
    return sendMessage("cutPaper", TGP58_COMMANDS.cutPaper);
  };

  // 打印報表
  const printReport = () => {
    return sendMessage("printReport", TGP58_COMMANDS.printReport);
  };

  // 設置日期時間
  const setDateTime = (dateTime: Date) => {
    const formattedDateTime = dateTime
      .toISOString()
      .replace(/[-:T]/g, "")
      .slice(2, 14);

    const hexDateTime = Array.from(formattedDateTime)
      .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");

    return sendMessage(
      "setDateTime",
      TGP58_COMMANDS.setDateTime + hexDateTime + "00"
    );
  };

  const printText = async (text): Promise<void> => {
    console.log(text, "printText");
    const hexText = textToHex(text); // 將文本轉換為十六進制格式
    const printCommand = TGP58_COMMANDS.printText + "03" + hexText + "0D"; // 組合成打印命令

    await sendMessage("printText", printCommand); // 發送命令到打印機
  };
  /**
   * 生成TGP58打印機格式化文本的命令
   * @desc 根據給定的文本、對齊方式和字體大小生成TGP58打印機可識別的格式化文本命令
   * @param {string} text 要打印的文本
   * @param {number} align 文本對齊方式 (0: 左對齊, 1: 居中對齊, 2: 右對齊)
   * @param {number} fontSize 字體大小 (1: 1x1, 2: 1x2, 3: 2x2, 4: 2x4, 5: 3x3, 6: 3x6)
   * @returns {string} 返回十六進制格式的打印命令字符串
   * @example
   * // 返回 "741048656C6C6F20576F726C64" (居中對齊, 1x1字體大小的 "Hello World")
   * formatTextCommand("Hello World", 1, 1)
   */
  // const formatTextCommand = (
  //   text: string,
  //   align: number,
  //   fontSize: number
  // ): string => {
  //   const hexText = textToHex(text);
  //   const fontSizeCode = (fontSize - 1).toString(16).padStart(2, "0");
  //   const formatByte = ((align << 4) | parseInt(fontSizeCode, 16))
  //     .toString(16)
  //     .padStart(2, "0");
  //   return `74${formatByte}${hexText}`;
  // };

  // 項目類型常量
  const ITEM_TYPE = {
    BLANK_LINE: "20",
    LOGO: "4C",
    QR_CODE: "51",
    SCORE: "50",
    DATE: "44",
    BARCODE: "42",
    TEXT_1: "74",
    TEXT_2: "75",
    TEXT_3: "76",
    TEXT_4: "77",
    TEXT_5: "78",
    TEXT_6: "79",
    TEXT_7: "7A",
    TEXT_8: "7B"
  };

  // 對齊方式常量
  const TEXT_ALIGN = {
    LEFT: "00",
    CENTER: "01",
    RIGHT: "02"
  };

  // 字體大小常量
  const FONT_SIZE = {
    SIZE_1: "B1",
    SIZE_2: "B2",
    SIZE_3: "B3",
    SIZE_4: "B4",
    SIZE_5: "B5",
    SIZE_6: "B6"
  };

  // 將文字轉換為固定長度的十六進制字串
  const textToFixedHex = (text: string, length: number = 48): string => {
    const hexText = textToHex(text);
    return hexText.padEnd(length * 2, "20"); // 用空格（20h）填充到指定長度
  };

  // 創建單個項目的命令
  const createItemCommand = (type: string, setting: string): string => {
    return `${type}${setting}`;
  };

  // 創建文字項目的命令
  const createTextItemCommand = (
    type: string,
    fontSize: string,
    text: string
  ): string => {
    return `${type}${fontSize}${textToFixedHex(text)}`;
  };

  // 創建空白行項目的命令
  const createBlankLineCommand = (lines: number): string => {
    const height = Math.min(Math.max(lines, 1), 10)
      .toString(16)
      .padStart(2, "0");
    return createItemCommand(ITEM_TYPE.BLANK_LINE, height);
  };

  // 創建完整的排版命令
  const createFormatCommand = (items: string[]): string => {
    const paddedItems = items.concat(Array(15 - items.length).fill("20B0")); // 填充到15個項目
    return `33BB${paddedItems.join("")}`;
  };

  // 創建文字內容上傳命令
  const createTextUploadCommand = (
    texts: { text: string; align: string }[]
  ): string => {
    const alignments = texts
      .map((t) => t.align)
      .concat(Array(8 - texts.length).fill("00"))
      .join("");
    const textContents = texts.map((t) => textToFixedHex(t.text)).join("");
    return `33BD${alignments}${textContents}`;
  };

  // 示例：創建一個簡單的收據排版
  const createReceiptFormat = () => {
    const items = [
      createTextItemCommand(ITEM_TYPE.TEXT_1, FONT_SIZE.SIZE_3, "RECEIPT"),
      createBlankLineCommand(1),
      createTextItemCommand(ITEM_TYPE.TEXT_2, FONT_SIZE.SIZE_1, "Item 1"),
      createTextItemCommand(ITEM_TYPE.TEXT_3, FONT_SIZE.SIZE_1, "$10.00"),
      createTextItemCommand(ITEM_TYPE.TEXT_4, FONT_SIZE.SIZE_1, "Item 2"),
      createTextItemCommand(ITEM_TYPE.TEXT_5, FONT_SIZE.SIZE_1, "$15.00"),
      createBlankLineCommand(1),
      createTextItemCommand(ITEM_TYPE.TEXT_6, FONT_SIZE.SIZE_2, "Total: $25.00")
    ];

    return createFormatCommand(items);
  };

  // 示例：上傳文字內容
  const uploadReceiptText = () => {
    const texts = [
      { text: "RECEIPT", align: TEXT_ALIGN.CENTER },
      { text: "Item 1", align: TEXT_ALIGN.LEFT },
      { text: "$10.00", align: TEXT_ALIGN.RIGHT },
      { text: "Item 2", align: TEXT_ALIGN.LEFT },
      { text: "$15.00", align: TEXT_ALIGN.RIGHT },
      { text: "Total: $25.00", align: TEXT_ALIGN.RIGHT }
    ];

    return createTextUploadCommand(texts);
  };

  // 打印收據
  const printReceipt = async () => {
    const formatCommand = createReceiptFormat();
    const textUploadCommand = uploadReceiptText();

    await sendMessage("formatPrint", formatCommand);
    await sendMessage("uploadText", textUploadCommand);
    // 這裡可能需要添加一個打印命令，具體取決於打印機的要求
  };

  // 打印文本並在前後插入兩個空白行
  const printWithPadding = async (text: string) => {
    // 將文字轉換為十六進制
    const hexText = textToHex(text);

    // 構建命令：
    // - 33BB 開頭（排版命令）
    // - 空兩行：20 表示空白行，02 表示兩行
    // - 文字：74 表示文字，00 表示置左
    // - 再空兩行：20 表示空白行，02 表示兩行
    const command = `${TGP58_COMMANDS.formatPrint}20027400${hexText}2002`;

    // 發送命令到打印機
    await sendMessage("formatPrint", command);
  };

  // 清除接收數據
  const clearReceivedData = () => {
    state.receivedData = [];
  };

  const clearLog = () => {
    return sendMessage("clearLog", TGP58_COMMANDS.clearLog);
  };

  // 獲取韌體版本
  const getFirmwareVersion = () => {
    return sendMessage("getFirmwareVersion", TGP58_COMMANDS.getFirmwareVersion);
  };

  // 獲取打印機狀態
  const getPrinterStatus = () => {
    return sendMessage("getStatus", TGP58_COMMANDS.getStatus);
  };

  // 初始化 TGP58
  const initTGP58 = async () => {
    if (state.isConnected) {
      const noncCommand = "33BC00"; // 設置為常開模式
      await sendMessage("setNONC", noncCommand);
      setDateTime(new Date());
    }
  };

  // 以下是不會回傳資料的函數 機器不會有反應

  // 出紙
  const advancePaper = async (lines: number = 3) => {
    const command =
      TGP58_COMMANDS.advancePaper + lines.toString(16).padStart(2, "0");
    await sendMessage("advancePaper", command);
  };

  // 發送圖形數據到列印機
  const printSimpleGraphic = async () => {
    // 圖形數據 (8x8 的點陣圖，每個字節表示一行像素)
    const graphicData = "FF818181818181FF"; // 8x8 方塊的十六進制表示

    // 構建圖形列印命令：1DF8 開頭 + 圖形數據
    const command = `${TGP58_COMMANDS.printGraphics}${graphicData}`;

    console.log("發送的圖形命令:", command);

    // 發送圖形列印命令
    await sendMessage("printGraphics", command);
  };

  // 返回可用的函數和狀態
  return {
    state,
    badgeState,
    advancePaper,
    connectSerial,
    printSimpleGraphic,
    printText,
    printWithPadding,
    cutPaper,
    clearLog,
    printReport,
    printReceipt,
    setDateTime,
    clearReceivedData,
    getFirmwareVersion,
    getPrinterStatus
  };
};
