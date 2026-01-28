// Toast Notification System
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? 'fa-check-circle' :
        type === 'error' ? 'fa-exclamation-circle' :
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
function copyToClipboard(text, buttonId) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

// Update UI State
function updateConnectionStatus(connected, account = null) {
    const statusDot = document.getElementById('walletStatusDot');
    const statusText = document.getElementById('walletStatus');
    const networkBadge = document.getElementById('networkBadge');
    const copyBtn = document.getElementById('copyAccountBtn');

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
if (typeof window.okxwallet !== "undefined") {
    console.log("OKX wallet is installed");
    showToast('OKX Wallet detected!', 'success');
} else {
    showToast('OKX Wallet not found. Please install it.', 'error');
}

// Connect to Ethereum
const connectEthereumButton = document.querySelector('.connectEthereumButton');
const switchChainButton = document.querySelector('.switchChainButton');
const signTransactionButton = document.querySelector('.signTransactionButton');
const signMessageButton = document.querySelector('.signMessageButton');

let accounts = [];

// Step 1: Create a connection
connectEthereumButton.addEventListener('click', async () => {
    try {
        const originalText = connectEthereumButton.innerHTML;
        connectEthereumButton.innerHTML = '<span class="spinner"></span> Connecting...';
        connectEthereumButton.disabled = true;

        accounts = await okxwallet.request({ method: 'eth_requestAccounts' });
        console.log("Accounts:", accounts);

        const accountDisplay = document.querySelector('.account');
        const shortAccount = `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
        accountDisplay.textContent = shortAccount;
        accountDisplay.parentElement.classList.add('has-content');

        updateConnectionStatus(true, accounts[0]);
        showToast('Wallet connected successfully!', 'success');

        connectEthereumButton.innerHTML = '<i class="fas fa-check"></i> Connected';
        setTimeout(() => {
            connectEthereumButton.innerHTML = originalText;
            connectEthereumButton.disabled = false;
        }, 2000);
    } catch (error) {
        console.error("Connection error:", error);
        showToast('Failed to connect wallet', 'error');
        connectEthereumButton.disabled = false;
        connectEthereumButton.innerHTML = '<i class="fas fa-plug"></i> Connect to Ethereum';
    }
});

// Step 2: Listen to account changes
okxwallet.on('accountsChanged', (newAccounts) => {
    console.log('Account changed:', newAccounts);
    accounts = newAccounts;

    if (newAccounts.length > 0) {
        const shortAccount = `${newAccounts[0].substring(0, 6)}...${newAccounts[0].substring(38)}`;
        document.querySelector('.account').textContent = shortAccount;
        updateConnectionStatus(true, newAccounts[0]);
        showToast('Account changed', 'info');
    } else {
        document.querySelector('.account').textContent = 'No account connected';
        updateConnectionStatus(false);
        showToast('Wallet disconnected', 'info');
    }
});

// Step 3: Monitor blockchain network
window.addEventListener('load', async () => {
    try {
        const chainId = await okxwallet.request({ method: 'eth_chainId' });
        console.log("Chain ID:", chainId);
        document.querySelector('.chainId').textContent = chainId;

        const networkName = getNetworkName(chainId);
        document.getElementById('networkName').textContent = networkName;

        okxwallet.on('chainChanged', handleChainChanged);
    } catch (error) {
        console.error("Error getting chain ID:", error);
    }
});

function getNetworkName(chainId) {
    const networks = {
        '0x1': 'Ethereum Mainnet',
        '0x42': 'Optimism Kovan',
        '0xaa36a7': 'Sepolia',
        '0x5': 'Goerli',
        '0x89': 'Polygon'
    };
    return networks[chainId] || `Chain ${chainId}`;
}

function handleChainChanged(chainId) {
    console.log("New chain ID:", chainId);
    document.querySelector('.chainId').textContent = chainId;

    const networkName = getNetworkName(chainId);
    document.getElementById('networkName').textContent = networkName;

    showToast(`Switched to ${networkName}`, 'info');
    window.location.reload();
}

// Step 4: Switch chain network
switchChainButton.addEventListener('click', async () => {
    try {
        const originalText = switchChainButton.innerHTML;
        switchChainButton.innerHTML = '<span class="spinner"></span> Switching...';
        switchChainButton.disabled = true;

        const chainId = okxwallet.chainId === "0x42" ? "0xaa36a7" : "0x42";

        await okxwallet.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainId }]
        });

        showToast('Network switched successfully!', 'success');
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await okxwallet.request({
                    method: "wallet_addEthereumChain",
                    params: [{ chainId: "0xf00", rpcUrl: "https://..." }]
                });
            } catch (addError) {
                console.error("Add chain error:", addError);
                showToast('Failed to add network', 'error');
            }
        } else {
            console.error("Switch error:", switchError);
            showToast('Failed to switch network', 'error');
        }
    } finally {
        switchChainButton.disabled = false;
        switchChainButton.innerHTML = '<i class="fas fa-random"></i> Switch Network';
    }
});

// Step 6: Send transaction
signTransactionButton.addEventListener('click', async () => {
    if (accounts.length === 0) {
        showToast('Please connect your wallet first', 'error');
        return;
    }

    try {
        const originalText = signTransactionButton.innerHTML;
        signTransactionButton.innerHTML = '<span class="spinner"></span> Sending...';
        signTransactionButton.disabled = true;

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
        document.querySelector('.txHash').textContent = shortTxHash;
        document.querySelector('.txHash').parentElement.classList.add('has-content');
        document.getElementById('copyTxBtn').style.display = 'block';

        showToast('Transaction sent successfully!', 'success');
        signTransactionButton.innerHTML = '<i class="fas fa-check"></i> Sent';
        setTimeout(() => {
            signTransactionButton.innerHTML = originalText;
            signTransactionButton.disabled = false;
        }, 2000);
    } catch (error) {
        console.error("Transaction error:", error);
        showToast('Transaction failed', 'error');
        signTransactionButton.disabled = false;
        signTransactionButton.innerHTML = '<i class="fas fa-arrow-right"></i> Send Transaction';
    }
});

// Step 7: Sign message
signMessageButton.addEventListener('click', async () => {
    if (accounts.length === 0) {
        showToast('Please connect your wallet first', 'error');
        return;
    }

    try {
        const originalText = signMessageButton.innerHTML;
        signMessageButton.innerHTML = '<span class="spinner"></span> Signing...';
        signMessageButton.disabled = true;

        const signature = await okxwallet.request({
            method: 'eth_sign',
            params: [accounts[0], "0xdeadbeaf"],
        });

        console.log("Signature:", signature);
        const shortSig = `${signature.substring(0, 10)}...${signature.substring(signature.length - 8)}`;
        document.querySelector('.sigMsg').textContent = shortSig;
        document.querySelector('.sigMsg').parentElement.classList.add('has-content');
        document.getElementById('copySigBtn').style.display = 'block';

        showToast('Message signed successfully!', 'success');
        signMessageButton.innerHTML = '<i class="fas fa-check"></i> Signed';
        setTimeout(() => {
            signMessageButton.innerHTML = originalText;
            signMessageButton.disabled = false;
        }, 2000);
    } catch (error) {
        console.error("Signing error:", error);
        showToast('Signing failed', 'error');
        signMessageButton.disabled = false;
        signMessageButton.innerHTML = '<i class="fas fa-pen-fancy"></i> Sign Message';
    }
});

// Copy button event listeners
document.getElementById('copyAccountBtn').addEventListener('click', () => {
    copyToClipboard(accounts[0], 'copyAccountBtn');
});

document.getElementById('copyTxBtn').addEventListener('click', () => {
    const txHash = document.querySelector('.txHash').textContent;
    copyToClipboard(txHash, 'copyTxBtn');
});

document.getElementById('copySigBtn').addEventListener('click', () => {
    const signature = document.querySelector('.sigMsg').textContent;
    copyToClipboard(signature, 'copySigBtn');
});