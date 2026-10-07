export type Dossier = {
  en: string;
  countries: string;
  people: string;
  kits: string;
  tactics: string;
  data: string;
  cause: string;
  impact: string;
  result: string;
  theater: string;
};

const BASE: Record<string, Dossier> = {
  索姆河: {
    theater: "西線",
    en: "The Battle of the Somme, 1 July to 18 November 1916, was a Franco-British offensive on the Western Front. Britain lost about 57,000 men on the first day, including about 19,000 dead. The front moved only a few miles.",
    countries: "英國、法國對德國。戰場在法國皮卡第，索姆河兩岸，北緯 50.02 度、東經 2.70 度附近。",
    people: "英方黑格，法方福煦，德方法金漢與後接的興登堡、魯登道夫。第一天的損失落在基欽納新軍的營級單位上。",
    kits: "英軍用李－恩菲爾德、維克斯機槍、馬克 I 菱形戰車到 9 月才成批投入。德軍用 MG08 水冷機槍與鐵絲網。沒有血條，打掉機槍組的彈藥或讓戰車引擎停，陣地才會安靜。",
    tactics: "原計畫用長時間砲擊摧毀鐵絲網與壕溝。砲擊沒有打掉深壕，步兵按時間表前進，機槍從側翼掃射。9 月 15 日戰車第一次參戰，數量少、故障多，不能單獨撕開防線。",
    data: "1916 年 7 月 1 日至 11 月 18 日。英軍首日傷亡約 57,000，其中約 19,000 死。全戰役英、法、德傷亡都以數十萬計，前線推進以公里計，不是以國境計。",
    cause: "為減輕凡尔登的法軍壓力，並執行既定的西線消耗。動員表與聯盟義務比任何一次白刃衝鋒更早決定這一週要打。",
    impact: "英國新軍的社會成本被打進國內政治。戰車證明可過壕，但沒有步兵與彈藥跟進，缺口幾天內會合上。",
    result: "協約國取得有限陣地，沒有突破。德軍防線仍在。消耗是結果，不是事先就能用一口號結算的勝負。",
  },
  康布雷: {
    theater: "西線",
    en: "The Battle of Cambrai, 20 November to 7 December 1917, was the first large tank attack. Britain committed over 400 tanks. The first day opened a gap. The German counterattack closed much of it.",
    countries: "英國對德國。戰場在法國北部康布雷，北緯 50.17 度、東經 3.23 度。",
    people: "英方朱利安·賓與戰車部隊的埃爾斯。德軍反擊由第二集團軍實施。",
    kits: "馬克 IV 戰車、6 磅砲或機槍、預測射擊的砲兵。德軍用野砲平射打戰車，步兵仍靠 MG08。",
    tactics: "不用長時間預警砲擊，改用標定射擊加上戰車在煙幕後前進。缺口打開後，騎兵與步兵沒有按計畫擴張，德軍 11 月 30 日反擊收回大部分失地。",
    data: "1917 年 11 月 20 日至 12 月 7 日。英軍投入戰車逾 400 輛。首日推進約 6 公里，隨後反擊把大部分突出部打回去。",
    cause: "西線需要一次不必先暴露砲擊的進攻，戰車數量第一次夠用來試驗。",
    impact: "證明戰車可以成批撕開鐵絲網，也證明沒有後續步兵、彈藥和預備隊，缺口會合上。",
    result: "戰術示範，不是戰略突破。雙方各有局部得失。",
  },
  俄國內戰: {
    theater: "東歐",
    en: "The Russian Civil War ran from 1917 to 1922, not to 2022. It was fought among the Bolshevik Red Army, White armies, nationalist forces, and foreign intervention troops across European Russia, Siberia, and the Far East.",
    countries: "蘇俄紅軍對白軍、烏克蘭與地方民族武裝，以及英、法、美、日等干涉軍。中心在莫斯科與彼得格勒，戰場延伸到西伯利亞鐵路與遠東。莫斯科約北緯 55.75 度、東經 37.62 度。",
    people: "列寧、托洛茨基組織紅軍。白軍有高爾察克、鄧尼金、弗蘭格爾，各自為戰，沒有統一指揮。",
    kits: "雙方主力步槍是莫辛－納甘 M1891。機槍、裝甲列車和徵來的步槍比任何新式戰車都更決定鐵路樞紐。外國干涉帶來少量戰車與砲，不能替代鐵路。",
    tactics: "誰占鐵路樞紐，誰就能把糧食和彈藥送到下一城。白軍從外線多路進攻，紅軍用內線調動。農村徵糧與兵源比單次城市突擊更決定能打多久。",
    data: "主要戰事 1918 至 1920 年，遠東殘部到 1922 年。死亡與饑荒人數以百萬計，精確數仍有爭議。這不是一場延到 2022 年的戰爭。",
    cause: "1917 年政權崩潰後，布爾什維克奪權，舊軍官、地方政府與外國政府不肯承認。",
    impact: "紅軍做成常備軍，蘇聯的邊界與一黨國家從這場內戰裡長出來。干涉沒有打出一個能執政的白軍政府。",
    result: "紅軍勝。白軍主力到 1920 年失敗，日本 1922 年離開海參崴。",
  },
  芬蘭內戰: {
    theater: "東歐",
    en: "The Finnish Civil War, January to May 1918, was fought between the White Guards and the Red Guards in the new Finnish state. Germany intervened for the Whites. The fighting was short and the reprisals were long.",
    countries: "芬蘭白軍對芬蘭紅衛隊。德國派波羅的海師參戰。戰場在芬蘭南部城市與鐵路，赫爾辛基約北緯 60.17 度、東經 24.94 度。",
    people: "白軍由曼納海姆指揮。紅衛隊依托社會民主黨左翼與工業城市。德國馮·德·戈爾茨率干涉部隊。",
    kits: "雙方用俄式莫辛步槍、機槍和少量砲。德國部隊帶來編制與砲兵，不是芬蘭自己的新戰車。",
    tactics: "白軍從東北部與德國登陸的南部夾擊。城市巷戰之後是肅清，不是長期壕溝。鐵路決定部隊能多快進坦佩雷與赫爾辛基。",
    data: "1918 年 1 月 27 日至 5 月 15 日。戰死約 1 萬，戰後處決與集中營死亡又約 1 萬，數字因統計口徑有出入。",
    cause: "俄國崩解後芬蘭獨立，議會與工人赤衛隊爭執政權，俄國駐軍留下的武器流入雙方。",
    impact: "白軍勝利寫進芬蘭建國敘事，左右對立留到冬季戰爭前。德國干涉是勝因之一，不是唯一原因。",
    result: "白軍勝。紅衛隊主力被打散，領導人或逃或被俘。",
  },
};

