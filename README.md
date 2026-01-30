# OKX Wallet Integration Portfolio

A premium, modern Web3 dashboard demonstrating OKX Wallet integration with Ethereum and other EVM-compatible networks. Built with TypeScript, Vite, and Vanilla CSS.

## Features

- **Wallet Connection**: Seamlessly connect to your OKX Wallet.
- **Network Management**: Switch between Ethereum, Sepolia, and other EVM networks without page reloads.
- **Transaction Handling**: Send test transactions and view transaction hashes.
- **Message Signing**: Cryptographically sign messages (personal_sign).
- **Persistent State**: Automatically detects connected accounts on page load.
- **Modern UI**: Dark mode, glassmorphism, animated backgrounds, and responsive design.
- **Toast Notifications**: Interactive feedback for all user actions.

## Tech Stack

- **Frontend**: HTML5, Vanilla CSS
- **Logic**: TypeScript
- **Tooling**: Vite
- **Deployment**: Vercel Ready

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [OKX Wallet Extension](https://www.okx.com/web3) installed in your browser.

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Deployment

This project is configured for easy deployment on **Vercel**. Simply push your code to a GitHub repository and import it into Vercel. Vite will handle the build automatically.

## Bug Fixes

- Fixed a reload loop in the network switching logic.
- Improved wallet connection persistence.
- Converted the codebase to TypeScript for better reliability.

## License

MIT
