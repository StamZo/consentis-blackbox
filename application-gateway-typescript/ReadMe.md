Hyperledger Fabric version Version: v2.5.0
Commit SHA: bd8e248
OS/Arch: linux/amd64


# Get the install script:
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh

# Pull the Docker containers and clone the samples repo
./install-fabric.sh

# Fabric Contract APIs and Application APIs
npm install --save fabric-contract-api

npm install --save fabric-shim

# Change directory to fabric-samples/test-network
112801707$ cd fabric-samples/test-network

# Stop the network
112801707/fabric-samples/test-network $ ./network.sh down

# Start the network and create a channel named "mychannel"
112801707/fabric-samples/test-network$ ./network.sh up createChannel -c mychannel -ca

# Deploy chaincode named "basic" using the TypeScript chaincode located in "../asset-transfer-basic/chaincode-typescript/"
112801707/fabric-samples/test-network$ ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-typescript/ -ccl typescript

# Set environment variables for organization 1
112801707/fabric-samples/test-network$ export PATH=${PWD}/../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/org1.example.com/

# Modify the identity of "user1" in organization 1 with a new secret and attributes
112801707/fabric-samples/test-network$ fabric-ca-client identity modify user1 --id.secret user1pw --attrs newAttributeName=newAttributeValue:ecert --tls.certfiles "${PWD}/organizations/fabric-ca/org1/tls-cert.pem"

# Enroll "user1" in organization 1
112801707/fabric-samples/test-network$ fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca-org1 -M ${PWD}/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/org1/tls-cert.pem

# Set environment variables for organization 2
112801707/fabric-samples/test-network$ export PATH=${PWD}/../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/org2.example.com/

# Modify the identity of "user1" in organization 2 with a new secret and attributes
112801707/fabric-samples/test-network$ fabric-ca-client identity modify user1 --id.secret user1pw --attrs newAttributeName=newAttributeValue:ecert --tls.certfiles "${PWD}/organizations/fabric-ca/org2/tls-cert.pem"

# Modify the identity of "user1" in organization 2 with a new attribute
112801707/fabric-samples/test-network$ fabric-ca-client identity modify user1 --id.secret user1pw --attrs allowedOrgs=attributeValueForAccess:ecert --tls.certfiles "${PWD}/organizations/fabric-ca/org2/tls-cert.pem"

# Enroll "user1" in organization 2
112801707/fabric-samples/test-network$ fabric-ca-client enroll -u https://user1:user1pw@localhost:8054 --caname ca-org2 -M ${PWD}/organizations/peerOrganizations/org2.example.com/users/User1@org2.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/org2/tls-cert.pem

# Change directory to "addOrg3"
112801707/fabric-samples/test-network$ cd addOrg3

# Bring up "addOrg3" organization in the network for channel "mychannel"
112801707/fabric-samples/test-network/addOrg3$ ./addOrg3.sh up -c mychannel -ca

# Go back to the previous directory
112801707/fabric-samples/test-network/addOrg3$ cd ../

# Set environment variables for organization 3
112801707/fabric-samples/test-network$ export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
export CORE_PEER_ADDRESS=localhost:11051

#IMPORTANT to have the package.json with the chaincode for the packaging
# Package the chaincode named "basic" in a tar.gz file
112801707/fabric-samples/test-network$ peer lifecycle chaincode package basic.tar.gz --path ../asset-transfer-basic/chaincode-typescript/ --lang node --label basic_1.0

# Install the chaincode package on the peer
112801707/fabric-samples/test-network$ peer lifecycle chaincode install basic.tar.gz

# Query installed chaincodes on the peer
112801707/fabric-samples/test-network$ peer lifecycle chaincode queryinstalled

# Set the package ID for the installed chaincode
112801707/fabric-samples/test-network$ export CC_PACKAGE_ID=basic_1.0:83570be73b1087a10be153fb8037f7420fccde7153b7b0ea848eb1e505f343bf

# Approve the chaincode definition for organization 1
112801707/fabric-samples/test-network$ peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --channelID mychannel --name basic --version 1.0 --package-id $CC_PACKAGE_ID --sequence 1

# Query the committed chaincode definition on the channel
112801707/fabric-samples/test-network$ peer lifecycle chaincode querycommitted --channelID mychannel --name basic

# Set environment variables for organization 3
112801707/fabric-samples/test-network$ export PATH=${PWD}/../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/org3.example.com/

# Modify the identity of "user1" in organization 3 with a new secret and attributes
112801707/fabric-samples/test-network$ fabric-ca-client identity modify user1 --id.secret user1pw --attrs newAttributeName=newAttributeValue:ecert --tls.certfiles "${PWD}/addOrg3/fabric-ca/org3/tls-cert.pem"

# Enroll "user1" in organization 3
112801707/fabric-samples/test-network$ fabric-ca-client enroll -u https://user1:user1pw@localhost:11054 --caname ca-org3 -M ${PWD}/organizations/peerOrganizations/org3.example.com/users/User1@org3.example.com/msp --tls.certfiles ${PWD}/addOrg3/fabric-ca/org3/tls-cert.pem

# Install the required dependencies for the TypeScript application gateway
112801707/fabric-samples/asset-transfer-basic/application-gateway-typescript$ npm install

# Start the TypeScript application gateway
112801707/fabric-samples/asset-transfer-basic/application-gateway-typescript$ npm start


# if there is a problem with connecting from an org try reenrolling with the correct environmental variables 