// Type definitions for OKX Wallet
interface EthereumRequest {
    method: string;
    params?: any[];
}

interface OKXWallet {
    request(args: EthereumRequest): Promise<any>;
    on(event: string, callback: (...args: any[]) => void): void;
    chainId?: string;
}

declare global {
    interface Window {
        okxwallet: OKXWallet;
    }
}

// Ensure this file is treated as a module
export { };

const okxwallet = window.okxwallet;

// Toast Notification System
function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? 'fa-check-circle' :
        type === 'error' ? 'fa-exclamation-circle' :
            type === 'warning' ? 'fa-exclamation-triangle' :
                'fa-info-circle';

    toast.innerHTML = `
                <i class="fas ${icon}"></i>
                <span>${message}</span>
            `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Copy to Clipboard Function
function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

// Update UI State
function updateConnectionStatus(connected: boolean, account: string | null = null) {
    const statusDot = document.getElementById('walletStatusDot');
    const statusText = document.getElementById('walletStatus');
    const networkBadge = document.getElementById('networkBadge');
    const copyBtn = document.getElementById('copyAccountBtn');

    if (!statusDot || !statusText || !networkBadge || !copyBtn) return;

    if (connected) {
        statusDot.className = 'status-dot connected';
        statusText.textContent = 'Wallet Connected';
        networkBadge.style.display = 'inline-flex';
        if (account) {
            copyBtn.style.display = 'block';
        }
    } else {
        statusDot.className = 'status-dot disconnected';
        statusText.textContent = 'Wallet Not Connected';
        networkBadge.style.display = 'none';
        copyBtn.style.display = 'none';
    }
}

// Check if OKX wallet is installed
function checkWallet() {
    if (typeof window.okxwallet !== "undefined") {
        console.log("OKX wallet is installed");
        showToast('OKX Wallet detected!', 'success');
        return true;
    } else {
        showToast('OKX Wallet not found. Please install it.', 'error');
        return false;
    }
}

let accounts: string[] = [];

// Initialize
window.addEventListener('load', async () => {
    if (!checkWallet()) return;

    try {
        const chainId = await okxwallet.request({ method: 'eth_chainId' });
        console.log("Chain ID:", chainId);
        const chainIdEl = document.querySelector('.chainId');
        if (chainIdEl) chainIdEl.textContent = chainId;

        const networkName = getNetworkName(chainId);
        const networkNameEl = document.getElementById('networkName');
        if (networkNameEl) networkNameEl.textContent = networkName;

        okxwallet.on('chainChanged', handleChainChanged);
        okxwallet.on('accountsChanged', handleAccountsChanged);

        // Initial check for connected accounts
        const existingAccounts = await okxwallet.request({ method: 'eth_accounts' });
        if (existingAccounts && existingAccounts.length > 0) {
            handleAccountsChanged(existingAccounts);
        }
    } catch (error) {
        console.error("Error during initialization:", error);
    }
});

function getNetworkName(chainId: string) {
    const networks: Record<string, string> = {
        '0x1': 'Ethereum Mainnet',
        '0x42': 'Optimism Kovan',
        '0xaa36a7': 'Sepolia',
        '0x5': 'Goerli',
        '0x89': 'Polygon'
    };
    return networks[chainId] || `Chain ${chainId}`;
}

function handleChainChanged(chainId: string) {
    console.log("New chain ID:", chainId);
    const chainIdEl = document.querySelector('.chainId');
    if (chainIdEl) chainIdEl.textContent = chainId;

    const networkName = getNetworkName(chainId);
    const networkNameEl = document.getElementById('networkName');
    if (networkNameEl) networkNameEl.textContent = networkName;

    showToast(`Switched to ${networkName}`, 'info');
}

function handleAccountsChanged(newAccounts: string[]) {
    console.log('Account changed:', newAccounts);
    accounts = newAccounts;

    const accountDisplay = document.querySelector('.account');
    if (!accountDisplay) return;

    if (newAccounts.length > 0) {
        const account = newAccounts[0];
        const shortAccount = `${account.substring(0, 6)}...${account.substring(38)}`;
        accountDisplay.textContent = shortAccount;
        accountDisplay.parentElement?.classList.add('has-content');
        updateConnectionStatus(true, account);
        showToast('Account changed', 'info');
    } else {
        accountDisplay.textContent = 'No account connected';
        accountDisplay.parentElement?.classList.remove('has-content');
        updateConnectionStatus(false);
        showToast('Wallet disconnected', 'info');
    }
}

// UI Selectors
const connectButton = document.querySelector('.connectEthereumButton') as HTMLButtonElement;
const switchButton = document.querySelector('.switchChainButton') as HTMLButtonElement;
const signTxButton = document.querySelector('.signTransactionButton') as HTMLButtonElement;
const signMsgButton = document.querySelector('.signMessageButton') as HTMLButtonElement;

