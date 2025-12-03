# SparksApp

SparksApp is a mobile application featuring a collection of micro-experiences ("sparks") - interactive, vibe-coded experiences like spin the wheel, flashcards, and business simulations. Built with React Native and Expo, it offers a modular platform for small, engaging utilities.

![SparksApp Banner](https://via.placeholder.com/800x200?text=SparksApp)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Expo SDK 52](https://img.shields.io/badge/Expo%20SDK-52-blue)](https://expo.dev/)

## Features

*   **Modular "Sparks"**: 24+ independent micro-apps across multiple categories:
    *   **Productivity**: Todo List, Packing List, Minute Minder, Trip Survey, Coming Up
    *   **Education**: Spanish Flashcards, Spanish Friend (Amigo), Spanish Reader
    *   **Media**: Toview (movies/books/shows), Short Saver (YouTube), Song Saver (Spotify), Sound Board
    *   **Golf**: Golf Brain, Tee Time Timer, Golf Wisdom
    *   **Health**: FoodCam, Weight Tracker, Final Clock
    *   **Utility**: Decision Spinner, Quick Convert, CardScore, Share Sparks
    *   **Travel**: TripStory
    *   **Games**: Business Simulator, Buzzy Bingo
    *   **Community**: Spark Wizard (submit your own ideas)
*   **Marketplace**: Browse and manage your collection of Sparks.
*   **Theming**: Full dark/light mode support across all sparks.
*   **Persistence**: Data saved locally via AsyncStorage.
*   **Settings System**: Comprehensive settings for each spark with feedback integration.
*   **Cross-platform**: iOS, Android, and Web support via Expo.

## Getting Started

### Prerequisites

*   Node.js (v18+)
*   npm or yarn
*   Expo Go app on your mobile device (optional, for testing)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/dyor/SparksApp.git
    cd SparksApp
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   Open `.env` and fill in your Firebase configuration keys. You will need to create a Firebase project and enable Firestore and Authentication (Anonymous).

4.  **Start the app**
    ```bash
    npx expo start
    ```
    *   Scan the QR code with Expo Go (Android) or the Camera app (iOS).
    *   Press `w` to run in the web browser.

## Project Structure

*   `src/sparks/`: Individual Spark implementations.
*   `src/components/`: Shared UI components.
*   `src/services/`: Shared services (Firebase, Analytics).
*   `src/screens/`: Main app screens (My Sparks, Marketplace).
*   `src/types/`: TypeScript definitions.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and suggest improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
