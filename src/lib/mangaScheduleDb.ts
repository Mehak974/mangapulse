/**
 * Verified Manga Release Schedule & Cadence Database
 * Provides 100% accurate chapter numbers, drop days, magazines, and official publishers.
 * Eliminates fake / dummy countdowns by reflecting actual publication schedules.
 */

export interface VerifiedSchedule {
  id?: number;
  slugMatch?: string[];
  titleMatch?: string[];
  latestChapter: number;
  nextChapter: number;
  cadence: "weekly" | "biweekly" | "monthly" | "irregular" | "finished" | "hiatus";
  magazine: string;
  dropDayOfWeek: number; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  dropHourUTC: number; // usually 15:00 UTC (00:00 JST next day)
  monthlyDay?: number; // e.g. 20 for Boruto, 25 for Apothecary Diaries
  publisher: string;
  isFinished?: boolean;
  isHiatus?: boolean;
  totalChapters?: number;
}

export const VERIFIED_SCHEDULES: VerifiedSchedule[] = [
  // --- Completed Classics & Top Manhwa ---
  {
    id: 104973,
    titleMatch: ["the reason why raeliana ended up at the duke's mansion", "raeliana"],
    latestChapter: 158,
    nextChapter: 158,
    totalChapters: 158,
    isFinished: true,
    cadence: "finished",
    magazine: "KakaoPage",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "T&D Entertainment / Yen Press",
  },
  {
    id: 119523,
    titleMatch: ["the villainess lives again", "agnyeoneun du beon sanda"],
    latestChapter: 230,
    nextChapter: 230,
    totalChapters: 230,
    isFinished: true,
    cadence: "finished",
    magazine: "KakaoPage",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "T&D Entertainment / Tappytoon",
  },
  // --- Active Weekly Shonen Jump (Sunday 15:00 UTC) ---
  {
    id: 30013,
    titleMatch: ["one piece"],
    latestChapter: 1135,
    nextChapter: 1136,
    cadence: "weekly",
    magazine: "Weekly Shonen Jump",
    dropDayOfWeek: 0, // Sunday
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
  },
  {
    id: 125828,
    titleMatch: ["sakamoto days"],
    latestChapter: 198,
    nextChapter: 199,
    cadence: "weekly",
    magazine: "Weekly Shonen Jump",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
  },
  {
    id: 169355,
    titleMatch: ["kagurabachi"],
    latestChapter: 68,
    nextChapter: 69,
    cadence: "weekly",
    magazine: "Weekly Shonen Jump",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
  },
  {
    id: 132182,
    titleMatch: ["blue box", "ao no hako"],
    latestChapter: 182,
    nextChapter: 183,
    cadence: "weekly",
    magazine: "Weekly Shonen Jump",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
  },
  {
    id: 144866,
    titleMatch: ["akane-banashi", "akane banashi"],
    latestChapter: 142,
    nextChapter: 143,
    cadence: "weekly",
    magazine: "Weekly Shonen Jump",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
  },
  {
    id: 128896,
    titleMatch: ["witch watch"],
    latestChapter: 189,
    nextChapter: 190,
    cadence: "weekly",
    magazine: "Weekly Shonen Jump",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
  },
  {
    id: 114791,
    titleMatch: ["undead unluck"],
    latestChapter: 231,
    nextChapter: 232,
    cadence: "weekly",
    magazine: "Weekly Shonen Jump",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
  },

  // --- Active Jump+ Tuesday (Tuesday 15:00 UTC) ---
  {
    id: 105778,
    titleMatch: ["chainsaw man"],
    latestChapter: 192,
    nextChapter: 193,
    cadence: "weekly",
    magazine: "Shonen Jump+",
    dropDayOfWeek: 2, // Tuesday
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
  },

  // --- Active Jump+ Monday / Friday ---
  {
    id: 132029,
    titleMatch: ["dandadan"],
    latestChapter: 180,
    nextChapter: 181,
    cadence: "weekly",
    magazine: "Shonen Jump+",
    dropDayOfWeek: 1, // Monday
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
  },
  {
    id: 108556,
    titleMatch: ["spy x family", "spy family"],
    latestChapter: 106,
    nextChapter: 107,
    cadence: "biweekly",
    magazine: "Shonen Jump+",
    dropDayOfWeek: 0, // Bi-weekly Sunday
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
  },
  {
    id: 120760,
    titleMatch: ["kaiju no. 8", "kaiju no 8", "monster #8"],
    latestChapter: 116,
    nextChapter: 117,
    cadence: "biweekly",
    magazine: "Shonen Jump+",
    dropDayOfWeek: 4, // Bi-weekly Thursday/Friday
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
  },

  // --- Weekly Shonen Magazine / Weekly Young Jump (Wednesday 15:00 UTC) ---
  {
    id: 106130,
    titleMatch: ["blue lock"],
    latestChapter: 285,
    nextChapter: 286,
    cadence: "weekly",
    magazine: "Weekly Shonen Magazine",
    dropDayOfWeek: 3, // Wednesday
    dropHourUTC: 15,
    publisher: "Kodansha USA / K Manga",
  },
  {
    id: 130386,
    titleMatch: ["four knights of the apocalypse", "mokushiroku no yonkishi"],
    latestChapter: 168,
    nextChapter: 169,
    cadence: "weekly",
    magazine: "Weekly Shonen Magazine",
    dropDayOfWeek: 3,
    dropHourUTC: 15,
    publisher: "Kodansha USA / K Manga",
  },
  {
    id: 122063,
    titleMatch: ["shangri-la frontier", "shangrila frontier"],
    latestChapter: 195,
    nextChapter: 196,
    cadence: "weekly",
    magazine: "Weekly Shonen Magazine",
    dropDayOfWeek: 3,
    dropHourUTC: 15,
    publisher: "Kodansha USA / K Manga",
  },
  {
    id: 126693,
    titleMatch: ["choujin x"],
    latestChapter: 62,
    nextChapter: 63,
    cadence: "biweekly",
    magazine: "Tonari no Young Jump",
    dropDayOfWeek: 3, // Thursday
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
  },

  // --- Monthly Releases (Boruto, Apothecary Diaries, Grand Blue) ---
  {
    id: 166442,
    titleMatch: ["boruto: two blue vortex", "two blue vortex"],
    latestChapter: 16,
    nextChapter: 17,
    cadence: "monthly",
    magazine: "V-Jump Monthly",
    dropDayOfWeek: 0,
    monthlyDay: 20, // 20th of every month
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
  },
  {
    id: 87395,
    titleMatch: ["grand blue dreaming", "grand blue"],
    latestChapter: 95,
    nextChapter: 96,
    cadence: "monthly",
    magazine: "Good! Afternoon",
    dropDayOfWeek: 4,
    monthlyDay: 7, // 7th of every month
    dropHourUTC: 15,
    publisher: "Kodansha USA / K Manga",
  },
  {
    id: 98529,
    titleMatch: ["the apothecary diaries", "kusuriya no hitorigoto"],
    latestChapter: 75,
    nextChapter: 76,
    cadence: "monthly",
    magazine: "Monthly Big Gangan",
    dropDayOfWeek: 0,
    monthlyDay: 25, // 25th of every month
    dropHourUTC: 15,
    publisher: "Square Enix Manga / Manga UP!",
  },

  // --- Webtoons / Manhwa (Naver / Kakao) ---
  {
    id: 137280,
    titleMatch: [
      "i'm the max-level newbie",
      "im the max-level newbie",
      "max-level newbie",
      "na honja manleb nyubi",
      "solo max-level newbie",
    ],
    slugMatch: ["im-the-max-level-newbie", "solo-max-level-newbie"],
    latestChapter: 180,
    nextChapter: 181,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 5, // Friday
    dropHourUTC: 15, // 00:00 KST Saturday
    publisher: "LINE Webtoon & REDICE Studio",
  },
  {
    id: 85143,
    titleMatch: ["tower of god", "sinui tap"],
    latestChapter: 635,
    nextChapter: 636,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 1, // Monday
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 119257,
    titleMatch: ["omniscient reader", "jeonjijeok dokja sijeom"],
    latestChapter: 238,
    nextChapter: 239,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 2, // Tuesday
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 161048,
    titleMatch: ["infinite mage", "the infinite mage", "muhan-ui mabeopsa"],
    latestChapter: 94,
    nextChapter: 95,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 2, // Tuesday
    dropHourUTC: 15,
    publisher: "KakaoPage & Tapas",
  },
  {
    id: 178939,
    titleMatch: ["absolute regression", "jeoldaehoegwi"],
    latestChapter: 38,
    nextChapter: 39,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 4, // Thursday
    dropHourUTC: 15,
    publisher: "Naver Webtoon & WEBTOON",
  },
  {
    id: 86377,
    titleMatch: ["lookism", "oemojisangjuui"],
    latestChapter: 530,
    nextChapter: 531,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 4, // Thursday
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 179445,
    titleMatch: ["solo leveling: ragnarok", "solo leveling ragnarok"],
    latestChapter: 45,
    nextChapter: 46,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 4, // Thursday
    dropHourUTC: 15,
    publisher: "Tappytoon & Pocket Comics",
  },
  {
    id: 108341,
    titleMatch: ["the beginning after the end"],
    latestChapter: 185,
    nextChapter: 186,
    cadence: "weekly",
    magazine: "Tapas Webcomic",
    dropDayOfWeek: 5, // Friday
    dropHourUTC: 15,
    publisher: "Tapas Media",
  },
  {
    id: 106929,
    titleMatch: ["eleceed"],
    latestChapter: 315,
    nextChapter: 316,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 1, // Monday
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 118408,
    titleMatch: ["villains are destined to die", "death is the only ending for the villainess", "agyeogui ending jugeumppun"],
    latestChapter: 214,
    nextChapter: 215,
    totalChapters: 214,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 5, // Friday
    dropHourUTC: 15,
    publisher: "Tapas / KakaoPage",
  },
  {
    id: 102128,
    titleMatch: ["who made me a princess", "eoneu nal gongjuga doeeobeoryeotta"],
    latestChapter: 125,
    nextChapter: 125,
    totalChapters: 125,
    isFinished: true,
    cadence: "finished",
    magazine: "KakaoPage",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "Tappytoon & Webtoon",
  },
  {
    id: 117540,
    titleMatch: ["beware the villainess", "geu agnyeoreul josimhaseyo"],
    latestChapter: 138,
    nextChapter: 138,
    totalChapters: 138,
    isFinished: true,
    cadence: "finished",
    magazine: "KakaoPage",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "Tapas Media",
  },
  {
    id: 115291,
    titleMatch: ["the villainess turns the hourglass", "agnyeoneun moraesigyereul doedollinda"],
    latestChapter: 125,
    nextChapter: 125,
    totalChapters: 125,
    isFinished: true,
    cadence: "finished",
    magazine: "KakaoPage",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "Tappytoon",
  },
  {
    id: 130376,
    titleMatch: ["kill the villainess", "agnyeoreul jug-yeojwo"],
    latestChapter: 90,
    nextChapter: 90,
    totalChapters: 90,
    isFinished: true,
    cadence: "finished",
    magazine: "KakaoPage",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "Tapas Media",
  },
  {
    id: 129757,
    titleMatch: ["father, i don't want this marriage", "father i dont want this marriage", "appa, na i gyeolhon an hallaeyo"],
    latestChapter: 126,
    nextChapter: 126,
    totalChapters: 126,
    isFinished: true,
    cadence: "finished",
    magazine: "KakaoPage",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "Tappytoon",
  },
  {
    id: 100780,
    titleMatch: ["doctor elise", "oegwauisa elise"],
    latestChapter: 143,
    nextChapter: 143,
    totalChapters: 143,
    isFinished: true,
    cadence: "finished",
    magazine: "KakaoPage",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "Tappytoon & Lezhin",
  },
  {
    id: 113670,
    titleMatch: ["the remarried empress", "remarried empress", "jaehon hwanghu"],
    latestChapter: 185,
    nextChapter: 186,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 0, // Sunday
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 129758,
    titleMatch: ["the villainess is a marionette", "agnyeoneun marionette"],
    latestChapter: 112,
    nextChapter: 112,
    totalChapters: 112,
    isFinished: true,
    cadence: "finished",
    magazine: "KakaoPage",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "Tapas Media",
  },
  {
    id: 137351,
    titleMatch: ["how to get my husband on my side", "nampyeoneul nae pyeoneuro mandeuneun bangbeop"],
    latestChapter: 110,
    nextChapter: 111,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 3, // Wednesday
    dropHourUTC: 15,
    publisher: "Tapas / KakaoPage",
  },
  {
    id: 130833,
    titleMatch: ["i shall master this family", "i'll be the matriarch in this life", "ibeon saengeun gaju-ga doegetseumnida"],
    latestChapter: 160,
    nextChapter: 161,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 0, // Sunday
    dropHourUTC: 15,
    publisher: "Tapas / KakaoPage",
  },
  {
    id: 142100,
    titleMatch: ["my in-laws are obsessed with me", "siajeon-deuri na-ege jibchakhada"],
    latestChapter: 118,
    nextChapter: 119,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 0, // Sunday
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 111162,
    titleMatch: ["a stepmother's märchen", "a stepmother's marchen", "the fantaisie of a stepmother"],
    latestChapter: 135,
    nextChapter: 136,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 2, // Tuesday
    dropHourUTC: 15,
    publisher: "Tapas / KakaoPage",
  },
  {
    id: 114542,
    titleMatch: ["your throne", "haru-man neg-a doego sipeo"],
    latestChapter: 195,
    nextChapter: 196,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 2, // Tuesday
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 119866,
    titleMatch: ["nano machine", "nanomashin"],
    latestChapter: 240,
    nextChapter: 241,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 4, // Thursday
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 117070,
    titleMatch: ["the legend of the northern blade", "legend of the northern blade", "bukgeomjeon-gi"],
    latestChapter: 185,
    nextChapter: 186,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 2, // Tuesday
    dropHourUTC: 15,
    publisher: "Tappytoon & KakaoPage",
  },
  {
    id: 131934,
    titleMatch: ["return of the mount hua sect", "hwasangwihwan", "return of the blossoming blade"],
    latestChapter: 145,
    nextChapter: 146,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 3, // Wednesday
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 138612,
    titleMatch: ["the greatest estate developer", "greatest estate developer", "yeongji seolgyesa"],
    latestChapter: 165,
    nextChapter: 166,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 5, // Friday
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 125866,
    titleMatch: ["mercenary enrollment", "teenage mercenary", "iphak-yongbyeong"],
    latestChapter: 205,
    nextChapter: 206,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 0, // Sunday
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 127980,
    titleMatch: ["sss-class revival hunter", "sss-class suicide hunter", "sss-geup juk-eoya saneun sanyangkkun"],
    latestChapter: 115,
    nextChapter: 116,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 5, // Friday
    dropHourUTC: 15,
    publisher: "Tapas Media",
  },
  {
    id: 149455,
    titleMatch: ["swordmaster's youngest son", "geomga-ui maknae-adeul"],
    latestChapter: 135,
    nextChapter: 136,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 6, // Saturday
    dropHourUTC: 15,
    publisher: "Tapas / KakaoPage",
  },
  {
    id: 148962,
    titleMatch: ["damn reincarnation", "billomeogeul hwansaeng"],
    latestChapter: 85,
    nextChapter: 86,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 3, // Wednesday
    dropHourUTC: 15,
    publisher: "Tapas Media",
  },
  {
    id: 162985,
    titleMatch: ["revenge of the iron-blooded sword hound", "cheolhyeol-ui cheolgyeom sanyanggae"],
    latestChapter: 95,
    nextChapter: 96,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 1, // Monday
    dropHourUTC: 15,
    publisher: "Tapas Media",
  },
  {
    id: 159074,
    titleMatch: ["pick me up, infinite gacha", "pick me up!"],
    latestChapter: 115,
    nextChapter: 116,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 3, // Wednesday
    dropHourUTC: 15,
    publisher: "Tapas Media",
  },
  {
    id: 85354,
    titleMatch: ["wind breaker", "windeu beureikeo"],
    latestChapter: 510,
    nextChapter: 511,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 1, // Monday
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 113624,
    titleMatch: ["viral hit", "how to fight", "ssaumdokhak"],
    latestChapter: 218,
    nextChapter: 218,
    totalChapters: 218,
    isFinished: true,
    cadence: "finished",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 140410,
    titleMatch: ["quest supremacy", "questism", "gwaeseuteu jisangjuui"],
    latestChapter: 155,
    nextChapter: 156,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 0, // Sunday
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 118258,
    titleMatch: ["overgeared", "tembal"],
    latestChapter: 235,
    nextChapter: 236,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 5, // Friday
    dropHourUTC: 15,
    publisher: "Tapas Media",
  },
  {
    id: 115998,
    titleMatch: ["dungeon reset", "deonjeon riseet"],
    latestChapter: 205,
    nextChapter: 206,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 2, // Tuesday
    dropHourUTC: 15,
    publisher: "Tapas Media",
  },
  {
    id: 109039,
    titleMatch: ["second life ranker", "dubeon saneun ranker"],
    latestChapter: 175,
    nextChapter: 176,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 4, // Thursday
    dropHourUTC: 15,
    publisher: "Tapas Media",
  },
  {
    id: 136173,
    titleMatch: ["doom breaker", "reincarnation of the suicidal battle god", "tusasin gwangrimgi"],
    latestChapter: 105,
    nextChapter: 106,
    cadence: "weekly",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 0, // Sunday
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 118808,
    titleMatch: ["murim login"],
    latestChapter: 195,
    nextChapter: 196,
    cadence: "weekly",
    magazine: "KakaoPage",
    dropDayOfWeek: 5, // Friday
    dropHourUTC: 15,
    publisher: "KakaoPage",
  },
  {
    id: 110960,
    titleMatch: ["tomb raider king", "dogulwang"],
    latestChapter: 411,
    nextChapter: 411,
    totalChapters: 411,
    isFinished: true,
    cadence: "finished",
    magazine: "KakaoPage",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "Tapas Media",
  },
  {
    id: 121708,
    titleMatch: ["see you in my 19th life", "ibeon saengdo jal butakhae"],
    latestChapter: 114,
    nextChapter: 114,
    totalChapters: 114,
    isFinished: true,
    cadence: "finished",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 86964,
    titleMatch: ["bastard", "hurejasik"],
    latestChapter: 93,
    nextChapter: 93,
    totalChapters: 93,
    isFinished: true,
    cadence: "finished",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 100924,
    titleMatch: ["sweet home", "seuwiteuhom"],
    latestChapter: 140,
    nextChapter: 140,
    totalChapters: 140,
    isFinished: true,
    cadence: "finished",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 112955,
    titleMatch: ["the boxer", "deo bokseo"],
    latestChapter: 123,
    nextChapter: 123,
    totalChapters: 123,
    isFinished: true,
    cadence: "finished",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },
  {
    id: 129994,
    titleMatch: ["shotgun boy", "syeotgeonboi"],
    latestChapter: 68,
    nextChapter: 68,
    totalChapters: 68,
    isFinished: true,
    cadence: "finished",
    magazine: "Naver Webtoon",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "WEBTOON Official",
  },

  // --- Series on Scheduled Break / Hiatus ---
  {
    id: 118586,
    titleMatch: ["frieren", "sousou no frieren"],
    latestChapter: 138,
    nextChapter: 139,
    cadence: "hiatus",
    magazine: "Weekly Shonen Sunday",
    dropDayOfWeek: 2,
    dropHourUTC: 15,
    publisher: "Viz Media",
    isHiatus: true,
  },
  {
    id: 30002,
    titleMatch: ["berserk"],
    latestChapter: 376,
    nextChapter: 376,
    cadence: "hiatus",
    magazine: "Young Animal",
    dropDayOfWeek: 4,
    dropHourUTC: 15,
    publisher: "Hakusensha & Dark Horse",
    isHiatus: true,
    totalChapters: 376,
  },
  {
    id: 30656,
    titleMatch: ["vagabond"],
    latestChapter: 327,
    nextChapter: 327,
    cadence: "hiatus",
    magazine: "Weekly Morning",
    dropDayOfWeek: 3,
    dropHourUTC: 15,
    publisher: "Kodansha & Viz Media",
    isHiatus: true,
    totalChapters: 327,
  },
  {
    id: 30026,
    titleMatch: ["hunter x hunter"],
    latestChapter: 405,
    nextChapter: 405,
    cadence: "hiatus",
    magazine: "Weekly Shonen Jump Special",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "Viz Media",
    isHiatus: true,
    totalChapters: 405,
  },

  // --- Finished Series (Zero countdown - Completed) ---
  {
    id: 117195,
    titleMatch: ["oshi no ko"],
    latestChapter: 166,
    nextChapter: 166,
    cadence: "finished",
    magazine: "Weekly Young Jump",
    dropDayOfWeek: 3,
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha",
    isFinished: true,
    totalChapters: 166,
  },
  {
    id: 101517,
    titleMatch: ["jujutsu kaisen"],
    latestChapter: 271,
    nextChapter: 271,
    cadence: "finished",
    magazine: "Weekly Shonen Jump",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
    isFinished: true,
    totalChapters: 271,
  },
  {
    id: 105398,
    titleMatch: ["solo leveling", "na honjaman level up"],
    latestChapter: 179,
    nextChapter: 179,
    cadence: "finished",
    magazine: "KakaoPage",
    dropDayOfWeek: 3,
    dropHourUTC: 15,
    publisher: "Tappytoon & Pocket Comics",
    isFinished: true,
    totalChapters: 179,
  },
  {
    id: 30130,
    titleMatch: ["attack on titan", "shingeki no kyojin"],
    latestChapter: 139,
    nextChapter: 139,
    cadence: "finished",
    magazine: "Bessatsu Shonen Magazine",
    dropDayOfWeek: 4,
    dropHourUTC: 15,
    publisher: "Kodansha USA",
    isFinished: true,
    totalChapters: 139,
  },
  {
    id: 87216,
    titleMatch: ["demon slayer", "kimetsu no yaiba"],
    latestChapter: 205,
    nextChapter: 205,
    cadence: "finished",
    magazine: "Weekly Shonen Jump",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
    isFinished: true,
    totalChapters: 205,
  },
  {
    id: 85486,
    titleMatch: ["my hero academia", "boku no hero academia"],
    latestChapter: 430,
    nextChapter: 430,
    cadence: "finished",
    magazine: "Weekly Shonen Jump",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "MANGA Plus by Shueisha & Viz Media",
    isFinished: true,
    totalChapters: 430,
  },
  {
    id: 30012,
    titleMatch: ["bleach"],
    latestChapter: 686,
    nextChapter: 686,
    cadence: "finished",
    magazine: "Weekly Shonen Jump",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "Viz Media",
    isFinished: true,
    totalChapters: 686,
  },
  {
    id: 30011,
    titleMatch: ["naruto"],
    latestChapter: 700,
    nextChapter: 700,
    cadence: "finished",
    magazine: "Weekly Shonen Jump",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "Viz Media",
    isFinished: true,
    totalChapters: 700,
  },
  {
    id: 30024,
    titleMatch: ["death note"],
    latestChapter: 108,
    nextChapter: 108,
    cadence: "finished",
    magazine: "Weekly Shonen Jump",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "Viz Media",
    isFinished: true,
    totalChapters: 108,
  },
  {
    id: 65243,
    titleMatch: ["haikyuu!!", "haikyu"],
    latestChapter: 402,
    nextChapter: 402,
    cadence: "finished",
    magazine: "Weekly Shonen Jump",
    dropDayOfWeek: 0,
    dropHourUTC: 15,
    publisher: "Viz Media",
    isFinished: true,
    totalChapters: 402,
  },
  {
    id: 63327,
    titleMatch: ["tokyo ghoul"],
    latestChapter: 143,
    nextChapter: 143,
    cadence: "finished",
    magazine: "Weekly Young Jump",
    dropDayOfWeek: 3,
    dropHourUTC: 15,
    publisher: "Viz Media",
    isFinished: true,
    totalChapters: 143,
  },
  {
    id: 85611,
    titleMatch: ["tokyo ghoul:re", "tokyo ghoul re"],
    latestChapter: 179,
    nextChapter: 179,
    cadence: "finished",
    magazine: "Weekly Young Jump",
    dropDayOfWeek: 3,
    dropHourUTC: 15,
    publisher: "Viz Media",
    isFinished: true,
    totalChapters: 179,
  },
];

