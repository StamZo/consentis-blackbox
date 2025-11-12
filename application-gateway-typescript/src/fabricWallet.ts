import { Wallets, Wallet, X509Identity } from 'fabric-network';
import * as fs from 'fs/promises';
import * as path from 'path';
import FabricCAServices from 'fabric-ca-client';
import { buildCCP } from './AppUtil';  // Adjust the import path as necessary

const walletBasePath = path.join(__dirname, 'wallet');
const adminUserId = 'admin';
const adminUserPasswd = adminUserId + 'pw';

export const buildCAClient = (FabricCAServices: any, ccp: any, caHostName: string) => {
    const caInfo = ccp.certificateAuthorities[caHostName];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
    console.log(`Built a CA Client named ${caInfo.caName}`);
    return caClient;
};

export const enrollAdmin = async (caClient: FabricCAServices, selectedPeer: string) => {
    try {
        const orgMspId = `Org${selectedPeer}MSP`;
        const orgWalletPath = path.join(walletBasePath, `org${selectedPeer}`);
        const wallet = await Wallets.newFileSystemWallet(orgWalletPath);

        const identity = await wallet.get(adminUserId);
        if (identity) {
            console.log('An identity for the admin user already exists in the wallet');
            return;
        }

        const enrollment = await caClient.enroll({ enrollmentID: adminUserId, enrollmentSecret: adminUserPasswd });
        const x509Identity: X509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: orgMspId,
            type: 'X.509',
        };
        await wallet.put(adminUserId, x509Identity);
        console.log('Successfully enrolled admin user and imported it into the wallet');
    } catch (error) {
        console.error(`Failed to enroll admin user: ${error}`);
        throw new Error(`Failed to enroll admin user: ${error}`);
    }
};


export async function setupWallet(selected_peer: string, username: string): Promise<Wallet> {
    try {
        const orgWalletPath = path.join(walletBasePath, `org${selected_peer}`);
        const wallet = await Wallets.newFileSystemWallet(orgWalletPath);
        console.log("Wallet path: ", orgWalletPath);

        const ccp = buildCCP(Number(selected_peer));

        // Use the username as provided by setupConnection
        const orgSuffix = `@org${selected_peer}`;
        const identityLabel = username === 'admin' ? 'admin' : `${username}${orgSuffix}`;

        // Check if identity exists in wallet
        let identity = await wallet.get(identityLabel);

        if (identity) {
            console.log(`Identity for ${identityLabel} already exists in the wallet`);
            return wallet;
        }

        // If identity does not exist, proceed with enrollment
        const caClient = buildCAClient(FabricCAServices, ccp, `ca.org${selected_peer}.example.com`);

        if (username === 'admin') {
            await enrollAdmin(caClient, selected_peer);
        } else {
            // Correct path construction
            const cryptoPath = path.resolve(__dirname, '..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', `org${selected_peer}.example.com`);
            const adjustedUsername = `${username}${orgSuffix}`;
            const userPath = path.resolve(cryptoPath, 'users', `${adjustedUsername}.example.com`);
            const keyDirectoryPath = path.resolve(userPath, 'msp', 'keystore');
            const certPath = path.resolve(userPath, 'msp', 'signcerts', 'cert.pem');

            // Check if key directory exists
            try {
                const keyFiles = await fs.readdir(keyDirectoryPath);
                if (keyFiles.length === 0) {
                    throw new Error(`No files found in key directory: ${keyDirectoryPath}`);
                }
                const keyPath = path.join(keyDirectoryPath, keyFiles[0]);

                const certificate = await fs.readFile(certPath, 'utf8');
                const privateKey = await fs.readFile(keyPath, 'utf8');

                const identityData: X509Identity = {
                    credentials: { certificate, privateKey },
                    mspId: `Org${selected_peer}MSP`,
                    type: 'X.509',
                };

                await wallet.put(identityLabel, identityData);
                console.log(`Identity for ${identityLabel} added to wallet`);
            } catch (err) {
                console.error(`Failed to read keys or certificate for ${adjustedUsername}:`, err);
                throw new Error(`Error setting up wallet: ${err.message}`);
            }
        }

        const addedIdentity = await wallet.get(identityLabel);
        if (addedIdentity) {
            console.log(`Verified that identity for ${identityLabel} exists in the wallet`);
        } else {
            console.error(`Failed to verify identity for ${identityLabel} in the wallet`);
        }

        return wallet;
    } catch (error) {
        console.error("Error setting up wallet: ", error);
        throw new Error(`Error setting up wallet: ${error.message}`);
    }
}


