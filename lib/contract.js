import { MongoClient } from "mongodb";
import 'dotenv/config';

export async function getContractDetails(contract_type) {
    
    var response;
    try {
        const filter = {
            contract_type : contract_type
        };
        const client = await MongoClient.connect(process.env.DB_URL);
        const db = await client.db(process.env.DB_NAME);
        const resp = await db.collection('contracts').findOne(filter);
        response = await resp;       
        client.close();
        if (response) return response;
    } catch (exc) {
      console.log(exc)
    }
  
    // return
  }