export interface JsonTransactionResponse {
    jsonrpc: string;
    result: Transaction;
    id: number;
}

export interface Transaction {
    type: string;
    transaction_hash: string;
    actual_fee: ActualFee;
    execution_status: string;
    finality_status: string;
    block_hash: string;
    block_number: number;
    messages_sent: any[]; // Assuming it's an array, otherwise adjust the type accordingly
    events: Event[];
    execution_resources: ExecutionResources;
}

interface ActualFee {
    amount: string;
    unit: string;
}

interface Event {
    from_address: string;
    keys: string[];
    data: string[];
}

interface ExecutionResources {
    steps: number;
    pedersen_builtin_applications: number;
    range_check_builtin_applications: number;
    ec_op_builtin_applications: number;
    data_availability: DataAvailability;
}

interface DataAvailability {
    l1_gas: number;
    l1_data_gas: number;
}



export interface Block {
    status: string;
    block_hash: string;
    parent_hash: string;
    block_number: number;
    new_root: string;
    timestamp: number;
    sequencer_address: string;
    l1_gas_price: GasPrice;
    l1_data_gas_price: GasPrice;
    l1_da_mode: string;
    starknet_version: string;
    transactions: BlockTransaction[];
}

interface GasPrice {
    price_in_fri: string;
    price_in_wei: string;
}

interface BlockTransaction {
    transaction_hash: string;
    type: string;
    version: string;
    nonce: string;
    max_fee: string;
    sender_address: string;
    signature: string[];
    calldata: string[];
}