export function dossierFor(name: string, brief: string, year: number): Dossier {
  if (BASE[name]) return BASE[name];
  return {
    theater: year <= 1918 ? "西線" : year <= 1945 ? "東線" : "現代",
    en: `${name} is a recorded conflict around ${year}. This page keeps the dated equipment and the geography, and does not invent a casualty total when the feed line does not carry one.`,
    countries: `${name}的交戰國以當時的主權和參戰部隊為準，不用後來的國名倒填。地圖用戰役發生時的戰場，而不是今日旅遊中心。`,
    people: "指揮官只寫能對上編制的人。單車戰績和回憶錄不能代表整個師的妥善率。",
    kits: brief || "裝備只列當時已列裝的型號。年份晚於戰役的改型不放進來。",
    tactics: "戰術看補給、火力點和預備隊，不看血條。打掉彈藥、引擎或乘員，單位才退出；人數堆不上，缺口一樣會合上。",
    data: `${year} 年前後。沒有可靠數字的傷亡不寫成精確值。線上簡述只是入口，不是結算。`,
    cause: "開戰原因寫動員、條約、資源和指揮，不寫成一句口號。",
    impact: "影響寫到下一場戰役的兵力、邊界和工業，不寫平民情節。",
    result: "結果只寫軍事結局：誰占住戰場、誰退出、裝備有沒有跟上。",
  };
}
