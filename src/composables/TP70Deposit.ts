import {
  CashDepositMachine,
  BillValidator,
  ConsoleDisplay
} from "@/services/deposit";
import {
  convertToHexArray,
  hexStringToUint8Array
} from "@/utils/hexStringToUint8Array";

// 串行端口配置
const PORT_OPTIONS = {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: "even",
  flowControl: "none"
};

// 入鈔機支持的面額代碼
const AMOUNT_CODES = {
  "40": 100,
  "41": 200,
  "42": 500,
  "43": 1000
};

const SEND_ACTION_CODES = {
  confirm: "02", // 確認入鈔 or 啟動
  cancel: "0F", // 退鈔
  pending: "18", // 讓入鈔機等待指令
  close: "5E", // 關閉連接
  reOpen: "3E" // 重新開啟連接
};

export const useTP70Deposit = () => {
  interface State {
    isConnected: boolean; // 是否已連接
    receivedData: string[]; // 接收到的數據
    state: string; // 狀態
    port: any; // 串行端口
    reader: any; // 串行讀取器
    currentPendingAmount: number; // 當前等待確認的金額
    totalAmount: number; // 存入總金額
  }

  const state: State = reactive({
    isConnected: false,
    receivedData: [] as string[],
    state: "off",
    port: null as any,
    reader: null as any,
    currentPendingAmount: 0,
    totalAmount: 0
  });

  const badgeState = computed(() => {
    switch (true) {
      case state.isConnected && state.state === "已入鈔，等待確認儲值":
        return "warning";
      case state.isConnected:
        return "green";
      case !state.isConnected:
        return "red";
      default:
        return "warning";
    }
  });

  const depositMachine = ref();

  const onMessage = (hexs: string[]): void => {
    const action = hexs[0];
    switch (action) {
      // 80代表啟動入鈔機 等待啟用
      case "80": {
        depositMachine.value.startup({
          onStarting: () => {
            sendMessage("02");
            state.state = "等待入鈔中";
          }
        });
        break;
      }
      // 81代表通過入鈔通過驗證
      case "81": {
        const amount = AMOUNT_CODES[hexs[1]];
        const isValid = depositMachine.value.insertBill(amount);
        // 如果面額有效，則發送 18 進入等待狀態
        if (isValid) {
          sendMessage(SEND_ACTION_CODES.pending);
          state.currentPendingAmount = amount;
          state.state = "已入鈔，等待確認儲值";
        } else {
          // 如果面額無效，則發送 0F 退鈔
          sendMessage(SEND_ACTION_CODES.cancel);
        }
        break;
      }
      // 29 紙鈔驗證失敗
      case "29":
        depositMachine.value.cancelDeposit();
        state.currentPendingAmount = 0;
        state.state = "等待入鈔中";
        break;
      // 10代表確認入鈔
      case "10":
        depositMachine.value.confirmDeposit();
        state.currentPendingAmount = 0;
        state.state = "等待入鈔中";
        break;
      default:
        console.log("未知命令:", hexs);
    }
  };

  const sendMessage = async (hex): Promise<void> => {
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

  const startReading = async (): Promise<void> => {
    while (state.port.readable) {
      state.reader = state.port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await state.reader.read();
          if (done) {
            break;
          }
          // 將接收到的 Uint8Array 轉換為十六進制字符串數組
          const hexValues = convertToHexArray(value);
          onMessage(hexValues);
          console.log(hexValues, "hexValues");
          state.receivedData = [...hexValues, ...state.receivedData];

          // 限制存儲的數據量
          if (state.receivedData.length > 1000) {
            state.receivedData = state.receivedData.slice(-1000);
          }
        }
      } catch (error) {
        state.state = "OFF";
        console.error("讀取錯誤:", error);
      } finally {
        state.reader.releaseLock();
      }
    }
  };

  const connectSerial = async (): Promise<void> => {
    try {
      // 請求串行端口
      state.port = await (navigator as any).serial.requestPort();

      // 打開串行端口，設定為 8E1
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

  const onConfirmDeposit = () => {
    console.log("confirm");
    sendMessage(SEND_ACTION_CODES.confirm);
    depositMachine.value.confirmDeposit();
  };

  const onCancelDeposit = () => {
    sendMessage(SEND_ACTION_CODES.cancel);
    depositMachine.value.cancelDeposit();
  };

  const onClearData = () => {
    state.receivedData = [];
  };

  const init = async () => {
    depositMachine.value = new CashDepositMachine(
      new BillValidator(),
      {
        storeBill: (amount) => {
          state.totalAmount += amount;
        },
        returnBill: () => {}
      },
      new ConsoleDisplay()
    );
  };

  init();

  return {
    state,
    badgeState,
    connectSerial,
    onConfirmDeposit,
    onCancelDeposit,
    onClearData
  };
};
