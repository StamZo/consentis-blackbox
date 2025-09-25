/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Wallet, Wallets } from 'fabric-network';
import * as fs from 'fs';
import * as path from 'path';

const buildCCP = (orgNumber: number): Record<string, any> => {
    // Construct the path to the common connection configuration file dynamically
    const ccpPath = path.resolve(
        __dirname, '..', '..', '..', 'test-network',
        'organizations', 'peerOrganizations', `org${orgNumber}.example.com`, `connection-org${orgNumber}.json`
    );

    const fileExists = fs.existsSync(ccpPath);
    if (!fileExists) {
        throw new Error(`no such file or directory: ${ccpPath}`);
    }

    const contents = fs.readFileSync(ccpPath, 'utf8');

    // Build a JSON object from the file contents
    const ccp = JSON.parse(contents);

    console.log(`Loaded the network configuration located at ${ccpPath}`);
    return ccp;
};

const buildWallet = async (walletPath: string): Promise<Wallet> => {
    // Create a new wallet: Note that wallet is for managing identities.
    let wallet: Wallet;
    if (walletPath) {
        wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Built a file system wallet at ${walletPath}`);
    } else {
        wallet = await Wallets.newInMemoryWallet();
        console.log('Built an in-memory wallet');
    }

    return wallet;
};

const prettyJSONString = (inputString: string): string => {
    if (inputString) {
         return JSON.stringify(JSON.parse(inputString), null, 2);
    } else {
         return inputString;
    }
};

export {
    buildCCP,
    buildWallet,
    prettyJSONString,
};