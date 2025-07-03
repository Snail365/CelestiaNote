# CelestiaNote
### SnailPop

## 概要
CelestiaNoteは、Three.jsとTextAlive APIを活用したインタラクティブな星空体験型音楽ビジュアライザーです。
マジカルミライ2025プログラミングコンテスト応募作品として制作しました。

## 特徴
- WASD or 十字キーで水平移動、マウス左ボタンのクリック＆ドラッグで視点の移動が可能。
- Three.jsによるリアルタイムな星空のレンダリング
- TextAlive API連携による歌詞同期表示(単純なフォントではなく、星たちが
集まってできるような演出)
- CSSRendererを用いた、宙に浮いているような誘導用UIや曲選択UIの実装
- GSAPによる滑らかなカメラアニメーション

## 技術スタック
- JavaScript (ES6 Modules)  
- Three.js (3D描画)  
- TextAlive API (歌詞同期再生)  
- GSAP (アニメーション)  
- Webpack (バンドル、ビルド)  
- CSS3DRenderer (3D空間にHTML/CSSを配置)

## 動作環境
- Chrome推奨 その他ブラウザは動作未確認
- Node.Js 何以上かまだ調べてない

## インストールと起動
githubからダウンロードなどする
CelestiaNoteディレクトリ内でコマンドプロンプトを開く
npm run build
num start

### 開発サーバ用
webpack.config.js内の
devtool: false,　をコメントアウト
mode: 'production', を'development'に書き換え

## ファイル構成
・ src/ -- ソースコード(JavaScript, CSS, HTMLテンプレート)
・ dist/ -- ビルド成果物(航海用ファイル)
・ webpack.config.js -- ビルド設定
・ package.json -- 依存設定とスクリプト

## ライセンス
何書けばいいか分からない

## お問い合わせ
・ GitHub Issues
・ (メール mygmail@gmail.com)か(X(旧Twitter) myXaca)

