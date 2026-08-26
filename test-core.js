/* 随手账核心逻辑冒烟测试（Node 环境，无真实浏览器） */
const fs = require("fs");
const html = fs.readFileSync("随手账-V0.2.html", "utf8");
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error("未找到 <script>"); process.exit(1); }

const appScript = m[1];
const testScript = `
;(function(){
let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log("PASS " + name); }
  else { fail++; console.log("FAIL " + name + (extra ? " -> " + extra : "")); }
}
check("种子账单存在", Array.isArray(bills) && bills.length === 5, "bills.length=" + bills.length);
const t = totals();
check("收入=8500", t.income === 8500, "income=" + t.income);
check("支出=161", t.expense === -161, "expense=" + t.expense);
const r1 = mockAI("昨天买菜86，晚上吃饭128，支付宝付的");
check("解析出2笔", r1.length === 2, "n=" + r1.length);
check("买菜-86", r1[0].name === "买菜" && r1[0].amount === -86 && r1[0].cat === "购物", JSON.stringify(r1[0]));
check("第二笔餐饮-128", r1[1].cat === "餐饮" && r1[1].amount === -128, JSON.stringify(r1[1]));
check("支付方式=支付宝", r1[0].pay === "支付宝", r1[0].pay);
check("日期=昨天", r1[0].date === "昨天", r1[0].date);
const r2 = mockAI("工资到账8500");
check("工资收入", r2.length === 1 && r2[0].amount === 8500 && r2[0].cat === "工资" && r2[0].icon === "💰", JSON.stringify(r2));
check("无金额返回空", mockAI("今天天气不错").length === 0);
check("installApp 已定义", typeof installApp === "function");
check("hideInstallBar 已定义", typeof hideInstallBar === "function");
const homeHtml = document.getElementById("content").innerHTML;
check("首页渲染出本月结余", homeHtml.includes("本月结余") && homeHtml.includes("最近账单"), homeHtml.slice(0, 80));
// 分类管理
const beforeLen = cats.length;
addCat("宠物");
check("addCat 添加自定义分类", cats.includes("宠物") && cats.length === beforeLen + 1, "cats=" + cats.join(","));
addCat("宠物");
check("addCat 拒绝重复分类", cats.length === beforeLen + 1);
addCat("  ");
check("addCat 拒绝空名称", cats.length === beforeLen + 1);
const idx = cats.indexOf("宠物");
deleteCat(idx);
check("deleteCat 删除分类", !cats.includes("宠物") && cats.length === beforeLen);
check("confirm 弹窗含新分类", mockAI("给猫买猫粮40").length === 1);
console.log("\\n结果: " + pass + " 通过, " + fail + " 失败");
if (fail > 0) process.exitCode = 1;
})();
`;

// 轻量 DOM 桩
const elements = {};
function el(id) {
  if (!elements[id]) elements[id] = {
    id, innerHTML: "", textContent: "", value: "", style: {},
    classList: { add() {}, remove() {} },
    querySelector: () => null, dataset: {}
  };
  return elements[id];
}
global.document = {
  getElementById: el,
  querySelector: () => null,
  querySelectorAll: () => []
};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.window = global;
global.addEventListener = () => {};
global.confirm = () => true;
global.prompt = () => null;

eval(appScript + testScript);
