import { Gateway, Wallets } from "fabric-network";
import path from "path";
import { buildCCP } from "./AppUtil";

const ORG = Number(process.env.FABRIC_SYSTEM_ORG || "1");

// IMPORTANT: use process.cwd() so it works after TS build
const WALLET_DIR =
  process.env.FABRIC_SYSTEM_WALLET_DIR ||
  path.resolve(__dirname, "wallet", `org${ORG}`);


const IDENTITY = process.env.FABRIC_SYSTEM_IDENTITY || "User1@org1";


const CHANNEL = process.env.FABRIC_CHANNEL || "mychannel";
const CHAINCODE = process.env.FABRIC_CHAINCODE || "basic";

async function getContract() {
  const ccp = buildCCP(ORG);
  const wallet = await Wallets.newFileSystemWallet(WALLET_DIR);

  const gw = new Gateway();
  await gw.connect(ccp, {
    wallet,
    identity: IDENTITY,
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gw.getNetwork(CHANNEL);
  const contract = network.getContract(CHAINCODE);
  return { gw, contract };
}

export async function readDIDkeyFromFabricSystem(did: string): Promise<any> {
  const { gw, contract } = await getContract();
  try {
    const buf = await contract.evaluateTransaction("readDIDkey", did);
    const txt = buf.toString("utf8");
    try { return JSON.parse(txt); } catch { return { raw: txt }; }
  } finally {
    gw.disconnect();
  }
}
