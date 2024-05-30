import { Inter } from "next/font/google";
import { useEffect, useState } from "react";
import axios from "axios";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { Block, Transaction } from "../../interface";
import {
  fetchBlockDetails,
  fetchTransactionDetails,
} from "@/utils/helpersFunctions";

interface TransactionInterface {
  id: number;
  txHash: string;
  blockNumber: string;
  txType: string;
  status: string;
  blockId: number;
  timestamp: string;
}

export default function Home() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionInterface[]>();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/api/transactions?page=${page}&filter=${filter}`
      );
      setTransactions((prev) => [...(prev || []), ...(response.data || [])]);
      setLoading(false);
    };

    loadTransactions();
  }, [page, filter]);

  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1);
    setTransactions([]);
  };

  const redirectToTransactions = async (hash: string) => {
    const transaction = (await fetchTransactionDetails(
      hash
    )) as unknown as Transaction;
    const block = (await fetchBlockDetails(
      transaction?.block_number
    )) as unknown as Block;
    const blockTransction = block.transactions.find(
      (tx) => tx.transaction_hash === hash
    );
    
    console.log(transaction.type)
    console.log(transaction.execution_status)
    console.log(blockTransction?.version)
    if (
      transaction.type !== "INVOKE" ||
      transaction.execution_status !== "SUCCEEDED" ||
      blockTransction?.version === "1"
    ) {
      return;
    }

    router.push(`/transaction/${hash}`);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  //Update transactions array
  const updateTransaction = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/transactions?page=${page}&filter=${filter}`
      );
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  //Use Effect
  useEffect(() => {
    const intervalId = setInterval(async () => {
      setPage(1); // Reset page to 1 before fetching
      setFilter(""); // Reset filter to an empty string before fetching
      await updateTransaction();
    }, 30000); // Fetch new transactions every 30 seconds
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="py-1 bg-neutral-900">
      <div className="w-full xl:w-8/12 mb-12 xl:mb-0 px-4 mx-auto mt-24">
        <div className="relative flex flex-col min-w-0 break-words bg-neutral-800 w-full mb-6 shadow-lg rounded">
          <div className="rounded-t mb-0 px-4 py-3 border-0 flex flex-col gap-4 pl-8 pr-8">
            <div className="flex flex-wrap items-center my-4">
              <div className="relative w-full max-w-full flex-grow flex-1 my-2">
                <h3 className="font-semibold text-2xl text-white ">
                  Transactions
                </h3>
                <p className="font-semibold text-sm my-2 text-zinc-500">
                  A list of transactions on Starknet
                </p>
              </div>
            </div>
            <div className="inline-flex rounded-md shadow-sm" role="group my-4">
              <button
                type="button"
                onClick={() => handleFilterChange("")}
                className="px-4 py-2 text-sm font-bold text-white  border-zinc-400 border-t border-b border-l border-r  hover:bg-zinc-700"
              >
                ALL
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange("declare")}
                className="px-4 py-2 text-sm font-bold text-white  border-zinc-400 border-t border-b border-l border-r hover:bg-zinc-700"
              >
                Declare
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange("deploy")}
                className="px-4 py-2 text-sm font-bold text-white  border-zinc-400 border-t border-b border-l border-r hover:bg-zinc-700 "
              >
                Deploy
              </button>
            </div>
          </div>
          <div className="block w-full  overflow-x-auto pl-8 pr-8">
            <div className={loading ? "blur-sm" : ""}>
              <table className="items-center  w-full min-h-[100vh]">
                <thead>
                  <tr>
                    <th className="px-6 bg-blueGray-50 text-zinc-500 font-bold	 align-middle border border-solid border-blueGray-100 py-3 text-sm uppercase border-l-0 border-r-0 whitespace-nowrap  text-left">
                      Status
                    </th>
                    <th className="px-6 bg-blueGray-50 text-zinc-500 align-middle border border-solid border-blueGray-100 py-3 text-sm uppercase border-l-0 border-r-0 whitespace-nowrap font-bold text-left">
                      Hash
                    </th>
                    <th className="px-6 bg-blueGray-50 text-zinc-500 align-middle border border-solid border-blueGray-100 py-3 text-sm uppercase border-l-0 border-r-0 whitespace-nowrap font-bold text-left">
                      Type
                    </th>
                    <th className="px-6 bg-blueGray-50 text-zinc-500 align-middle border border-solid border-blueGray-100 py-3 text-sm uppercase border-l-0 border-r-0 whitespace-nowrap font-bold text-left">
                      Block
                    </th>
                    <th className="px-6 bg-blueGray-50 text-zinc-500 align-middle border border-solid border-blueGray-100 py-3 text-sm uppercase border-l-0 border-r-0 whitespace-nowrap font-bold text-left">
                      Age
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions?.map((tx) => (
                    <tr key={tx?.txHash} className="hover:bg-neutral-700 border-b  border-zinc-500">
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-sm whitespace-nowrap p-4 text-blueGray-700 text-white">
                        {tx?.status}
                      </td>

                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-sm whitespace-nowrap p-4">
                        <div className="flex items-center">
                          <button
                            onClick={() => {
                              redirectToTransactions(tx?.txHash);
                            }}
                          >
                            <span className="text-blue-500 hover:underline">
                              {tx?.txHash.substring(0, 10)}...
                            </span>
                          </button>

                          <ClipboardDocumentListIcon className="text-zinc-500 ml-2 w-4 h-4" />
                        </div>
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-sm whitespace-nowrap p-4">
                        {tx?.txType === "DEPLOY_ACCOUNT" ? (
                          <span className="inline-flex items-center rounded-md bg-blue-900 px-2 py-1 text-xs font-medium text-blue-200 ring-1 ring-inset ring-blue-700/10">
                            {tx?.txType}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-green-900 px-2 py-1 text-xs font-medium text-green-200 ring-1 ring-inset ring-green-600/20">
                            {" "}
                            {tx?.txType}
                          </span>
                        )}
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-sm whitespace-nowrap p-4 text-white">
                        {tx?.blockNumber}
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-sm whitespace-nowrap p-4 text-white">
                        {/* Calculate age from timestamp */}
                        {new Date(tx?.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {loading && (
              <p className="text-lg text-white text-center">Loading...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
