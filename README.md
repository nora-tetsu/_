## Definition

モジュール類の作成・管理

## Contents

### Deno

ライブラリを利用したコード

### JavaScript

JavaScript本来の仕組みで作ったコード

### Python

## Task & History

- 2025/03/27 README.md整備
- [x] 2025/03/27 Deno/Dynalist/file.ts 新たに保守しやすいclassを定義する
- [x] 2025/03/29 deno.jsoncのimport map適用
- [x] 2025/03/29 JavaScript/web.ts DOMに関わらないコードを他のファイルに移動 
- [x] 2025/03/30 各モジュールからDenoオブジェクトを除去
- [x] 2025/03/30 DenoフォルダはDenoオブジェクトを使うもののみにし、他のモジュールはJavaScriptフォルダに移動
- [x] 2025/03/30 アプリケーションのデータのparse用モジュールを作成（CatMemoNote、XTMemo）
- [x] 2025/03/31 サブディレクトリを含めたファイルデータ取得を関数化（Deno/file.ts作成）
- [x] 2025/03/31 階層付きテキスト×Markdown形式のparseを実装
- [x] 2025/03/31 import map廃止　モジュール内でやるとimport先で依存関係を取得できないため
