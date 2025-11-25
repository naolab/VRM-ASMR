# VRM Soundscape

VRM Soundscape is a web-based VRM viewer application that focuses on immersive spatial audio experiences. It features a 3D character that reacts to audio with lip-sync and realistic eye contact, creating a sense of presence.

## Features

- **VRM Model Viewer**: Load and display VRM 1.0/0.0 models.
- **Spatial Audio**: 3D audio positioning based on the relative position of the character and the microphone (camera).
- **Lip Sync**: Real-time lip synchronization based on audio input.
- **Interactive Gaze**:
  - **Auto LookAt**: The character's eyes automatically track the camera or the microphone.
  - **Auto Blink**: Natural blinking animations.
- **Camera Follow**: Toggleable camera tracking to keep the character in view.
- **Audio Visualization**: A 3D microphone model represents the audio listener's position.
- **Custom Audio**: Upload your own audio files or use the provided sample.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **3D Library**: [Three.js](https://threejs.org/)
- **React Integration**: [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber), [@react-three/drei](https://github.com/pmndrs/drei)
- **VRM Loader**: [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/naolab/vrm-soundscape.git
   cd vrm-soundscape
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

## License

ISC