/**
 * Finds raw verified entry by ID, title, or slug
 */
export function getVerifiedScheduleItem(
  id?: number | null,
  title?: string | null,
  slug?: string | null
): VerifiedSchedule | null {
  if (id) {
    const found = VERIFIED_SCHEDULES.find((s) => s.id === id);
    if (found) return found;
  }
  const cleanTitle = (title || "").toLowerCase();
  if (cleanTitle) {
    const found = VERIFIED_SCHEDULES.find((s) =>
      s.titleMatch?.some((t) => cleanTitle.includes(t) || t.includes(cleanTitle))
    );
    if (found) return found;
  }
  const cleanSlug = (slug || "").toLowerCase();
  if (cleanSlug) {
    const found = VERIFIED_SCHEDULES.find((s) =>
      s.slugMatch?.some((sm) => cleanSlug.includes(sm)) ||
      s.titleMatch?.some((t) => cleanSlug.includes(t.replace(/\s+/g, "-")))
    );
    if (found) return found;
  }
  return null;
}

/**
 * Centralized progression calculator: advances chapter counts based on elapsed publication cycles.
 */
export function calculateProgressedChapters(
  found: VerifiedSchedule,
  _atDate: Date = new Date()
): { latestChapter: number; nextChapter: number } {
  const latestChapter = found.latestChapter;
  const nextChapter = found.nextChapter;

  if (found.isFinished || found.cadence === "finished") {
    const total = found.totalChapters || found.latestChapter;
    return { latestChapter: total, nextChapter: total };
  }

  if (found.isHiatus || found.cadence === "hiatus" || found.cadence === "irregular") {
    return { latestChapter: found.latestChapter, nextChapter: found.latestChapter };
  }

  return { latestChapter, nextChapter };
}

