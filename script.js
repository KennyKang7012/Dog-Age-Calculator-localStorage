// === 狗狗歲數計算機主程式 ===

// localStorage 的 key，清楚說明用途：用來記錄上一次輸入與計算結果
const STORAGE_KEY = "dogAgeCalculator:lastResult";

// 等待整個網頁載入完成後再執行
document.addEventListener("DOMContentLoaded", () => {
  const dogForm = document.getElementById("dog-form");
  const dogNameInput = document.getElementById("dogName");
  const dogBirthdayInput = document.getElementById("dogBirthday");

  const resultSection = document.getElementById("resultSection");
  const dogAgeText = document.getElementById("dogAgeText");
  const humanAgeText = document.getElementById("humanAgeText");

  // 設定生日輸入欄位的最大值為「今天」，避免選到未來日期
  setTodayAsMaxDate(dogBirthdayInput);

  // 載入 localStorage 中的上一次結果
  loadLastResult();

  // 監聽表單送出事件
  dogForm.addEventListener("submit", (event) => {
    event.preventDefault(); // 阻止表單預設重新整理頁面

    const name = dogNameInput.value.trim();
    const birthdayStr = dogBirthdayInput.value; // yyyy-mm-dd 字串

    if (!name) {
      alert("請先輸入狗狗名字喔！");
      return;
    }

    if (!birthdayStr) {
      alert("請選擇狗狗的生日日期！");
      return;
    }

    const birthdayDate = new Date(birthdayStr);
    const today = getTodayWithoutTime();

    // 若生日在未來，視為無效
    if (birthdayDate > today) {
      alert("狗狗的生日不能在未來喔！");
      return;
    }

    // 計算狗狗實際年齡（年＋月＋總年數）
    const ageInfo = calcDogAge(birthdayDate, today);

    // 依照狗狗實際年齡（以年為單位）換算成人類年齡
    const humanAge = convertDogAgeToHuman(ageInfo.totalYears);

    // 把結果組合成要顯示的文字
    const dogAgeDisplayText = buildDogAgeDisplayText(name, ageInfo);
    const humanAgeDisplayText = buildHumanAgeDisplayText(name, humanAge);

    // 顯示在畫面上
    dogAgeText.textContent = dogAgeDisplayText;
    humanAgeText.textContent = humanAgeDisplayText;
    resultSection.classList.remove("hidden");

    // 將這次的輸入與結果存入 localStorage
    saveLastResult({
      name,
      birthdayStr,
      dogAgeDisplayText,
      humanAgeDisplayText,
    });
  });

  // ========= 內部小函式們 =========

  /**
   * 將「今天」設定成 date input 的最大可選日期
   */
  function setTodayAsMaxDate(inputEl) {
    const today = getTodayWithoutTime();
    // 將日期格式化成 yyyy-mm-dd 給 input 使用
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    inputEl.max = `${yyyy}-${mm}-${dd}`;
  }

  /**
   * 取得「今天日期」但時間部分歸零，方便比較
   */
  function getTodayWithoutTime() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  /**
   * 計算狗狗實際年齡：
   * - 傳回 { years: 幾歲, months: 幾個月(0-11), totalYears: 以年為單位的浮點數 }
   */
  function calcDogAge(birthday, today) {
    // 以「天數」來計算差距，再換算成年
    const diffMs = today - birthday; // 毫秒差
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // 簡化處理：一年約 365.25 天
    const totalYears = diffDays / 365.25;
    const years = Math.floor(totalYears);
    const months = Math.floor((totalYears - years) * 12);

    return {
      years,
      months,
      totalYears,
    };
  }

  /**
   * 狗狗歲數換算人類歲數（常見的經驗公式）：
   * - 第 1 年：約 15 人類歲
   * - 第 2 年：再加 9 人類歲（合計 24）
   * - 之後每增加 1 狗年：再加約 4 人類歲
   *
   * 這裡使用「狗狗實際年齡（浮點數）」進行插值換算：
   * 例：0.5 歲 ≈ 0.5 * 15
   */
  function convertDogAgeToHuman(dogYears) {
    if (dogYears <= 0) return 0;

    let humanYears;

    if (dogYears <= 1) {
      humanYears = dogYears * 15;
    } else if (dogYears <= 2) {
      // 第 1 年先給 15 歲，第二年這段部分按比例乘以 9
      humanYears = 15 + (dogYears - 1) * 9;
    } else {
      // 前 2 年是 24 歲，之後每年加 4 歲
      humanYears = 24 + (dogYears - 2) * 4;
    }

    return humanYears;
  }

  /**
   * 組合狗狗實際年齡的文字描述
   */
  function buildDogAgeDisplayText(name, ageInfo) {
    const { years, months } = ageInfo;

    let ageText = "";
    if (years <= 0 && months <= 0) {
      ageText = "還是剛出生的小寶寶呢 🍼";
    } else if (years <= 0) {
      ageText = `${months} 個月大`;
    } else {
      // 有年數，視情況加上月數
      if (months > 0) {
        ageText = `${years} 歲 ${months} 個月`;
      } else {
        ageText = `${years} 歲`;
      }
    }

    return `${name} 現在大約是：${ageText}`;
  }

  /**
   * 組合人類年齡的文字描述（四捨五入到整數）
   */
  function buildHumanAgeDisplayText(name, humanYears) {
    const rounded = Math.round(humanYears);
    return `換算成人類的年齡，${name} 大約是：${rounded} 歲左右。`;
  }

  /**
   * 將結果存入 localStorage
   */
  function saveLastResult(data) {
    // 多存一個時間戳也可以，之後要做紀錄列表也方便擴充
    const payload = {
      ...data,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  /**
   * 從 localStorage 載入上一次記錄
   */
  function loadLastResult() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const data = JSON.parse(stored);
      const { name, birthdayStr, dogAgeDisplayText, humanAgeDisplayText } =
        data;

      if (name) dogNameInput.value = name;
      if (birthdayStr) dogBirthdayInput.value = birthdayStr;

      if (dogAgeDisplayText && humanAgeDisplayText) {
        dogAgeText.textContent = dogAgeDisplayText;
        humanAgeText.textContent = humanAgeDisplayText;
        resultSection.classList.remove("hidden");
      }
    } catch (error) {
      console.error("解析 localStorage 失敗，將清除舊資料：", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }
});
