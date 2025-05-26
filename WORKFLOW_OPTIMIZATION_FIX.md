# GitHub Actions重複排除最適化

## 🚨 現在の問題

### 重複実行パターン
```yaml
# 問題のあるワークフロー設定
name: RN Comprehensive Testing
on: [push, pull_request]  # ⚠️ 重複実行の原因

# 結果: 同一ブランチで2回実行
# 1. push時に実行
# 2. PR作成時に再実行 → 無駄
```

### 実際の重複例 (PR #60)
```
✗ test: update screen tests to match UI (push)      - 2m7s
✗ test: fix screen tests to match implementation (push) - 54s  
✗ Fix screen tests (pull_request)                      - 1m4s
```

## 🎯 最適化戦略

### Strategy 1: 条件分岐による重複排除
```yaml
name: RN Comprehensive Testing
on:
  push:
    branches: [main]  # mainブランチのみ
  pull_request:
    branches: [main]  # PRはmainに対してのみ
```

### Strategy 2: フルテスト vs 軽量テスト分離
```yaml
# 新ファイル: .github/workflows/quick-check.yml
name: Quick Check
on: [push]
jobs:
  quick-check:
    runs-on: ubuntu-latest
    steps:
      - name: TypeScript Check
      - name: ESLint Check

# 修正: .github/workflows/test.yml  
name: Full Testing
on:
  pull_request:
    branches: [main]
jobs:
  comprehensive-test:
    # 全テストスイート実行
```

### Strategy 3: Max Pro統合最適化
```yaml
name: Optimized CI/CD
on:
  pull_request:
    branches: [main]
jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - name: TypeScript + ESLint
      - name: Unit Tests Only
      - name: Coverage Gate (80%+)
      
  # final-quality-checkは削除
  # 重複jobは統合
```

## 🚀 実装プラン

### Phase 1: 即座修正 (今日)
1. `test.yml`のトリガー条件修正
2. 重複job削除
3. 軽量化実行

### Phase 2: 戦略的最適化 (明日)
1. ワークフロー分離
2. 条件分岐追加
3. 実行時間短縮

### Phase 3: Max Pro統合 (来週)
1. Claude CLI主導開発
2. GitHub Actions最小化
3. 手動品質保証

## 📊 効果予測

### 現在の無駄
- 重複実行: 100%
- 平均実行時間: 4-6分 × 2回 = 8-12分
- リソース消費: 2倍

### 最適化後
- 重複排除: 50%時間短縮
- 条件分岐: さらに30%削減
- 合計効果: 65%効率向上

## 🔧 具体的修正内容

### test.yml 修正案
```yaml
name: RN Comprehensive Testing
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

jobs:
  # quality-check + unit-tests + coverage を統合
  comprehensive-check:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with: 
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit
      
      - name: All Quality Checks
        run: |
          npm run typecheck
          npm run lint
          npm run test:unit
          npm run test:screens
          
  # final-quality-check削除 (重複のため)
```

### 新規: quick-check.yml
```yaml
name: Quick Check
on:
  push:
    branches-ignore: [main]

jobs:
  quick-lint:
    runs-on: ubuntu-latest
    timeout-minutes: 3
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: 
          node-version: 20
          cache: 'npm'
      - run: npm ci --prefer-offline --no-audit
      - run: npm run typecheck && npm run lint
```

## 🎯 期待効果

1. **実行時間**: 8-12分 → 3-5分 (60%短縮)
2. **リソース効率**: 2倍消費 → 適正利用
3. **開発速度**: フィードバック高速化
4. **コスト削減**: GitHub Actions課金削減

---

**優先度**: Critical
**実装時間**: 30分
**効果**: 即座に60%効率向上