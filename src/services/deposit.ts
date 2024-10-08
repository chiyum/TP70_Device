// 定義驗鈔器介面
export interface IBillValidator {
  validateBill(_bill: number): boolean;
}

// 定義鈔票存儲介面
export interface IBillStorage {
  storeBill(_bill: number): void;
  returnBill(_bill: number): void;
}

// 定義顯示介面
export interface IDisplay {
  showMessage(_message: string): void;
}

// 定義啟動配置介面
export interface StartupConfig {
  onStarting?: () => Promise<void>;
  onStarted?: () => void;
}

// 現金存款機類
export class CashDepositMachine {
  private billValidator: IBillValidator;
  private billStorage: IBillStorage;
  private display: IDisplay;
  private currentAmount: number = 0;
  private totalAmount: number = 0;
  private state: "idle" | "pending" = "idle";

  constructor(
    billValidator: IBillValidator,
    billStorage: IBillStorage,
    display: IDisplay
  ) {
    this.billValidator = billValidator;
    this.billStorage = billStorage;
    this.display = display;
  }

  // 啟動方法
  async startup(config?: StartupConfig): Promise<void> {
    this.display.showMessage("機器啟動中...");

    if (config?.onStarting) {
      // 如果提供了自定義啟動邏輯，執行它
      await config.onStarting();
    }

    this.display.showMessage("機器已就緒，請投入鈔票");

    if (config?.onStarted) {
      // 如果提供了啟動完成回調，執行它
      config.onStarted();
    }
  }

  // 插入鈔票方法
  insertBill(bill: number): boolean {
    this.state = "pending";
    this.display.showMessage("檢測到鈔票，正在處理...");

    if (this.billValidator.validateBill(bill)) {
      this.currentAmount += bill;
      this.display.showMessage(`當前金額: ${this.currentAmount}`);
      return true;
    } else {
      this.display.showMessage("無效的鈔票，請重試");
      this.billStorage.returnBill(bill);
      return false;
    }
  }

  // 確認存款方法
  confirmDeposit(): void {
    if (this.state === "pending") {
      this.billStorage.storeBill(this.currentAmount);
      this.totalAmount += this.currentAmount;
      this.display.showMessage(`成功存入 ${this.currentAmount} 元`);
      this.currentAmount = 0;
      this.state = "idle";
    }
  }

  // 取消存款方法
  cancelDeposit(): void {
    if (this.state === "pending") {
      this.billStorage.returnBill(this.currentAmount);
      this.display.showMessage(`退回 ${this.currentAmount} 元`);
      this.currentAmount = 0;
      this.state = "idle";
    }
  }

  // 獲取當前金額方法
  getCurrentAmount(): number {
    return this.currentAmount;
  }

  getTotalAmount(): number {
    return this.totalAmount;
  }
}

// 驗鈔器實現
export class BillValidator implements IBillValidator {
  validateBill(bill: number): boolean {
    // 假設我們只接受 100, 500, 1000 元的鈔票
    return [100, 200, 500, 1000, 2000].includes(bill);
  }
}

// 簡單鈔票存儲實現
export class BillStorage implements IBillStorage {
  storeBill(bill: number): void {
    console.log(`存入 ${bill} 元`);
  }

  returnBill(bill: number): void {
    console.log(`退回 ${bill} 元`);
  }
}

// 控制台顯示實現
export class ConsoleDisplay implements IDisplay {
  showMessage(message: string): void {
    console.log(message);
  }
}

export default CashDepositMachine;
