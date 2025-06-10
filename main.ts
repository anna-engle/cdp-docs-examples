#!/usr/bin/env node
import { http, createPublicClient, parseEther } from "viem";
import { baseSepolia } from "viem/chains";
import { CdpClient } from "@coinbase/cdp-sdk";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

// Prompt for secrets interactively
const rl = readline.createInterface({ input, output });

const CDP_API_KEY_ID = await rl.question("Enter CDP_API_KEY_ID (id from your Secret API key): ");
const CDP_API_KEY_SECRET = await rl.question("Enter CDP_API_KEY_SECRET: (privateKey from your Secret API key) ");
const CDP_WALLET_SECRET = await rl.question("Enter CDP_WALLET_SECRET: ");

rl.close();

// Validate input
if (!CDP_API_KEY_ID || !CDP_API_KEY_SECRET || !CDP_WALLET_SECRET) {
  throw new Error("❌ One or more secrets were not provided.");
}

// Initialize CDP client
const cdp = new CdpClient({
  apiKeyId: CDP_API_KEY_ID,
  apiKeySecret: CDP_API_KEY_SECRET,
  walletSecret: CDP_WALLET_SECRET,
});

// Create viem client
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Step 1: Create wallet
const account = await cdp.evm.createAccount();
console.log("✅ Created EVM account:", account.address);

// Step 2: Request testnet ETH
const { transactionHash: faucetTx } = await cdp.evm.requestFaucet({
  address: account.address,
  network: "base-sepolia",
  token: "eth",
});
await publicClient.waitForTransactionReceipt({ hash: faucetTx });
console.log("🚰 Received testnet ETH:", faucetTx);

// Step 3: Send transaction
const { transactionHash } = await cdp.evm.sendTransaction({
  address: account.address,
  network: "base-sepolia",
  transaction: {
    to: "0x0000000000000000000000000000000000000000",
    value: parseEther("0.000001"),
  },
});
await publicClient.waitForTransactionReceipt({ hash: transactionHash });
console.log(`📦 TX confirmed: https://sepolia.basescan.org/tx/${transactionHash}`);
