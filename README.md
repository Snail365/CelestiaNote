# CelestiaNote -セレスティアノート-
### by SnailPop


## 概要

**CelestiaNote -セレスティアノート-**は、Three.jsとTextAlive APIを活用したインタラクティブな星空体験型音楽ビジュアライザーです。
ユーザーの視線の先に広がる歌詞と、それらが変化して生まれる星座が、夜空の幻想的な空間を描き出します。
本作品は**マジカルミライ2025 プログラミングコンテスト**応募作品として制作しました。

## 特徴

- **視点操作・移動：** WASD/十字キーで移動、マウス左クリック＆ドラッグで視点の回転
- **星空のレンダリング：** Three.jsによるリアルタイムな星空描画
- **歌詞の星化演出：** TextAlive APIによって同期された歌詞が、星の集まりとして現れる演出
- **UI表現：** CSSRendererを用いた、空中に浮かぶUIの実装（曲選択・誘導表示）
- **アニメーション演出：** GSAPによるカメラや星の動きの滑らかなアニメーション

## 使用技術

- JavaScript (ES6 Modules)  
- Three.js：3Dシーンの構築・レンダリング
- TextAlive API：歌詞データと音楽再生の制御
- GSAP：アニメーション制御
- Webpack：モジュールバンドル・ビルド管理 
- CSS3DRenderer：HTMLベースのUIを3D空間に配置

## 動作環境

- GPUによるWebGLレンダリングが可能な環境
- Google Chrome（最新版推奨）
- Node.Js v16以上（推奨）

## インストールと起動

### 1.リポジトリをクローンまたはZIPでダウンロード
```sh
git clone https://github.com/yourname/CelestiaNote.git
cd CelestiaNote
```

### 2.依存パッケージのインストール
```sh
npm install
```

### 3.ビルド
```sh
npm run build
```

### 4.本番用ローカルサーバ起動（別途 serve 等が必要）
```sh
npx serve dist
```

### 開発用に起動する場合

webpack.config.js の以下の設定を編集

```sh
// devtool: false,
mode: 'development'
```

その後、npm run build → npx serve dist で確認可能

## ファイル内容

- src/ -- ソースコード(JavaScript, CSS, HTMLテンプレート、モデルなど)
- dist/ -- ビルド成果物（デプロイ用）
- webpack.config.js -- Webpack設定
- package.json -- 依存管理とスクリプト

## ライセンス

使用ライブラリ（Three.js, TextAlive APIなど）は各ライセンスに準拠