// Connect to Ethereum
connectButton?.addEventListener('click', async () => {
    try {
        connectButton.innerHTML = '<span class="spinner"></span> Connecting...';
        connectButton.disabled = true;

        accounts = await okxwallet.request({ method: 'eth_requestAccounts' });
        handleAccountsChanged(accounts);

        showToast('Wallet connected successfully!', 'success');
        connectButton.innerHTML = '<i class="fas fa-check"></i> Connected';
        setTimeout(() => {
            connectButton.innerHTML = '<i class="fas fa-plug"></i> Connect to Ethereum';
            connectButton.disabled = false;
        }, 2000);
    } catch (error) {
        console.error("Connection error:", error);
        showToast('Failed to connect wallet', 'error');
        connectButton.disabled = false;
        connectButton.innerHTML = '<i class="fas fa-plug"></i> Connect to Ethereum';
    }
});

// Switch chain network
switchButton?.addEventListener('click', async () => {
    try {
        switchButton.innerHTML = '<span class="spinner"></span> Switching...';
        switchButton.disabled = true;

        const currentChainId = await okxwallet.request({ method: 'eth_chainId' });
        const targetChainId = currentChainId === "0x42" ? "0xaa36a7" : "0x42";

        await okxwallet.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: targetChainId }]
        });

    } catch (switchError: any) {
        if (switchError.code === 4902) {
            showToast('Network not added to wallet', 'warning');
        } else {
            console.error("Switch error:", switchError);
            showToast('Failed to switch network', 'error');
        }
    } finally {
        switchButton.disabled = false;
        switchButton.innerHTML = '<i class="fas fa-random"></i> Switch Network';
    }
});

// Send transaction
signTxButton?.addEventListener('click', async () => {
    if (accounts.length === 0) {
        showToast('Please connect your wallet first', 'error');
        return;
    }

    try {
        signTxButton.innerHTML = '<span class="spinner"></span> Sending...';
        signTxButton.disabled = true;

        const txHash = await okxwallet.request({
            method: 'eth_sendTransaction',
            params: [{
                from: accounts[0],
                to: '0x5CB8896Db7Bf13DE6A6EA362866288e577e4F6C5',
                value: '0x1BC16D674EC80000',
                gasPrice: '0x09184e72a000',
                gas: '0x2710',
            }],
        });

        console.log("Transaction hash:", txHash);
        const shortTxHash = `${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}`;
        const txHashEl = document.querySelector('.txHash');
        if (txHashEl) {
            txHashEl.textContent = shortTxHash;
            txHashEl.parentElement?.classList.add('has-content');
        }
        const copyTxBtn = document.getElementById('copyTxBtn');
        if (copyTxBtn) copyTxBtn.style.display = 'block';

        showToast('Transaction sent successfully!', 'success');
        signTxButton.innerHTML = '<i class="fas fa-check"></i> Sent';
        setTimeout(() => {
            signTxButton.innerHTML = '<i class="fas fa-arrow-right"></i> Send Transaction';
            signTxButton.disabled = false;
        }, 2000);
    } catch (error) {
        console.error("Transaction error:", error);
        showToast('Transaction failed', 'error');
        signTxButton.disabled = false;
        signTxButton.innerHTML = '<i class="fas fa-arrow-right"></i> Send Transaction';
    }
});

// Sign message
signMsgButton?.addEventListener('click', async () => {
    if (accounts.length === 0) {
        showToast('Please connect your wallet first', 'error');
        return;
    }

    try {
        signMsgButton.innerHTML = '<span class="spinner"></span> Signing...';
        signMsgButton.disabled = true;

        const signature = await okxwallet.request({
            method: 'personal_sign',
            params: [accounts[0], "0xdeadbeaf"],
        });

        console.log("Signature:", signature);
        const shortSig = `${signature.substring(0, 10)}...${signature.substring(signature.length - 8)}`;
        const sigMsgEl = document.querySelector('.sigMsg');
        if (sigMsgEl) {
            sigMsgEl.textContent = shortSig;
            sigMsgEl.parentElement?.classList.add('has-content');
        }
        const copySigBtn = document.getElementById('copySigBtn');
        if (copySigBtn) copySigBtn.style.display = 'block';

        showToast('Message signed successfully!', 'success');
        signMsgButton.innerHTML = '<i class="fas fa-check"></i> Signed';
        setTimeout(() => {
            signMsgButton.innerHTML = '<i class="fas fa-pen-fancy"></i> Sign Message';
            signMsgButton.disabled = false;
        }, 2000);
    } catch (error) {
        console.error("Signing error:", error);
        showToast('Signing failed', 'error');
        signMsgButton.disabled = false;
        signMsgButton.innerHTML = '<i class="fas fa-pen-fancy"></i> Sign Message';
    }
});

// Copy button event listeners
document.getElementById('copyAccountBtn')?.addEventListener('click', () => {
    if (accounts.length > 0) copyToClipboard(accounts[0]);
});

document.getElementById('copyTxBtn')?.addEventListener('click', () => {
    const txHash = document.querySelector('.txHash')?.textContent;
    if (txHash && txHash !== 'No transaction yet') copyToClipboard(txHash);
});

document.getElementById('copySigBtn')?.addEventListener('click', () => {
    const signature = document.querySelector('.sigMsg')?.textContent;
    if (signature && signature !== 'No signature yet') copyToClipboard(signature);
});