export async function addIdentity(caClient: FabricCAServices, selectedPeer: string, userId: string): Promise<void> {
    const orgWalletPath = path.join(walletBasePath, `org${selectedPeer}`);
    let wallet = await Wallets.newFileSystemWallet(orgWalletPath);

    const userIdLower = userId.toLowerCase();
    const orgMspId = `Org${selectedPeer}MSP`;

    try {
        const userIdentity = await wallet.get(userIdLower);
        if (userIdentity) {
            console.log(`An identity for the user ${userIdLower} already exists in the wallet. Re-enrolling...`);

            const adminIdentity = await wallet.get(adminUserId);
            if (!adminIdentity) {
                console.log(`An identity for the admin user does not exist in the wallet. Enrolling admin...`);
                const ccp = buildCCP(Number(selectedPeer));
                const caClient = buildCAClient(FabricCAServices, ccp, `ca.org${selectedPeer}.example.com`);
                await enrollAdmin(caClient, selectedPeer);
            }

            const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

            const enrollment = await caClient.reenroll(adminUser, []);

            const x509Identity: X509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: orgMspId,
                type: 'X.509',
            };

            await wallet.put(userIdLower, x509Identity);
            console.log(`Successfully re-enrolled user ${userIdLower} and imported it into the wallet`);
            return;
        }

        let adminIdentity = await wallet.get(adminUserId);
        if (!adminIdentity) {
            console.log(`An identity for the admin user does not exist in the wallet. Enrolling admin...`);
            const ccp = buildCCP(Number(selectedPeer));
            const caClient = buildCAClient(FabricCAServices, ccp, `ca.org${selectedPeer}.example.com`);
            await enrollAdmin(caClient, selectedPeer);
            adminIdentity = await wallet.get(adminUserId);
        }

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

        const secret = await caClient.register({
            affiliation: `org${selectedPeer}.department1`,
            enrollmentID: userIdLower,
            role: 'client',
        }, adminUser);

        const enrollment = await caClient.enroll({
            enrollmentID: userIdLower,
            enrollmentSecret: secret,
        });

        const x509Identity: X509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: orgMspId,
            type: 'X.509',
        };

        await wallet.put(userIdLower, x509Identity);
        console.log(`Successfully enrolled user ${userIdLower} and imported it into the wallet`);
    } catch (error) {
        console.error(`Failed to register or re-enroll user ${userIdLower}: ${error}`);
        throw error;
    }
}

export async function removeIdentity(caClient: FabricCAServices, userId: string, selectedPeer: string): Promise<void> {
    const orgWalletPath = path.join(walletBasePath, `org${selectedPeer}`);
    let wallet = await Wallets.newFileSystemWallet(orgWalletPath);

    const userIdLower = userId.toLowerCase();
    try {
        const userIdentity = await wallet.get(userIdLower);
        if (!userIdentity) {
            console.log(`No identity for the user ${userIdLower} exists in the wallet`);
            return;
        }

        const adminIdentity = await wallet.get(adminUserId);
        if (!adminIdentity) {
            console.log(`An identity for the admin user does not exist in the wallet`);
            console.log('Enroll the admin user before retrying');
            return;
        }

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

        await caClient.revoke({ enrollmentID: userIdLower }, adminUser);
        console.log(`Successfully revoked user ${userIdLower}`);

        await wallet.remove(userIdLower); // Ensure the identity is removed from the wallet
        console.log(`Successfully removed identity for user ${userIdLower} from the wallet`);

        const mspDir = path.join(process.cwd(), 'test-network', 'organizations', 'peerOrganizations', `org${selectedPeer}.example.com`, 'users', `${userIdLower}@org${selectedPeer}.example.com`);
        await fs.rm(mspDir, { recursive: true, force: true });
        console.log(`Successfully removed MSP directory for user ${userIdLower}`);
    } catch (error) {
        console.error(`Failed to remove identity for user ${userIdLower}: ${error}`);
    }
}

export async function listIdentities(selectedPeer: string): Promise<string[]> {
    const orgWalletPath = path.join(walletBasePath, `org${selectedPeer}`);
    const wallet = await Wallets.newFileSystemWallet(orgWalletPath);

    try {
        const identities = await wallet.list();
        return identities;
    } catch (error) {
        console.error(`Failed to list identities: ${error}`);
        throw error;
    }
}