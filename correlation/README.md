# 心理统计课堂互动 · 可维护源码版

直接双击项目根目录 `index.html`，分别进入相关分析和一元回归。**完全离线**，不依赖任何 npm、CDN 或后端服务。

## 文件结构

```
psych-stats-interactive/
├─ index.html                  # 课程入口
├─ correlation/
│  ├─ index.html               # 页面结构
│  ├─ style.css                # 页面样式
│  ├─ data.js                  # 课堂原始数据
│  ├─ statistics.js            # Pearson/Spearman、p、CI、排名
│  ├─ simulation.js            # 精确相关系数的模拟数据
│  ├─ charts.js                # SVG 散点图及拟合线
│  └─ app.js                   # 页面状态、按钮、滑块、结果文本
└─ regression/
   ├─ index.html               # 页面结构
   ├─ style.css                # 页面样式
   ├─ data.js                  # 80 个真实观测
   ├─ statistics.js            # OLS、t、p、Shapiro–Wilk
   ├─ simulation.js            # 典型残差诊断模拟
   ├─ charts.js                # 回归图、残差图、Q–Q 图
   └─ app.js                   # 页面状态、按钮、预测吸附、SW 点击触发
```

## 修改哪个文件？

- 修改统计计算、拟合方法、检验公式 → `statistics.js`
- 修改模拟数据的异常形态 → `simulation.js`
- 修改点的大小、线条颜色、参考线 → `charts.js`
- 修改按钮、滑块、预测显示、运行 SW 的时机 → `app.js`
- 修改布局和样式 → `index.html` / `style.css`
- 修改课堂观测数据 → `data.js`

每页 HTML 末尾按 `data.js → statistics.js → simulation.js → charts.js → app.js` 加载。不要直接单独打开这些 JS 文件。

## 设计说明

此次重构保持了原来的 SVG 绘图、真实数据、数值结果和交互逻辑，没有为了“更现代”而引入 React、打包器或 npm。`charts.js` 仍使用模板字符串构建 SVG：这在零依赖离线演示中可行，但如果之后需要频繁维护复杂交互，可以继续将它拆成 `axes.js`、`scatter.js`、`diagnostics.js`，或改用 Canvas/PixiJS 等方式。

## 核验

回归：`n=80`、斜率约 `−1.263`、`R²≈.272`；可以切换诊断并点击运行 SW 检验。
相关：Pearson `r≈−.521`，两两相关 3 行，模拟相关系数随控制滑块变化。

公开项目前，请确认课堂观测数据允许公开使用。
