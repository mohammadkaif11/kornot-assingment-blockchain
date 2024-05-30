import axios from "axios";
const STARKNET_RPC_URL = "https://free-rpc.nethermind.io/mainnet-juno";

export const fetchTransactionDetails = async (txHash: any) => {
  try {
    const response = await axios.post(
      STARKNET_RPC_URL,
      {
        jsonrpc: "2.0",
        method: "starknet_getTransactionReceipt",
        params: [txHash],
        id: 1,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("response.data.result", response.data.result);
    return response.data.result;
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    throw error;
  }
};

export const fetchBlockDetails = async (blockNumber: number) => {
  const response = await axios.post(
    STARKNET_RPC_URL,
    {
      jsonrpc: "2.0",
      method: "starknet_getBlockWithTxs",
      params: [
        {
          block_number: blockNumber,
        },
      ],
      id: 1,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.result;
};
