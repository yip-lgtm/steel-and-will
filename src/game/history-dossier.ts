export type Dossier = {
  theater: string;
  en: string;
  countries: string;
  countriesEn: string;
  people: string;
  peopleEn: string;
  kits: string;
  kitsEn: string;
  tactics: string;
  tacticsEn: string;
  data: string;
  dataEn: string;
  cause: string;
  causeEn: string;
  impact: string;
  impactEn: string;
  result: string;
  resultEn: string;
};

type Fact = {
  theater: string;
  when: string;
  where: string;
  who: string;
  kit: string;
  how: string;
  end: string;
  en: string;
};

const FACTS: Record<string, Fact> = {
  馬恩河: { theater: "西線", when: "1914 年 9 月", where: "巴黎以東的馬恩河", who: "霞飛對毛奇", kit: "法國 75、德軍 77 野砲、鐵路時刻表", how: "德軍右翼走得太遠，法軍用計程車和鐵路把預備隊塞進缺口", end: "施利芬計畫停在河岸，西線轉入壕溝", en: "The September 1914 Battle of the Marne stopped the German wheel east of Paris." },
  日德蘭: { theater: "北海", when: "1916 年 5 月 31 日", where: "丹麥以西的北海", who: "傑利科、比蒂對舍爾、希珀", kit: "雄獅、德弗林格、戰巡與無畏艦", how: "戰巡先交火，主力艦隊用 T 字橫隊接上", end: "英國損失較大的船，德國艦隊仍回不了外海", en: "Jutland was the only full meeting of the two grand fleets." },
  索姆河: { theater: "西線", when: "1916 年 7 月 1 日至 11 月 18 日", where: "法國皮卡第，索姆河兩岸", who: "黑格、福煦對法金漢", kit: "李－恩菲爾德、維克斯、馬克 I、MG08", how: "長砲擊沒打掉深壕，步兵按表前進", end: "推進數公里，不是突破", en: "The Somme opened on 1 July 1916 and Britain lost about 57,000 men that day." },
  康布雷: { theater: "西線", when: "1917 年 11 月 20 日至 12 月 7 日", where: "康布雷", who: "賓對德軍第二集團軍", kit: "逾 400 輛馬克 IV", how: "不先打長砲，戰車加標定射擊撕開鐵絲網", end: "缺口打開，反擊又把它合上", en: "Cambrai was the first massed tank attack. The gap did not stay open." },
  盧溝橋: { theater: "中國", when: "1937 年 7 月 7 日", where: "北平西南盧溝橋", who: "宋哲元部對華北日軍", kit: "中正式、三八式、少量砲", how: "一次衝突被雙方升級成全面戰爭的引線", end: "局部衝突沒有局部收場", en: "The Marco Polo Bridge incident opened the full Sino-Japanese war." },
  波蘭戰役: { theater: "東歐", when: "1939 年 9 月", where: "波蘭平原", who: "德軍對波蘭軍，蘇聯 17 日從東面進入", kit: "一號、二號、Pz.35(t)、波蘭 7TP", how: "空軍與裝甲先打鐵路和司令部，步兵跟上", end: "波蘭國家在一個月內被從中間切開", en: "Poland in September 1939 was cut from west and east." },
  鐵砂航線: { theater: "北海", when: "1939 至 1945 年", where: "納爾維克到德國的北海航線", who: "英國海軍對德國運礦船", kit: "驅逐艦、潛艦、護航", how: "鐵砂不進德國的爐，戰車就停在圖紙上", end: "航線被打薄，沒有被一次戰役切斷", en: "Swedish ore moving to Germany was a campaign of ships, not one battle." },
  法蘭西之戰: { theater: "西線", when: "1940 年 5 月 10 日至 6 月 25 日", where: "阿登、色當、敦克爾克", who: "曼施坦因的計畫，古德里安的軍，法國的預備隊在錯的地方", kit: "三號、四號、B1、Char 與沒有電台的連", how: "裝甲從阿登出來，步兵和空軍跟上，法軍司令部按舊時間表反應", end: "法國停戰，英國從敦克爾克撤出遠征軍", en: "France fell in six weeks after the Ardennes breakout." },
  不列顛: { theater: "本土", when: "1940 年 7 月至 10 月", where: "英格蘭南部上空", who: "道丁的戰鬥機指揮對德國空軍", kit: "噴火、颶風、Bf 109、鏈鎖雷達", how: "雷達把有限的中隊派到對的格子", end: "德國沒有取得入侵所需的制空權", en: "The Battle of Britain was won by radar, sector control, and fighter numbers." },
  巴巴羅薩: { theater: "東線", when: "1941 年 6 月 22 日開始", where: "從波羅的海到黑海", who: "德軍三個集團軍群對蘇聯西方面軍", kit: "三號、四號對 T-26、BT、早期 T-34", how: "合圍打通信和補給，不急著進莫斯科的街", end: "1941 年沒有打下蘇聯，冬天把沒有冬裝的師留在外面", en: "Barbarossa destroyed Soviet armies and still failed to end the state." },
  中途島: { theater: "太平洋", when: "1942 年 6 月 4 日", where: "中途島西北", who: "尼米茲、斯普魯恩斯對南雲", kit: "企業號、約克鎮、赤城、加賀、零戰、無畏式", how: "情报把三艘日本航母在換彈時打進火里", end: "日本失去可替換的艦載機隊員，不是只失去船", en: "Midway turned on dive bombers hitting carriers while they rearmed." },
  庫爾斯克: { theater: "東線", when: "1943 年 7 月", where: "庫爾斯克突出部", who: "莫德爾、曼施坦因對朱可夫、羅科索夫斯基", kit: "虎式、豹式、斐迪南對 T-34 和反坦克陣地", how: "德軍進預先知道的地雷和反坦克火網", end: "突擊停住，蘇聯隨後在其他地段反攻", en: "Kursk was a prepared defense that broke the German summer offensive." },
  諾曼第: { theater: "西線", when: "1944 年 6 月 6 日", where: "奧馬哈、猶他、黃金、朱諾、劍灘", who: "艾森豪對隆美爾的灘頭工事", kit: "謝爾曼、登陸艇、艦砲、88 砲", how: "艦砲和空降先打，步兵在潮汐窗口上岸", end: "灘頭站住，突破要到 7 月底", en: "Normandy was a joint landing. The beach was the start, not the breakout." },
  "1948 公路": { theater: "戰後", when: "1948 年", where: "特拉維夫到耶路撒冷的公路", who: "以色列部隊對阿拉伯軍封鎖", kit: "剩餘謝爾曼、步槍、簡易裝甲車", how: "公路被切斷，補給改走便道", end: "耶路撒冷沒有被打下來，公路也沒有一直暢通", en: "The 1948 fight for the Jerusalem road was a supply battle." },
  朝鮮上空: { theater: "冷戰", when: "1950 至 1953 年", where: "鴨綠江以南的米格走廊", who: "聯合國軍飛行員對蘇聯與中國飛行員", kit: "F-86 對米格-15", how: "噴射機在高空纏鬥，地面戰爭仍靠步兵和砲", end: "制空沒有把停戰線推回三八線以北很遠", en: "The Korean air war was Sabres against MiG-15s over the northwest." },
  沙漠風暴: { theater: "現代", when: "1991 年 1 月至 2 月", where: "科威特和伊拉克南部", who: "施瓦茨科普夫的聯軍對伊拉克佔領軍", kit: "M1、F-16、戰斧、偵察機", how: "先打雷達和指揮，再從西面繞過固定防線", end: "科威特被恢復，伊拉克政權還在", en: "Desert Storm restored Kuwait and stopped short of Baghdad." },
  鏈路: { theater: "現代", when: "2010 年代以後", where: "數據鏈，不是一條河", who: "地面控制站對前出的無人機", kit: "MQ-9 一類偵察打擊機", how: "鏈路斷了，飛機還在，眼睛不在", end: "無人機沒有取消補給和識別", en: "A data link is a supply line. Cut it and the aircraft is blind." },
  第七次伊孫佐戰役: { theater: "伊孫佐", when: "1916 年 9 月 14 日至 17 日", where: "戈里齊亞以南的喀斯特，米倫到聖米凱萊山", who: "卡多爾納對博羅埃維奇", kit: "山砲、機槍、工兵，不是戰車", how: "第六次已拿下戈里齊亞，這一次打城南高地，朝的里雅斯特", end: "短促推進，的里雅斯特仍在奧匈手裡", en: "The seventh Isonzo battle was a short push on the Karst south of Gorizia." },
  俄國內戰: { theater: "東歐", when: "1917 至 1922 年，不是到 2022 年", where: "莫斯科、伏爾加、西伯利亞鐵路、遠東", who: "列寧、托洛茨基對高爾察克、鄧尼金、弗蘭格爾", kit: "莫辛步槍、裝甲列車、徵來的砲", how: "誰占鐵路樞紐，誰就能把糧和彈送到下一城", end: "紅軍勝，白軍沒有統一指揮", en: "The Russian Civil War ended by 1922. It did not last until 2022." },
  西班牙內戰: { theater: "西線", when: "1936 至 1939 年", where: "馬德里、埃布羅、北部海岸", who: "佛朗哥對共和國", kit: "He 51、I-16、T-26、康德爾軍團", how: "外來飛機和戰車在別人的內戰裡試新戰術", end: "國民軍勝，試驗沒有直接等於下一場大戰的腳本", en: "Spain was a civil war used as a testing ground, not a rehearsal with a fixed script." },
  太平洋戰爭: { theater: "太平洋", when: "1941 年 12 月至 1945 年 8 月", where: "珍珠港、中途島、所羅門、菲律賓、日本近海", who: "山本、南雲對尼米茲、麥克阿瑟", kit: "零戰、企業號、赤城、後期的地獄貓", how: "航母決定艦隊會不會相遇，潛艦決定油輪還回不回得去", end: "日本艦隊和商船隊都被打掉", en: "The Pacific war was decided by carriers and by submarines on the tankers." },
  韓戰: { theater: "冷戰", when: "1950 年 6 月至 1953 年 7 月", where: "三八線兩側", who: "聯合國軍、韓國對朝鮮與中國人民志願軍", kit: "M4A3E8、T-34-85、F-86、米格-15", how: "先是南下，再是仁川，再是清川江以後的拉鋸", end: "停在近似原來的線，沒有和約意義上的總解決", en: "Korea moved the line twice and ended near where it began." },
  波斯灣戰爭: { theater: "現代", when: "1990 年 8 月至 1991 年 2 月", where: "科威特、伊拉克南部", who: "以美國為首的聯軍對伊拉克", kit: "M1、F-117、戰斧", how: "空中戰役先打指揮，地面戰繞過薩達姆防線", end: "科威特恢復，巴格達政權留下", en: "The Gulf War ejected Iraq from Kuwait in six weeks of fighting." },
  第一次世界大戰: { theater: "西線", when: "1914 至 1918 年", where: "西線、東線、伊孫佐、加里波利、海上", who: "協約國對同盟國", kit: "從勒貝爾、毛瑟到戰車和潛艦", how: "動員表把百萬人送上鐵路，壕溝把他們按住", end: "同盟國先在內部和海上補給崩潰", en: "The First World War was several fronts held together by railways and blockade." },
  波蘇戰爭: { theater: "東歐", when: "1919 至 1921 年", where: "華沙以東", who: "畢蘇斯基對圖哈切夫斯基", kit: "一戰剩餘步槍、騎兵、裝甲列車", how: "1920 年 8 月華沙城下，波軍從側翼打進去", end: "里加條約把邊界往東推", en: "The Polish-Soviet war turned at Warsaw in August 1920." },
  抗日戰爭: { theater: "中國", when: "1937 至 1945 年", where: "淞滬、武漢、華北、西南", who: "國民政府軍對日本中國派遣軍", kit: "中正式、三八式、九七式、後期的飛虎隊飛機", how: "空間換時間，工業搬進去，外援從滇緬路和空運來", end: "日本投降才結束，不是某一次會戰單獨結束", en: "The Chinese war of resistance was eight years of space, industry, and supply." },
  蘇德戰爭: { theater: "東線", when: "1941 至 1945 年", where: "從邊界到柏林", who: "德國陸軍對蘇聯紅軍", kit: "四號、虎式、T-34、喀秋莎", how: "合圍、後撤、搬廠、再反攻", end: "紅軍進柏林", en: "The German-Soviet war was the largest land campaign of the century." },
  第二次中東戰爭: { theater: "戰後", when: "1956 年 10 月至 11 月", where: "西奈、運河", who: "以色列、英國、法國對埃及", kit: "噴火、隕石、空軍傘兵", how: "以色列先在西奈打，英法再介入運河", end: "軍事上打到了，政治上被迫退出", en: "Suez was a military advance undone by politics." },
  科索沃戰爭: { theater: "現代", when: "1999 年 3 月至 6 月", where: "科索沃與塞爾維亞上空", who: "北約對南斯拉夫", kit: "F-16、F-117、巡航導彈", how: "空中打擊，沒有地面佔領戰", end: "南軍撤出科索沃", en: "Kosovo was an air campaign without a NATO ground invasion." },
  護國戰爭: { theater: "中國", when: "1915 至 1916 年", where: "雲南出發，向四川和兩廣", who: "蔡鍔、唐繼堯對袁世凱", kit: "清末新軍留下的步槍和山砲", how: "各省宣布獨立，比前線推進更快", end: "袁世凱取消帝制", en: "The National Protection War stopped Yuan Shikai's monarchy." },
  愛爾蘭獨立戰爭: { theater: "本土", when: "1919 至 1921 年", where: "愛爾蘭城鄉", who: "愛爾蘭共和軍對皇家愛爾蘭警隊和英軍", kit: "李－恩菲爾德、手槍、伏擊", how: "不打陣地，打巡邏和情報", end: "條約分成自由邦和北愛爾蘭，接著內戰", en: "The Irish war was ambush and intelligence, then a treaty and a split." },
  冬季戰爭: { theater: "東歐", when: "1939 年 11 月至 1940 年 3 月", where: "卡累利阿地峽", who: "曼納海姆對鐵木辛哥", kit: "芬蘭滑雪步兵、莫洛托夫鸡尾酒對蘇軍師", how: "窄路和森林把機械化縱隊切成段", end: "芬蘭割地，紅軍付出遠超預期的代價", en: "The Winter War cost the Red Army far more than the ground it took." },
  中印邊境戰爭: { theater: "中國", when: "1962 年 10 月至 11 月", where: "東段藏南、西段阿克賽欽", who: "中國邊防部隊對印度軍", kit: "56 式、山砲、沒有大空軍參戰", how: "高海拔補給比單兵射擊更決定能打幾天", end: "中國宣布停火並在東段後撤", en: "The 1962 border war was short and decided by altitude and supply." },
  第四次中東戰爭: { theater: "戰後", when: "1973 年 10 月", where: "蘇伊士運河、戈蘭高地", who: "埃及、敘利亞對以色列", kit: "薩格爾飛彈、M60、M48、幻象", how: "運河強渡打進以軍預備隊出動之前", end: "以軍反擊過河，政治停火先到", en: "The October 1973 war opened with a canal crossing and ended in a ceasefire." },
  阿富汗戰爭: { theater: "現代", when: "2001 至 2021 年", where: "阿富汗山谷和公路", who: "美國為首的聯軍對塔利班", kit: "特種部隊、空中支援、後勤車隊", how: "打下政權快，守住公路慢", end: "2021 年外軍撤出，塔利班回到喀布爾", en: "Afghanistan was taken quickly and not held by convoys alone." },
  復活節起義: { theater: "本土", when: "1916 年 4 月 24 日至 29 日", where: "都柏林邮政總局一帶", who: "愛爾蘭志工對英軍", kit: "步槍、機槍、市街工事", how: "占公共建築，英軍用砲把街打開", end: "六天結束，處決把政治後果留下", en: "The Easter Rising lasted six days in Dublin." },
  土耳其獨立戰爭: { theater: "東歐", when: "1919 至 1923 年", where: "安納托利亞", who: "凱末爾對希臘軍和占領軍", kit: "一戰剩餘步槍和砲", how: "1922 年總攻把希臘軍打回海岸", end: "洛桑條約承認土耳其共和國", en: "The Turkish war of independence ended with the republic recognized at Lausanne." },
  第二次世界大戰: { theater: "東線", when: "1939 至 1945 年", where: "歐洲、北非、太平洋、中國", who: "軸心國對同盟國", kit: "從毛瑟、零戰到 B-29 和原子彈投擲", how: "工業和海上補給決定能打幾年", end: "軸心國投降", en: "The Second World War was several wars joined by industry and sea lanes." },
  芬蘭內戰: { theater: "東歐", when: "1918 年 1 月至 5 月", where: "芬蘭南部城市和鐵路", who: "曼納海姆的白軍對紅衛隊，德國師介入", kit: "俄式步槍、機槍", how: "南北夾擊，城市打完就是肅清", end: "白軍勝，左右對立留到冬季戰爭前", en: "The Finnish Civil War was short. The reprisals lasted longer." },
  兩伊戰爭: { theater: "現代", when: "1980 至 1988 年", where: "阿拉伯河、巴士拉、胡齊斯坦", who: "薩達姆對霍梅尼", kit: "T-72、飛毛腿、化學武器使用被多方記錄", how: "初期進攻停住，之後是消耗和襲城", end: "停火時邊界大致回到戰前", en: "The Iran-Iraq war lasted eight years and ended near the old border." },
  伊拉克戰爭: { theater: "現代", when: "2003 年 3 月開始", where: "巴士拉到巴格達", who: "美英聯軍對薩達姆政權", kit: "M1、挑戰者、空中封鎖", how: "正規軍很快被打散，之後是佔領和叛亂", end: "政權倒了，戰爭沒有在巴格達陷落那天結束", en: "Iraq in 2003 defeated the army quickly and then faced an insurgency." },
};