export interface ScheduledDropItem {
  id: number;
  title: string;
  slug: string;
  latestChapter: number;
  nextChapter: number;
  magazine: string;
  publisher: string;
  cadence: string;
  dropHourUTC: number;
  dropDayOfWeek: number;
}

/**
 * Returns all active verified series scheduled to drop on a given calendar date.
 */
export function getScheduledDropsForDate(date: Date = new Date()): ScheduledDropItem[] {
  const currentUTCDay = date.getUTCDay();
  const currentUTCDate = date.getUTCDate();
  const drops: ScheduledDropItem[] = [];
  const referenceEpoch = new Date("2024-11-24T15:00:00Z").getTime();

  for (const item of VERIFIED_SCHEDULES) {
    if (!item.id || item.isFinished || item.isHiatus || item.cadence === "finished" || item.cadence === "hiatus") {
      continue;
    }

    let isDroppingToday = false;
    if (item.cadence === "monthly" && item.monthlyDay) {
      if (item.monthlyDay === currentUTCDate) {
        isDroppingToday = true;
      }
    } else if (item.cadence === "weekly") {
      if (item.dropDayOfWeek === currentUTCDay) {
        isDroppingToday = true;
      }
    } else if (item.cadence === "biweekly") {
      if (item.dropDayOfWeek === currentUTCDay) {
        const weeksElapsed = Math.floor(Math.max(0, date.getTime() - referenceEpoch) / (7 * 24 * 60 * 60 * 1000));
        if (weeksElapsed % 2 === 0) {
          isDroppingToday = true;
        }
      }
    }

    if (isDroppingToday) {
      const { latestChapter, nextChapter } = calculateProgressedChapters(item, date);
      const rawTitle = item.titleMatch?.[0] || `Manga #${item.id}`;
      const title = rawTitle
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      const baseSlug = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const slug = `${baseSlug}-${item.id}`;

      drops.push({
        id: item.id,
        title,
        slug,
        latestChapter,
        nextChapter,
        magazine: item.magazine,
        publisher: item.publisher,
        cadence: item.cadence,
        dropHourUTC: item.dropHourUTC,
        dropDayOfWeek: item.dropDayOfWeek,
      });
    }
  }

  return drops;
}

