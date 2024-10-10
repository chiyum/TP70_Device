// composables/usePrint.ts
import { ref } from "vue";
import printJS from "print-js";

export function usePrint() {
  const isPrinting = ref(false); // 用來追蹤是否正在打印

  /**
   * 打印 HTML 元素
   * @param elementId HTML 元素的 ID
   */
  const printHtml = (elementId: string) => {
    isPrinting.value = true;
    try {
      printJS(elementId, "html"); // 使用 print-js 打印 HTML 元素
    } catch (error) {
      console.error("打印 HTML 元素失敗:", error);
    } finally {
      isPrinting.value = false;
    }
  };

  /**
   * 打印 PDF 文件
   * @param pdfUrl PDF 文件的 URL
   */
  const printPdf = (pdfUrl: string) => {
    isPrinting.value = true;
    try {
      printJS({
        printable: pdfUrl,
        type: "pdf"
      });
    } catch (error) {
      console.error("打印 PDF 失敗:", error);
    } finally {
      isPrinting.value = false;
    }
  };

  /**
   * 打印 JSON 數據
   * @param jsonData 要打印的 JSON 數據
   * @param properties 要顯示的 JSON 字段
   */
  const printJson = (jsonData: any[], properties: string[]) => {
    isPrinting.value = true;
    try {
      printJS({
        printable: jsonData,
        type: "json",
        properties
      });
    } catch (error) {
      console.error("打印 JSON 數據失敗:", error);
    } finally {
      isPrinting.value = false;
    }
  };

  return {
    printHtml,
    printPdf,
    printJson,
    isPrinting // 追踪打印狀態
  };
}