export function dossierFor(name: string, brief: string, year: number): Dossier {
  const f = FACTS[name] ?? {
    theater: "西線",
    when: `${year} 年前後`,
    where: "戰役發生的戰場，不用今日旅遊中心代替",
    who: "當時的參戰部隊",
    kit: brief || "當時已列裝的制式裝備",
    how: "補給、火力點和預備隊決定缺口會不會合上",
    end: "軍事結局看誰留在戰場",
    en: `${name} around ${year}. No invented casualty total.`,
  };
  return {
    theater: f.theater,
    en: f.en,
    countries: `${name}不是一個抽象名詞。時間是${f.when}，地方在${f.where}。交戰國用當時的國名和參戰部隊，不把後來的國旗倒貼回去。地圖中心就是這塊地，不是一整塊塗色的大陸。`,
    countriesEn: `${name}: ${f.when}, ${f.where}. Countries are named as they were at the time.`,
    people: `人要對上編制。${f.who}。師長的回憶錄可以生動，不能代替全師的妥善率和彈藥還在不在。單車戰績留在腳註，不寫成神話。`,
    peopleEn: `Commanders and forces: ${f.who}. A memoir is not the division's readiness rate.`,
    kits: `軍武只寫當時拿得出來的。${f.kit}。引擎、砲管、彈鏈和鐵路比口號具體。年份晚於這一仗的改型不準進場。`,
    kitsEn: `Equipment then on hand: ${f.kit}. Later variants do not enter this battle.`,
    tactics: `打法是${f.how}。沒有血條。打掉彈藥、引擎或乘員，單位才退出。沒有跟上的步兵和補給，撕開的口會在幾天內合上。`,
    tacticsEn: `Method: ${f.how}. No hit points. A gap without infantry and supply closes.`,
    data: `${f.when}。沒有可靠統計的傷亡不寫成精確數字。線上那一句簡述只是入口，這裡才是由開始打到結束。`,
    dataEn: `${f.when}. Uncertain casualty totals stay uninvented.`,
    cause: `這一仗為什麼打，要看動員、條約、資源和指揮，不是一句口號。${f.who}走到${f.where}，是因為前面的政治和鐵路已經把他們送出去了。`,
    causeEn: `The cause sits in mobilization, treaties, resources, and command, not in a slogan.`,
    impact: `打完以後留下的是下一場還能不能打。${f.end}。工業、邊界和兵員編制比任何一次衝鋒的鏡頭都長。`,
    impactEn: `What remained: ${f.end}.`,
    result: `結果寫軍事結局。${f.end}。勝負是誰留在戰場、誰的補給先斷，不是誰的故事更好聽。`,
    resultEn: `Military result: ${f.end}.`,
  };
}
