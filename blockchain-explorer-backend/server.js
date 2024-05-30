const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");
const prisma = require("./database");

const app = express();
app.use(cors());

const STARKNET_API = "https://free-rpc.nethermind.io/mainnet-juno";

const saveBlockAndTransactions = async (block) => {
  const blockNumber = String(block.block_number);
  const blockStatus = block.status;
  const transactions = block.transactions.map((tx) => ({
    txHash: tx.transaction_hash,
    blockNumber: blockNumber,
    txType: tx.type,
    status: blockStatus,
  }));
  try {
    await prisma.block.create({
      data: {
        blockNumber: blockNumber,
        timestamp: new Date(block.timestamp * 1000),
      },
    });
    await prisma.transaction.createMany({
      data: transactions,
    });
  } catch (error) {
    console.error("Error saving block and transactions:", error);
    return;
  }
};

const fetchLatestBlockNumber = async () => {
  try {
    const response = await axios.post(STARKNET_API, {
      jsonrpc: "2.0",
      method: "starknet_blockNumber",
      params: [],
      id: 1,
    });
    return response.data.result;
  } catch (error) {
    console.error("Error fetching latest block number", error);
    return;
  }
};

const fetchBlockWithTxs = async (blockNumber) => {
  try {
    const response = await axios.post(STARKNET_API, {
      jsonrpc: "2.0",
      method: "starknet_getBlockWithTxs",
      params: [{ block_number: blockNumber }],
      id: 1,
    });
    return response.data.result;
  } catch (error) {
    console.error("Error fetching the block with block Number:", error);
    return;
  }
};

const pollNewBlocks = async () => {
  try {
    const latestBlockNumber = await fetchLatestBlockNumber();
    const startBlock = latestBlockNumber - 10;
    for (let i = startBlock; i <= latestBlockNumber; i++) {
      const block = await fetchBlockWithTxs(i);
      await saveBlockAndTransactions(block);
    }
  } catch (e) {
    console.error("Error while polling new block", e.message);
  }
};

//shedular for getting new blocks
// cron.schedule("*/30 * * * * *", pollNewBlocks);

app.get("/api/transactions", async (req, res) => {
  const { page = 1, filter } = req.query;
  const limit = 20;
  const offset = (page - 1) * limit;
  const where = filter ? { txType: filter } : {};
  const transactions = await prisma.transaction.findMany({
    where,
    skip: offset,
    take: limit,
    orderBy: {
      id: "desc",
    },
    include: {
      block: true 
    }
  });
  
  const response = transactions.map(tx => ({
    ...tx,
    timestamp: tx.block.timestamp
  }));

  return res.json(response);


});

app.listen(8000, () => {
  console.log("Server running on port 8000");
});
