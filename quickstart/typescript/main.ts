#!/usr/bin/env node
import { CdpClient } from "@coinbase/cdp-sdk";
import { http, createPublicClient, parseEther } from "viem";
import { baseSepolia } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

const { CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET } = process.env;
if (!CDP_API_KEY_ID || !CDP_API_KEY_SECRET || !CDP_WALLET_SECRET) {
  throw new Error("❌ Missing one or more secrets in .env file");
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

const account = await cdp.evm.createAccount();
console.log("✅ Created EVM account:", account.address);

const { transactionHash: faucetTx } = await cdp.evm.requestFaucet({
  address: account.address,
  network: "base-sepolia",
  token: "eth",
});
await publicClient.waitForTransactionReceipt({ hash: faucetTx });
console.log("🚰 Received testnet ETH:", faucetTx);

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
