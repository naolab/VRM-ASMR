# VRM Soundscape

VRM Soundscapeは、没入感のある立体音響体験に焦点を当てたWebベースのVRMビューアーアプリケーションです。
3Dキャラクターが音声に合わせてリップシンクし、リアルなアイコンタクトを行うことで、まるでそこにいるかのような実在感を生み出します。

## 特徴

- **VRMモデルビューアー**: VRM 1.0/0.0 モデルの読み込みと表示に対応。
- **立体音響 (Spatial Audio)**: キャラクターとマイク（カメラ）の相対位置に基づいた3Dオーディオポジショニング。
- **リップシンク**: 音声入力に基づいたリアルタイムな口パク生成。
- **インタラクティブな視線制御**:
  - **自動追従 (Auto LookAt)**: キャラクターの目がカメラやマイクを自動的に追従。
  - **自動瞬き (Auto Blink)**: 自然な瞬きアニメーション。
- **カメラ追従**: キャラクターを常に視界に収めるカメラ追従モード（切り替え可能）。
- **オーディオ可視化**: 聴取位置（リスナー）を表す3Dマイクモデルの表示。
- **カスタムオーディオ**: 任意の音声ファイルのアップロード、またはサンプル音声の再生。

## 技術スタック

- **フレームワーク**: [Next.js](https://nextjs.org/) (App Router)
- **言語**: [TypeScript](https://www.typescriptlang.org/)
- **3Dライブラリ**: [Three.js](https://threejs.org/)
- **React連携**: [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber), [@react-three/drei](https://github.com/pmndrs/drei)
- **VRMローダー**: [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)

## 始め方

### 前提条件

- Node.js (v18以降推奨)
- npm または yarn

### インストール

1. リポジトリをクローンします:
   ```bash
   git clone https://github.com/naolab/vrm-soundscape.git
   cd vrm-soundscape
   ```

2. 依存関係をインストールします:
   ```bash
   npm install
   # または
   yarn install
   ```

3. 開発サーバーを起動します:
   ```bash
   npm run dev
   # または
   yarn dev
   ```

4. ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## クレジット

デフォルトVRMモデル（Noa.vrm）は、VRoid Studio のサンプルモデル（AvatarSample_O）の髪型を使用し、その他の部分を改変して作成されたものです。

- ベースモデル: VRoid Studio サンプルモデル (AvatarSample_O)
- 改変・作成: naolab

## ライセンス

ISC