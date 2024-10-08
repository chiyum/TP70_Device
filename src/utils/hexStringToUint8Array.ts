export const hexStringToUint8Array = (hexString: string): Uint8Array => {
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
};

// 定義一個函式來將 Uint8Array 轉換為十六進制字符串數組
export const convertToHexArray = (data: Uint8Array): string[] => {
  return Array.from(data).map((byte) => {
    if (typeof byte === "number" && !isNaN(byte)) {
      // 將數值轉換為十六進制字串，並且轉為大寫
      return byte.toString(16).padStart(2, "0").toUpperCase();
    } else {
      // 如果收到無效的字節數據，則返回 "??"
      console.warn("Received invalid byte:", byte);
      return "??"; // 返回一個表示無效數據的標記
    }
  });
};

export const textToHex = (text: string): string => {
  return Array.from(text)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
};

export default hexStringToUint8Array;