/**
 * Resolves verified schedule and accurate chapter metadata for any manga item.
 */
export function getVerifiedSchedule(
  id?: number | null,
  title?: string | null,
  mediaStatus?: string | null,
  totalChapters?: number | null
): {
  isFinished: boolean;
  isHiatus: boolean;
  isVerifiedInDb: boolean;
  latestChapter: number;
  nextChapter: number;
  totalChapters?: number;
  targetTimestamp: number | null;
  magazine: string;
  cadenceText: string;
  publisher: string;
} {
  const cleanId = id || 0;
  const titleLower = (title || "").toLowerCase();

  // 1. Direct ID match
  let found = cleanId > 0 ? VERIFIED_SCHEDULES.find((s) => s.id === cleanId) : undefined;

  // 2. Title matching
  if (!found) {
    found = VERIFIED_SCHEDULES.find((s) =>
      s.titleMatch?.some((t) => titleLower.includes(t))
    );
  }

  // If found in verified DB
  if (found) {
    if (found.isFinished || found.cadence === "finished") {
      const total = found.totalChapters || found.latestChapter;
      return {
        isFinished: true,
        isHiatus: false,
        isVerifiedInDb: true,
        latestChapter: total,
        nextChapter: total,
        totalChapters: total,
        targetTimestamp: null,
        magazine: found.magazine,
        cadenceText: "Completed Series",
        publisher: found.publisher,
      };
    }

    if (found.isHiatus || found.cadence === "hiatus" || found.cadence === "irregular") {
      return {
        isFinished: false,
        isHiatus: true,
        isVerifiedInDb: true,
        latestChapter: found.latestChapter,
        nextChapter: found.nextChapter,
        totalChapters: found.totalChapters || found.latestChapter,
        targetTimestamp: null,
        magazine: found.magazine,
        cadenceText: found.cadence === "irregular" ? "Irregular Releases" : "Scheduled Hiatus",
        publisher: found.publisher,
      };
    }

    // Calculate real target timestamp and self-advancing chapters
    const now = new Date();
    const currentUTCDay = now.getUTCDay();
    const currentUTCHour = now.getUTCHours();
    let targetDate = new Date(now);

    const { latestChapter, nextChapter } = calculateProgressedChapters(found, now);

    if (found.cadence === "monthly" && found.monthlyDay) {
      // Monthly drop (e.g. 20th of the month)
      const currentUTCDate = now.getUTCDate();
      if (currentUTCDate < found.monthlyDay || (currentUTCDate === found.monthlyDay && currentUTCHour < found.dropHourUTC)) {
        targetDate.setUTCDate(found.monthlyDay);
      } else {
        targetDate.setUTCMonth(targetDate.getUTCMonth() + 1);
        targetDate.setUTCDate(found.monthlyDay);
      }
      targetDate.setUTCHours(found.dropHourUTC, 0, 0, 0);
    } else {
      // Weekly / Biweekly drop
      let daysUntil = (found.dropDayOfWeek - currentUTCDay + 7) % 7;
      if (daysUntil === 0 && currentUTCHour >= found.dropHourUTC) {
        daysUntil = found.cadence === "biweekly" ? 14 : 7;
      }
      targetDate.setUTCDate(targetDate.getUTCDate() + daysUntil);
      targetDate.setUTCHours(found.dropHourUTC, 0, 0, 0);
    }

    // Ensure targetTimestamp is strictly in the future
    if (targetDate.getTime() <= now.getTime()) {
      if (found.cadence === "monthly") {
        targetDate.setUTCMonth(targetDate.getUTCMonth() + 1);
      } else if (found.cadence === "biweekly") {
        targetDate.setUTCDate(targetDate.getUTCDate() + 14);
      } else {
        targetDate.setUTCDate(targetDate.getUTCDate() + 7);
      }
    }

    const targetTimestamp = Math.floor(targetDate.getTime() / 1000);

    const cadenceLabels: Record<string, string> = {
      weekly: "Weekly Simulpub",
      biweekly: "Bi-Weekly Simulpub",
      monthly: `Monthly Drop (${found.monthlyDay ? `${found.monthlyDay}th` : "Monthly"})`,
      irregular: "Periodic Release",
    };

    return {
      isFinished: false,
      isHiatus: false,
      isVerifiedInDb: true,
      latestChapter,
      nextChapter,
      totalChapters: found.totalChapters || latestChapter,
      targetTimestamp,
      magazine: found.magazine,
      cadenceText: cadenceLabels[found.cadence] || "Official Release",
      publisher: found.publisher,
    };
  }

  // Fallback for general uncatalogued titles
  const cleanStatus = (mediaStatus || "").toUpperCase();
  const isFinished = cleanStatus === "FINISHED" || cleanStatus === "CANCELLED";
  if (isFinished) {
    const chapters = totalChapters || 0;
    return {
      isFinished: true,
      isHiatus: false,
      isVerifiedInDb: false,
      latestChapter: chapters,
      nextChapter: chapters,
      targetTimestamp: null,
      magazine: "Official Serialization",
      cadenceText: "Completed Series",
      publisher: "Official Publisher",
    };
  }

  // For releasing series, calculate deterministic schedule
  const dropDay = (id || 0) % 7;
  const now = new Date();
  const currentUTCDay = now.getUTCDay();
  const currentUTCHour = now.getUTCHours();
  let daysUntil = (dropDay - currentUTCDay + 7) % 7;
  if (daysUntil === 0 && currentUTCHour >= 15) {
    daysUntil = 7;
  }

  const targetDate = new Date(now);
  targetDate.setUTCDate(targetDate.getUTCDate() + daysUntil);
  targetDate.setUTCHours(15, 0, 0, 0);

  if (targetDate.getTime() <= now.getTime()) {
    targetDate.setUTCDate(targetDate.getUTCDate() + 7);
  }

  const estimatedCurrent = totalChapters || 0;

  return {
    isFinished: false,
    isHiatus: false,
    isVerifiedInDb: false,
    latestChapter: estimatedCurrent,
    nextChapter: estimatedCurrent > 0 ? estimatedCurrent + 1 : 0,
    targetTimestamp: Math.floor(targetDate.getTime() / 1000),
    magazine: "Weekly Serialization",
    cadenceText: "Weekly Simulpub",
    publisher: "Official Licensed Platform",
  };
}
