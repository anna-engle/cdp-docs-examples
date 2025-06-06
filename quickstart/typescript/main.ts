import { CdpClient } from "@coinbase/cdp-sdk";
import { http, createPublicClient, parseEther } from "viem";
import { baseSepolia } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

// Load required secrets from environment
const { CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET } = process.env;

if (!CDP_API_KEY_ID || !CDP_API_KEY_SECRET || !CDP_WALLET_SECRET) {
  throw new Error("Missing one or more required environment variables.");
}

const cdp = await CdpClient.create({
  apiKeyId: CDP_API_KEY_ID,
  apiKeySecret: CDP_API_KEY_SECRET,
  walletSecret: CDP_WALLET_SECRET,
});

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Step 1: Create a new EVM account.
const account = await cdp.evm.createAccount();
console.log("✅ Created EVM account:", account.address);

// Step 2: Request ETH from the faucet.
const { transactionHash: faucetTransactionHash } = await cdp.evm.requestFaucet({
  address: account.address,
  network: "base-sepolia",
  token: "eth",
});

await publicClient.waitForTransactionReceipt({ hash: faucetTransactionHash });
console.log("🚰 Requested testnet ETH:", faucetTransactionHash);

// Step 3: Send a transaction.
const { transactionHash } = await cdp.evm.sendTransaction({
  address: account.address,
  transaction: {
    to: "0x0000000000000000000000000000000000000000",
    value: parseEther("0.000001"),
  },
  network: "base-sepolia",
});

await publicClient.waitForTransactionReceipt({ hash: transactionHash });
console.log(`📦 Transaction confirmed!`);
console.log(`🔗 https://sepolia.basescan.org/tx/${transactionHash}`);
