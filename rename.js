const fs = require('fs');
const path = require('path');

// 你的 Leetcode 目录相对路径
const targetDir = path.join(__dirname, 'app/docs/CommunityShare/Leetcode');

// 我们刚才整理的完美映射表 (新文件名 : 老物理文件名)
const renameMap = {
  "sword-offer-021": "剑指 Offer II 021. 删除链表的倒数第 n 个结点_translated",
  "121-stock": "[121]买卖股票的最佳时期_translated",
  "1333-filter": "[1333]餐厅过滤器_translated",
  "146-lru": "[146]LRU 缓存_translated",
  "1545-nth-binary": "[1545]找出第 N 个二进制字符串中的第 K 位",
  "213-robber-ii": "[213]打家劫舍 II_translated",
  "2490-circular": "[2490]回环句_translated",
  "2562-concat": "[2562]找出数组的串联值_translated",
  "2582-pillow": "[2582]递枕头_translated",
  "1004-ones": "1004_translated",
  "1234-replace": "1234. 替换子串得到平衡字符串_translated",
  "142-linked-list-ii": "142.环形链表II_translated",
  "1653-min-deletions": "1653. 使字符串平衡的最少删除次数_translated",
  "1664-balanced": "1664生成平衡数组的方案数_translated",
  "1825-mk-average": "1825求出 MK 平均值_translated",
  "1828-points": "1828统计一个圆中点的数目_translated",
  "2131-palindrome": "2131. 连接两字母单词得到的最长回文串",
  "219-duplicate-ii": "219_translated",
  "2241-atm": "2241. Design an ATM Machine",
  "2270-split-array": "2270. Number of Ways to Split Array",
  "2293-min-max": "2293_translated",
  "2299-password": "2299强密码检验器II_translated",
  "2309-letter": "2309兼具大小写的最好英文字母_translated",
  "2335-cups": "2335. 装满杯子需要的最短总时长",
  "2341-pairs": "2341. 数组能形成多少数对_translated",
  "2639-width": "2639. 查询网格图中每一列的宽度_translated",
  "2679-matrix-sum": "2679.矩阵中的和_translated",
  "2894-sum-diff": "2894. 分类求和并作差",
  "3072-distribute": "3072. 将元素分配到两个数组中 II_translated",
  "3138-anagram": "3138. Minimum Length of Anagram Concatenation",
  "345-vowels": "345. 反转字符串中的元音字母_translated",
  "42-rain": "42",
  "46-permutations": "46.全排列",
  "538-bst": "538.把二叉搜索树转换为累加树_translated",
  "6323-money": "6323. 将钱分给最多的儿童_translated",
  "76-min-window": "76最小覆盖子串_translated",
  "80-duplicates": "80_translated",
  "9021-tut": "9021_TUT_3_25T1",
  "93-ip-address": "93复原Ip地址",
  "994-oranges": "994.腐烂的橘子_translated",
  "brief-homework": "brief_alternate 作业帮忙_translated",
  "counting-stars": "Counting Stars-Inter-Uni Programming Contest"
};

console.log("🚀 开始批量重命名文件...");

let successCount = 0;
let failCount = 0;

for (const [newSlug, oldFileName] of Object.entries(renameMap)) {
  const oldPath = path.join(targetDir, `${oldFileName}.md`);
  const newPath = path.join(targetDir, `${newSlug}.md`);

  if (fs.existsSync(oldPath)) {
    try {
      fs.renameSync(oldPath, newPath);
      console.log(`✅ [成功] ${oldFileName}.md  ->  ${newSlug}.md`);
      successCount++;
    } catch (err) {
      console.error(`❌ [失败] 无法重命名 ${oldFileName}.md:`, err);
      failCount++;
    }
  } else {
    // 可能是之前已经手动改过，或者名字有细微差别
    console.log(`⚠️ [跳过] 找不到原文件: ${oldFileName}.md`);
  }
}

console.log(`\n🎉 执行完毕！成功: ${successCount} 个，跳过/失败: ${failCount} 个。`);
