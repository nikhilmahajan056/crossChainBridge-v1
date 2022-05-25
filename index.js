import { getContractDetails } from "./lib/contract.js";
import { buyFunds } from "./lib/transfer.js";
import Web3 from 'web3';
import 'dotenv/config';

async function bridge() {
    const originWeb3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ETH_WEBSOCKET));
    const originContract = await getContractDetails("ethBank")
    const originAbi = await originContract.contract_abi;
    const originContract_address = await originContract.contract_address;
    const originSmartContract = new originWeb3.eth.Contract(originAbi, originContract_address);

    const destinationWeb3 = new Web3(new Web3.providers.WebsocketProvider(process.env.AVAX_WEBSOCKET));
    const destinationContract = await getContractDetails("avxBank")
    const destinationAbi = await destinationContract.contract_abi;
    const destinationContract_address = await destinationContract.contract_address;
    const destinationSmartContract = new destinationWeb3.eth.Contract(destinationAbi, destinationContract_address);

    let options = {};

    const handleEvent = async (params) => {
        try {
            const response = await buyFunds(params);
            if (!response.hash) throw new Error(response);
        } catch (error) {
            console.log("Reverting transaction! unexpected error occured:",error);
            params.output_token = params.output_token === "ETH" ? "AVAX" : "ETH";            
            await buyFunds(params);
        }
    };

    originSmartContract.events
    .Sold(options)
    .on('data', async (event) => {
        var params = {
            output_token : "AVAX",
            account_address : event.returnValues.account,
            amount : event.returnValues.amount
        };
        console.log("Sold event invoked in the originContract:", params);
        await handleEvent(params);
    })
    .on('error', (err) => {
      console.error('originContract Error: ', err)
    })
    console.log(`Waiting for Transfer events on ${originContract_address}`)

    destinationSmartContract.events
    .Sold(options)
    .on('data', async (event) => {
        var params = {
            output_token : "ETH",
            account_address : event.returnValues.account,
            amount : event.returnValues.amount
        };
        console.log("Sold event invoked in the destinationContract:", params);
        await handleEvent(params);
    })
    .on('error', (err) => {
      console.error('destinationContract Error: ', err)
    })
    console.log(`Waiting for Transfer events on ${destinationContract_address}`)
}

bridge();