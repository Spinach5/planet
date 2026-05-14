import { writeFileSync, unlinkSync } from 'fs';
import path from 'path';
import { compile } from 'sass';
import { sync } from 'glob';  // npm install glob

const srcDir = './src';

// 1. 找到所有 .scss 文件（排除转换后的 .css）
const scssFiles = sync(`${srcDir}/**/*.scss`);

scssFiles.forEach(scssPath => {
  const cssPath = scssPath.replace(/\.scss$/, '.css');

  // 编译 SCSS 为 CSS
  const result = compile(scssPath, { style: 'expanded' });
  writeFileSync(cssPath, result.css, 'utf8');

  // 删除原 .scss 文件（可选，建议先保留备份）
  unlinkSync(scssPath);

  console.log(`✅ 转换: ${scssPath} -> ${cssPath}`);
});

console.log('🎉 所有 SCSS 已转换为 CSS，原 .scss 文件已删除');
