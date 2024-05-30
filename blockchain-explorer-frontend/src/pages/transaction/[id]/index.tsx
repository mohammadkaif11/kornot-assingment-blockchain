import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import Progress from "@/components/Progress";
import axios from "axios";
import { Transaction, Block } from "../../../../interface";
const STARKNET_RPC_URL = "https://free-rpc.nethermind.io/mainnet-juno";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

function Index() {
  const router = useRouter();
  const { id } = router.query;
  const [transaction, setTransaction] = useState<Transaction>();
  const [block, setBlock] = useState<Block>();
  const [ethPrice, setEthPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Details");
  const [calldataFormat, setCalldataFormat] = useState("Hex");
  const [formateType, setFormateType] = useState("Raw");

  useEffect(() => {
    if (id) {
      const getTransactionDetails = async () => {
        try {
          const txDetails = (await fetchTransactionDetails(id)) as Transaction;
          setTransaction(txDetails);
          const blockDetails = await fetchBlockDetails(txDetails?.block_number);
          setBlock(blockDetails);
          const ethPriceUsd = await fetchEthPrice();
          setEthPrice(ethPriceUsd);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching transaction details:", error);
          setLoading(false);
        }
      };

      getTransactionDetails();
    }
  }, [id]);

  const fetchTransactionDetails = async (txHash: any) => {
    try {
      const response = await axios.post(
        "https://free-rpc.nethermind.io/mainnet-juno",
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

  const fetchBlockDetails = async (blockNumber: number) => {
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

  const fetchEthPrice = async () => {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );
    return response.data.ethereum.usd;
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!transaction || !block) {
    return (
      <div className="container mx-auto px-4 py-8">Transaction not found.</div>
    );
  }

  //getting and setting
  let Postion = 0;
  const {
    transaction_hash,
    type,
    execution_status,
    finality_status,
    block_hash,
    block_number,
    actual_fee,
    execution_resources,
    events,
  } = transaction;
  const { timestamp, transactions } = block;
  const blockTransction = transactions.find((tx, index) => {
    if (tx.transaction_hash === transaction_hash) {
      Postion = index;
      return true;
    }
    return false;
  });
  const feeInEth = parseInt(actual_fee.amount, 16) / 1e18;
  const feeInUsd = feeInEth * ethPrice;
  const max_fee_eth = blockTransction?.max_fee
    ? parseInt(blockTransction?.max_fee, 16) / 1e18
    : 0;
  const max_fee_feeInUsd = max_fee_eth * ethPrice;
  const gasConsumed = feeInEth / parseInt(block.l1_gas_price.price_in_fri);
  const rawCalldata = transactions.find(
    (tx) => tx.transaction_hash === transaction_hash
  )?.calldata;

  const renderCalldata = () => {
    switch (calldataFormat) {
      case "Hex":
        return JSON.stringify(rawCalldata, null, 2);
      case "Dec":
        return rawCalldata?.map((val) => parseInt(val, 16)).toString();
      case "Text":
        return rawCalldata
          ?.map((val) => String.fromCharCode(parseInt(val, 16)))
          .join("");
      default:
        return JSON.stringify(rawCalldata, null, 2);
    }
  };

  return (
    <div className="py-10 bg-neutral-900">
      <div className="xl:w-8/12  xl:mb-0 px-4 mx-auto mt-24 relative flex flex-col min-w-0 break-words bg-neutral-800 w-full mb-6 shadow-lg rounded">
        <div className="px-4 sm:px-0">
          <h3 className="text-xl font-semibold leading-7 text-white my-8">
            Trasaction
          </h3>
          {/* HASH */}
          <div className="my-8">
            <p className="mt-1 max-w-2xl text-md font-bold leading-6 text-zinc-500">
              HASH
            </p>
            <p className="mt-1 max-w-2xl text-lg leading-6 text-white flex gap-2">
              {block_hash}{" "}
              <ClipboardDocumentListIcon className="text-zinc-500 ml-2 w-6 h-6" />
            </p>
          </div>
          {/* TYPE and TIMESTAMP */}
          <div className="flex md:flex-row flex-col">
            <div className="md:w-[25%] w-full">
              <p className="mt-1 text-md font-bold leading-6 text-zinc-500">
                TYPE
              </p>
              {type === "DEPLOY_ACCOUNT" ? (
                <span className="inline-flex items-center my-2 rounded-md bg-blue-800 px-2 py-1 text-xs font-medium text-blue-200 ring-1 ring-inset ring-blue-700/10">
                  {type}
                </span>
              ) : (
                <span className="inline-flex items-center my-2 rounded-md bg-green-800 px-2 py-1 text-xs font-medium text-green-200 ring-1 ring-inset ring-green-600/20">
                  {" "}
                  {type}
                </span>
              )}
            </div>
            <div className="md:w-[25%] w-full">
              <p className="mt-1 text-md font-bold leading-6 text-zinc-500">
                TIMESTAMP
              </p>
              <p className="mt-1 text-md font-bold leading-6 text-white">
                {new Date(timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {/* STATUS */}
          <div className="my-2">
            <p className="mt-1 max-w-2xl text-md font-bold leading-6 text-zinc-500">
              STATUS
            </p>
            <Progress status={finality_status} />
          </div>

          {/* TABs */}
          <div className="my-4">
            <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400">
              <li className="me-2">
                <button
                  onClick={() => setActiveTab("Details")}
                  aria-current="page"
                  className={`mr-4 ${
                    activeTab === "Details"
                      ? "inline-block p-4 rounded-t-lg text-gray-600 bg-gray-50"
                      : "inline-block p-4 rounded-t-lg text-gray-300"
                  }`}
                >
                  Overview
                </button>
              </li>
              <li className="me-2">
                <button
                  onClick={() => setActiveTab("Events")}
                  className={`mr-4 ${
                    activeTab === "Events"
                      ? "inline-block p-4 rounded-t-lg text-gray-600 bg-gray-50"
                      : "inline-block p-4 rounded-t-lg  text-gray-300"
                  }`}
                >
                  Event
                </button>
              </li>
            </ul>
          </div>
        </div>
        {activeTab === "Details" && (
          <>
            <div className="my-6">
              <dl>
                <h1 className="text-2xl font-semibold leading-7 text-white my-8">
                  Transaction Details
                </h1>
                <div className="flex gap-2 justify-between my-4">
                  <dt className="text-sm font-medium leading-6 text-white w-[20%] flex items-center gap-2">
                    <QuestionMarkCircleIcon className="h-4 w-4 " />
                    BLOCK NUMBER:
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-blue-500 w-[80%] sm:col-span-2 items-center sm:mt-0 border-b border-zinc-500">
                    {block_number}
                  </dd>
                </div>
                <div className="flex gap-2 justify-between my-4">
                  <dt className="text-sm font-medium leading-6 text-white w-[20%] flex  items-center  gap-2">
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                    TIMESTAMP:
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-white w-[80%] sm:col-span-2 items-center sm:mt-0 border-b border-zinc-500">
                    {timestamp}
                  </dd>
                </div>
                <div className="flex gap-2 justify-between my-4">
                  <dt className="text-sm font-medium leading-6 text-white w-[20%] items-center flex  gap-2">
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                    ACTUAL FEE:
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-white w-[80%] sm:col-span-2 items-center sm:mt-0 border-b border-zinc-500">
                    {feeInEth} <span className="text-blue-500">Ether</span> ($
                    {feeInUsd})
                  </dd>
                </div>

                <div className="flex gap-2 justify-between my-4">
                  <dt className="text-sm font-medium leading-6 text-white w-[20%] flex  items-center gap-2">
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                    MAX FEE:
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-white w-[80%] sm:col-span-2 sm:mt-0 border-b border-zinc-500">
                    {max_fee_eth} <span className="text-blue-500">Ether</span>{" "}
                    (${max_fee_feeInUsd})
                  </dd>
                </div>

                <div className="flex gap-2 justify-between my-4">
                  <dt className="text-sm font-medium leading-6 text-white w-[20%] flex items-center  gap-2">
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                    GAS CONSUMED:
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-white w-[80%] sm:col-span-2 sm:mt-0 border-b border-zinc-500">
                    {gasConsumed}
                  </dd>
                </div>
                <div className="flex gap-2 justify-between my-4">
                  <dt className="text-sm font-medium leading-6 text-white w-[20%] flex  items-center gap-2">
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                    SENDER ADDRESS:
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-blue-500 w-[80%] sm:col-span-2 sm:mt-0 border-b border-zinc-500 flex gap-2">
                    {blockTransction?.sender_address}{" "}
                    <ClipboardDocumentListIcon className="text-zinc-500 ml-2 w-4 h-4" />
                  </dd>
                </div>
              </dl>
            </div>
            <div className="my-6">
              <dl>
                <h1 className="text-2xl font-semibold leading-7 text-white my-8">
                  Developer Info
                </h1>
                <div className="flex gap-2 justify-between my-4">
                  <dt className="text-sm font-medium leading-6 text-white w-[20%] flex items-center  gap-2">
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                    UNIX TIMESTAMP:
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-white w-[80%] sm:col-span-2 sm:mt-0 border-b border-zinc-500 flex gap-2">
                    {timestamp}{" "}
                    <ClipboardDocumentListIcon className="text-zinc-500 ml-2 w-4 h-4" />
                  </dd>
                </div>
                <div className="flex gap-2 justify-between my-4">
                  <dt className="text-sm font-medium leading-6 text-white w-[20%] flex items-center  gap-2">
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                    NONCE:
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-white w-[80%] sm:col-span-2 sm:mt-0 border-b border-zinc-500">
                    {blockTransction?.nonce}
                  </dd>
                </div>
                <div className="flex gap-2 justify-between my-4">
                  <dt className="text-sm font-medium leading-6 text-white w-[20%] flex items-center gap-2">
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                    POSITION:
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-white w-[80%] sm:col-span-2 sm:mt-0 border-b border-zinc-500">
                    {Postion}
                  </dd>
                </div>

                <div className="flex gap-2 justify-between my-4">
                  <dt className="text-sm font-medium leading-6 text-white w-[20%] flex items-center  gap-2">
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                    VERSION:
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-white w-[80%] sm:col-span-2 sm:mt-0 border-b border-zinc-500">
                    {blockTransction?.version}
                  </dd>
                </div>

                <div className="flex gap-2 justify-between my-4">
                  <dt className="text-sm font-medium leading-6 text-white w-[20%] flex items-center  gap-2">
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                    EXECUTION RESOURCES:
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-white w-[80%] sm:col-span-2 sm:mt-0 border-b border-zinc-500">
                    <span className="inline-flex items-center my-2 rounded-md bg-green-900 px-2 py-1 text-xs font-medium text-green-200 ring-1 ring-inset ring-green-600/20">
                      {execution_resources?.steps} steps
                    </span>
                    <div className="flex  gap-3 my-2">
                      <span className="inline-flex items-center rounded-md bg-yellow-800 px-2 py-1 text-xs font-medium text-yellow-200 ring-1 ring-inset ring-yellow-600/20">
                        {execution_resources?.pedersen_builtin_applications}{" "}
                        PEDERSEN_BUILTIN
                      </span>
                      <span className="inline-flex items-center rounded-md bg-yellow-800 px-2 py-1 text-xs font-medium text-yellow-200 ring-1 ring-inset ring-yellow-600/20">
                        {execution_resources?.ec_op_builtin_applications}{" "}
                        RANGE_CHECK_BUILTIN
                      </span>
                      <span className="inline-flex items-center rounded-md bg-yellow-800 px-2 py-1 text-xs font-medium text-yellow-200 ring-1 ring-inset ring-yellow-600/20">
                        {execution_resources?.ec_op_builtin_applications}{" "}
                        EC_OP_BUILTIN
                      </span>
                    </div>
                  </dd>
                </div>
                <div className="flex gap-2 justify-between my-4">
                  <dt className="text-sm font-medium leading-6 text-white w-[20%] flex  items-center gap-2">
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                    CALLDATA:
                  </dt>
                  <div className="flex flex-col w-[80%] max-h-[200px] overflow-scroll gap-2">
                    <div className="flex gap-4">
                      <div
                        className="inline-flex rounded-md shadow-sm"
                        role="group my-4"
                      >
                        <button
                          onClick={() => setCalldataFormat("Hex")}
                          className={`mr-4 px-4 py-2 text-sm font-bold text-white  border-zinc-400 border-t border-b border-l border-r  hover:bg-zinc-700 ${
                            calldataFormat === "Hex" ? "bg-zinc-700" : ""
                          }`}
                        >
                          Hex
                        </button>
                        <button
                          onClick={() => setCalldataFormat("Dec")}
                          className={`mr-4 px-4 py-2 text-sm font-bold text-white  border-zinc-400 border-t border-b border-l border-r  hover:bg-zinc-700 ${
                            calldataFormat === "Dec" ? "bg-zinc-700" : ""
                          }`}
                        >
                          Dec
                        </button>
                        <button
                          onClick={() => setCalldataFormat("Text")}
                          className={`mr-4 px-4 py-2 text-sm font-bold text-white  border-zinc-400 border-t border-b border-l border-r  hover:bg-zinc-700 ${
                            calldataFormat === "Text" ? "bg-zinc-700" : ""
                          }`}
                        >
                          Text
                        </button>
                      </div>
                      <div
                        className="inline-flex rounded-md shadow-sm"
                        role="group my-4"
                      >
                        <button
                          className={`mr-4 px-4 py-2 text-sm font-bold text-white  border-zinc-400 border-t border-b border-l border-r  hover:bg-zinc-700 ${
                            formateType === "Decode" ? "bg-zinc-700" : ""
                          }`}
                          onClick={() => {
                            setFormateType("Decode");
                          }}
                        >
                          Decode
                        </button>
                        <button
                          onClick={() => {
                            setFormateType("Raw");
                          }}
                          className={`mr-4 px-4 py-2 text-sm font-bold text-white  border-zinc-400 border-t border-b border-l border-r  hover:bg-zinc-700 ${
                            formateType === "Raw" ? "bg-zinc-700" : ""
                          }`}
                        >
                          Raw
                        </button>
                      </div>
                    </div>

                    <pre className=" p-4 rounded text-gray-500">
                      {renderCalldata()}
                    </pre>
                  </div>
                </div>
                <div className="flex gap-2 justify-between my-4">
                  <dt className="text-sm font-medium leading-6 text-white w-[20%] flex  items-center gap-2">
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                    SIGNATURE(S):
                  </dt>
                  <div className="flex flex-col w-[80%] gap-2">
                    {blockTransction?.signature.map((signature) => {
                      return (
                        <dd
                          key={signature}
                          className="mt-1 text-sm leading-6 text-orange-400 w-[100%] sm:col-span-2 sm:mt-0 border-b border-zinc-500 flex justify-between"
                        >
                          {signature}{" "}
                          <ClipboardDocumentListIcon className="text-zinc-500 ml-2 w-4 h-4" />
                        </dd>
                      );
                    })}
                  </div>
                </div>
              </dl>
            </div>
          </>
        )}

        {activeTab === "Events" && (
          <>
            <table className="items-center bg-transparent w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-6 bg-blueGray-50 text-zinc-500	 align-middle border border-solid border-blueGray-100 py-3 text-sm uppercase border-l-0 border-r-0 whitespace-nowrap font-bold text-left">
                    ID
                  </th>
                  <th className="px-6 bg-blueGray-50 text-zinc-500 align-middle border border-solid border-blueGray-100 py-3 text-sm uppercase border-l-0 border-r-0 whitespace-nowrap font-bold text-left">
                    BLOCK
                  </th>
                  <th className="px-6 bg-blueGray-50 text-zinc-500 align-middle border border-solid border-blueGray-100 py-3 text-sm uppercase border-l-0 border-r-0 whitespace-nowrap font-bold text-left">
                    AGE
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={index} className="hover:bg-zinc-700">
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-md whitespace-nowrap p-4 text-sm text-blue-500">
                      {block_number}_{Postion}_{index}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-md whitespace-nowrap p-4 text-sm text-blue-500">
                      {block_number}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-md whitespace-nowrap p-4 text-sm text-white">
                      {new Date(timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default Index;
