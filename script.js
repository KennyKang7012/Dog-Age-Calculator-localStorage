// === 狗狗歲數計算機主程式 ===

// localStorage 的 key，清楚說明用途：用來記錄上一次輸入與計算結果（含體型）
const STORAGE_KEY = "dogAgeCalculator:lastResult";

document.addEventListener("DOMContentLoaded", () => {
  const dogForm = document.getElementById("dog-form");
  const dogNameInput = document.getElementById("dogName");
  const dogBirthdayInput = document.getElementById("dogBirthday");
  const sizeInputs = document.querySelectorAll('input[name="dogSize"]');

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
    const size = getSelectedSize();

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

    // 依照狗狗實際年齡（以年為單位）＋ 體型，換算成人類年齡
    const humanAge = convertDogAgeToHuman(ageInfo.totalYears, size);

    // 把結果組合成要顯示的文字
    const dogAgeDisplayText = buildDogAgeDisplayText(name, ageInfo);
    const humanAgeDisplayText = buildHumanAgeDisplayText(name, humanAge, size);

    // 顯示在畫面上
    dogAgeText.textContent = dogAgeDisplayText;
    humanAgeText.textContent = humanAgeDisplayText;
    resultSection.classList.remove("hidden");

    // 將這次的輸入與結果存入 localStorage
    saveLastResult({
      name,
      birthdayStr,
      size,
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
   * 取得目前選擇的狗狗體型（small / medium / large）
   * 若沒有選到就預設回傳 "medium"
   */
  function getSelectedSize() {
    for (const input of sizeInputs) {
      if (input.checked) {
        return input.value;
      }
    }
    return "medium";
  }

  /**
   * 狗狗歲數換算人類歲數（體型微調版）：
   * 共用基本觀念：
   *  - 第 1 年 ≈ 15 人類歲
   *  - 第 2 年再加 9 人類歲（共 24）
   *
   * 不同體型在「2 歲之後」的換算略有不同（簡化假設）：
   *  - 小型犬：每增加 1 狗年 ≈ +4 人類歲
   *  - 中型犬：每增加 1 狗年 ≈ +5 人類歲
   *  - 大型犬：每增加 1 狗年 ≈ +6 人類歲
   *
   * ※ 這只是常見說法的簡化版，實際年齡仍會因品種與健康狀況不同。
   */
  function convertDogAgeToHuman(dogYears, size) {
    if (dogYears <= 0) return 0;

    let humanYears;

    if (dogYears <= 1) {
      humanYears = dogYears * 15;
    } else if (dogYears <= 2) {
      humanYears = 15 + (dogYears - 1) * 9;
    } else {
      let ratePerYear;
      switch (size) {
        case "small":
          ratePerYear = 4;
          break;
        case "large":
          ratePerYear = 6;
          break;
        case "medium":
        default:
          ratePerYear = 5;
          break;
      }
      humanYears = 24 + (dogYears - 2) * ratePerYear;
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
      if (months > 0) {
        ageText = `${years} 歲 ${months} 個月`;
      } else {
        ageText = `${years} 歲`;
      }
    }

    return `${name} 現在大約是：${ageText}`;
  }

  /**
   * 組合人類年齡的文字描述（四捨五入到整數），並帶上體型說明
   */
  function buildHumanAgeDisplayText(name, humanYears, size) {
    const rounded = Math.round(humanYears);

    let sizeLabel;
    switch (size) {
      case "small":
        sizeLabel = "小型狗";
        break;
      case "large":
        sizeLabel = "大型狗";
        break;
      case "medium":
      default:
        sizeLabel = "中型狗";
        break;
    }

    return `以${sizeLabel}的換算方式，${name} 大約是：${rounded} 歲的人類年齡。`;
  }

  /**
   * 將結果存入 localStorage
   */
  function saveLastResult(data) {
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
      const {
        name,
        birthdayStr,
        size,
        dogAgeDisplayText,
        humanAgeDisplayText,
      } = data;

      if (name) dogNameInput.value = name;
      if (birthdayStr) dogBirthdayInput.value = birthdayStr;

      // 若有儲存體型，幫使用者選回去
      if (size) {
        const sizeInput = document.querySelector(
          `input[name="dogSize"][value="${size}"]`
        );
        if (sizeInput) sizeInput.checked = true;
      }

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
