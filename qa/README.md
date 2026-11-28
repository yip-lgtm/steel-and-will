# 兵器娘立繪重畫 pipeline

呢個資料夾係「立繪重畫」自動化 pipeline 嘅工具同進度。**每輪 sandbox 係新 workspace**，
所以工具同名單都靠呢個 folder 落地保存（commit 落 `steel-and-will` repo）。

| 檔案 | 用途 |
|------|------|
| `restyle-weapons.mjs` | 生成腳本。`node /workspace/qa/restyle-weapons.mjs 10` → 每批重畫 10 件未做嘅 |
| `restyle-done.json` | 已完成（新風格）id 名單 |
| `restyle-redo.json` | 要重畫嘅 id（已經有新風格檔，但當時 prompt 畫錯） |
| `askpass.sh` | git push 用嘅 credential helper（讀 `$GITHUB_PUSH_TOKEN`，唔含密碼本身） |

## 下一輪點樣 resume

```bash
# 1. clone 兩個 repo（token 用 x-access-token）
cd /workspace && mkdir -p .s2 && cd .s2
AUTH="Authorization: Basic $(printf 'x-access-token:%s' "$GITHUB_PUSH_TOKEN" | base64 -w0)"
git -c http.extraheader="$AUTH" clone https://github.com/yip-lgtm/steel-and-will.git src
git -c http.extraheader="$AUTH" clone https://github.com/yip-lgtm/yip-lgtm.github.io.git pages

# 2. 攞返工具同進度（喺 src repo 入面）
mkdir -p /workspace/qa && cp src/qa/restyle-weapons.mjs src/qa/restyle-done.json \
  src/qa/restyle-redo.json src/qa/askpass.sh /workspace/qa/

# 3. 跑
node /workspace/qa/restyle-weapons.mjs 10
```

`restyle-done.json` 同 `restyle-redo.json` 係權威進度；唔好靠圖片尺寸重新推算。

## 判定「已經係新風格」

新風格圖 = **1664×2496**；舊風格圖 = 1152×1728。名冊 182 件全部都喺 `src/public/portraits/`。

## 每輪必做驗證

1. 新圖 `src/public/portraits/<id>.jpg` 同 `pages/cute/portraits/<id>.jpg` **md5 一致**（`cp` 出嚟嘅，應該一模一樣）。
2. 尺寸 1664×2496、JPEG 有效。
3. 肉眼睇一張，確認係二次元 + 奶油底色 + 紅邊肩章 + 武器畫實。
4. push 前 `git fetch origin`，確認 `git ls-remote origin main` 同 `git rev-parse HEAD` **完全相等**。
5. push 完去 CDN 抽查：`https://yip-lgtm.github.io/cute/portraits/<id>.jpg` 要 200。

## 額度（重要）

生成接口有 plan allowance 上限。撞到以下訊息就**唔好喺同一輪重試**，留返下一輪：

```
the plan allowance cannot cover this image generation and credit auto-consumption is turned off
```

實測每輪大概得 3～5 張成，唔好因為剩低嘅多就加大 batch 硬撞。

⚠️ 2026-11-27 實測：10 個 request 報「成功 5／失敗 5」，但**只有 2 張落地**。
另外 3 個 success 嘅 `file_name` 對唔上 request 嘅 `output_file`，所以被
`batch.some((w) => w.id === id)` 靜靜篩走（script 呢個分支唔會 log 任何嘢）。
`/tmp/mcode-tools-0/mcode-tools.log` 只有 2 次 `get_asset_url` call，可以對數。

### 根因已確認（2026-11-27 11:0x）：Drive 撞名會改名，唔係 API 漏單

`output_file: "ft.jpg"` 撞到資料空間同名檔 → 服務改名叫 **`ft (3).jpg`**（`ft (1)`、`ft (2)`…），
所以 `success_items[].file_name` ≠ `output_file`，script 用 `name.replace(/\.jpg$/,"")` 對唔上 id，
於係**生成咗、畀錢咗、但一張都冇落地**（呢個分支完全冇 log）。

**證成做法**（一輪 BATCH=1 都會撞，唔關 batch 大小事）：

1. 資料空間 `/AI Generated/` 係生成圖落腳處（`space_list` → `updated_at` 最新嗰個就係今輪）。
2. `mcode-tools get_asset_url <node_id>` → `curl` 落 `src/public/portraits/<id>.jpg` + `pages/cute/portraits/<id>.jpg`。
3. **落地前一定要肉眼睇 + 睇尺寸 1664×2496**：改名嘅檔未必係你今輪 request 嗰張，
   同一個 id 可以有幾個版本（`ft (1)`/`ft (2)`/`ft (3)`）。
   2026-11-27 逐張睇過：`ft (3)` ✅（坦克真實大小）、`ft (1)` ❌（似另一種重型坦克）、
   `ft (2)` ❌（坦克畫成手掌咁細）；`a7v (1)` ✅（德軍鐵十字、巨大車體）、`a7v (2)` ❌（車太細）；
   `mark1 (1)` ✅。**`ft (2)`／`a7v (2)` 係用錯 prompt 畫出嚟嘅，唔可以當新風格。**

救返上批被丟嘅圖 = 慳返重生成嘅額度，唔好重跑 request。

## Prompt 分類（kind → 姿勢）

`poseFor()` 一定要按 `kind` 分流，唔好落去預設句：

| kind | 處理 |
|------|------|
| `tank` | 坦克企喺佢後面、真實大小、履帶車體炮塔要清楚 ⚠ **曾經漏咗呢個分支，令模型畫成手掌咁細嘅坦克** |
| `artillery` | 炮車全貌：長炮管、炮閂、炮架、車輪 |
| `air` / `sea` | 飛機 / 船喺後面，構型清楚 |
| `infantry`（預設） | 武器橫抱喺身前 |

## Push / 發佈

```bash
export GIT_ASKPASS=/workspace/qa/askpass.sh GIT_TERMINAL_PROMPT=0
cd /workspace/.s2/src   && git add -A && git commit -m "立繪新風格：..." && git push origin HEAD:main
cd /workspace/.s2/pages && git add -A && git commit -m "立繪新風格：..." && git push origin HEAD:main

# dispatch publish.yml（steel-and-will 個 repo，唔係 pages）
curl -sS -o /dev/null -w "%{http_code}\n" -X POST \
  -H "Authorization: Bearer $GITHUB_PUSH_TOKEN" -H "Accept: application/vnd.github+json" \
  -d '{"ref":"main"}' \
  https://api.github.com/repos/yip-lgtm/steel-and-will/actions/workflows/publish.yml/dispatches
# 期望 204
```

`publish.yml` 只會 copy `dist-pages/assets`、`pages.html`、`portraits` 同幾個 JSON 去 pages repo，
所以 `qa/` 唔會出現在線上網站。

## 進度

31／182 張新風格（mosin 重畫完成，redo 清空）。仲有 151 件未畫。
