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
addCat("宠物","猫粮,猫");
check("addCat 添加自定义分类", cats.includes("宠物") && cats.length === beforeLen + 1, "cats=" + cats.join(","));
check("addCat 保存关键词", JSON.stringify(catKw["宠物"]) === JSON.stringify(["猫粮","猫"]), JSON.stringify(catKw["宠物"]));
addCat("宠物");
check("addCat 拒绝重复分类", cats.length === beforeLen + 1);
addCat("  ");
check("addCat 拒绝空名称", cats.length === beforeLen + 1);
// 自动识别分类
const rc = mockAI("给猫买猫粮40")[0];
check("自定义关键词→宠物分类", rc.cat === "宠物" && rc.name === "猫粮" && rc.icon === "🏷️", JSON.stringify(rc));
const rc2 = mockAI("买衣服300")[0];
check("买衣服→购物", rc2.cat === "购物" && rc2.name === "衣服", JSON.stringify(rc2));
const rc3 = mockAI("感冒买药45")[0];
check("买药→医疗", rc3.cat === "医疗" && rc3.name === "药品", JSON.stringify(rc3));
const rc4 = mockAI("交房租2000")[0];
check("交房租→居住", rc4.cat === "居住" && rc4.name === "房租", JSON.stringify(rc4));
const rc5 = mockAI("坐地铁4")[0];
check("地铁→交通", rc5.cat === "交通" && rc5.name === "地铁", JSON.stringify(rc5));
const rc6 = mockAI("看场电影80")[0];
check("电影→娱乐", rc6.cat === "娱乐", JSON.stringify(rc6));
const rc7 = mockAI("买书120")[0];
check("买书→学习", rc7.cat === "学习" && rc7.name === "书", JSON.stringify(rc7));
const rc8 = mockAI("收到转账500")[0];
check("收到转账→收入", rc8.amount === 500 && rc8.cat === "其他收入", JSON.stringify(rc8));
// 收支符号与负结余
const ri = mockAI("收入200")[0];
check("收入200→收入+200", ri.amount === 200 && ri.cat === "其他收入", JSON.stringify(ri));
const rj = mockAI("支出300收入200");
check("支出300收入200→两笔且一支出", rj.length === 2 && rj[0].amount === -300 && rj[1].amount === 200, JSON.stringify(rj));
const savedBills = bills.slice();
bills.length = 0;
bills.push({name:"测试支出",cat:"其他",icon:"🧾",amount:-300,date:"今天",pay:"微信"},{name:"测试收入",cat:"其他收入",icon:"💰",amount:200,date:"今天",pay:"微信"});
const t2 = totals();
check("200收入-300支出结余=-100", t2.income === 200 && t2.expense === -300 && (t2.income + t2.expense) === -100, JSON.stringify(t2));
render("home");
const home2 = document.getElementById("content").innerHTML;
check("负结余显示 -¥ 100.00", home2.includes('balance neg">-¥ 100.00'), (home2.match(/balance[^>]*>[^<]*/g) || []).join(" | "));
bills.length = 0;
bills.push(...savedBills);
render("home");
const idx = cats.indexOf("宠物");
deleteCat(idx);
check("deleteCat 删除分类", !cats.includes("宠物") && cats.length === beforeLen);
check("deleteCat 同步删除关键词", !("宠物" in catKw));
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
