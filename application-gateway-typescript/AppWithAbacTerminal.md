sudo chmod -R 777 . (for all)
sudo chmod -R 777 channel-artifacts
sudo chmod -R 777 organizations 
puzzle!fabric
unset

s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706$ cd fabric-samples/test-network   
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706$ ./network.sh down
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ ./network.sh up createChannel -c mychannel -ca    
Using docker and docker-compose                                                                                                                                                                                          
Creating channel 'mychannel'.                                                                                                                                                                                            
If network is not up, starting nodes with CLI timeout of '5' tries and CLI delay of '3' seconds and using database 'leveldb with crypto from 'Certificate Authorities'                                                   
Bringing up network                                                                                                                                                                                                      
LOCAL_VERSION=2.4.7                                                                                                                                                                                                      
DOCKER_IMAGE_VERSION=2.4.7                                                                                                                                                                                               
CA_LOCAL_VERSION=1.5.5                                                                                                                                                                                                   
CA_DOCKER_IMAGE_VERSION=1.5.5                                                                                                                                                                                            
Generating certificates using Fabric CA                                                                                                                                                                                  
[+] Running 4/4                                                                                                                                                                                                          
 ⠿ Network fabric_test   Created                                                                                                                                                                                    0.0s 
 ⠿ Container ca_orderer  Started                                                                                                                                                                                    0.8s 
 ⠿ Container ca_org2     Started                                                                                                                                                                                    1.0s 
 ⠿ Container ca_org1     Started                                                                                                                                                                                    0.8s 
Creating Org1 Identities                                                                                                                                                                                                 
Enrolling the CA admin                                                                                                                                                                                                   
+ fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 --caname ca-org1 --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-ca/org1/ca-cert.pem   
2023/02/02 10:53:12 [INFO] Created a default configuration file at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/fabric-ca-client-config.ya
ml                                                                                                                                                                                                                       
2023/02/02 10:53:13 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:13 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                              
2023/02/02 10:53:13 [INFO] encoded CSR                                                                                                                                                                                   
2023/02/02 10:53:13 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/msp/signcerts/cert.pem               
2023/02/02 10:53:13 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/msp/cacerts/localhost-7054-ca-org1.p
em                                                                                                                                                                                                                       
2023/02/02 10:53:13 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/msp/IssuerPublicKey                   
2023/02/02 10:53:13 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/msp/IssuerRevocationPublicK
ey                                                                                                                                                                                                                       
Registering peer0                                                                                                                                                                                                        
+ fabric-ca-client register --caname ca-org1 --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-ca/org1/c
a-cert.pem                                                                                                                                                                                                               
2023/02/02 10:53:13 [INFO] Configuration file location: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/fabric-ca-client-config.yaml         
2023/02/02 10:53:13 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:13 [INFO] TLS Enabled                                                                                                                                                                                   
Password: peer0pw                                                                                                                                                                                                        
Registering user                                                                                                                                                                                                         
+ fabric-ca-client register --caname ca-org1 --id.name user1 --id.secret user1pw --id.type client --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-ca/org1
/ca-cert.pem                                                                                                                                                                                                             
2023/02/02 10:53:14 [INFO] Configuration file location: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/fabric-ca-client-config.yaml         
2023/02/02 10:53:14 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:14 [INFO] TLS Enabled                                                                                                                                                                                   
Password: user1pw                                                                                                                                                                                                        
Registering the org admin                                                                                                                                                                                                
+ fabric-ca-client register --caname ca-org1 --id.name org1admin --id.secret org1adminpw --id.type admin --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-
ca/org1/ca-cert.pem                                                                                                                                                                                                      
2023/02/02 10:53:14 [INFO] Configuration file location: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/fabric-ca-client-config.yaml         
2023/02/02 10:53:14 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:14 [INFO] TLS Enabled                                                                                                                                                                                   
Password: org1adminpw                                                                                                                                                                                                    
Generating the peer0 msp                                                                                                                                                                                                 
+ fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-org1 -M /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/p
eer0.org1.example.com/msp --csr.hosts peer0.org1.example.com --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-ca/org1/ca-cert.pem                         
2023/02/02 10:53:15 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:15 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                              
2023/02/02 10:53:15 [INFO] encoded CSR                                                                                                                                                                                   
2023/02/02 10:53:15 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/sign
certs/cert.pem                                                                                                                                                                                                           
2023/02/02 10:53:15 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/cac
erts/localhost-7054-ca-org1.pem                                                                                                                                                                                          
2023/02/02 10:53:15 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/Issue
rPublicKey                                                                                                                                                                                                               
2023/02/02 10:53:15 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.co
m/msp/IssuerRevocationPublicKey                                                                                                                                                                                          
Generating the peer0-tls certificates                                                                                                                                                                                    
+ fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-org1 -M /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/p
eer0.org1.example.com/tls --enrollment.profile tls --csr.hosts peer0.org1.example.com --csr.hosts localhost --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabr
ic-ca/org1/ca-cert.pem                                                                                                                                                                                                   
2023/02/02 10:53:16 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:16 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                              
2023/02/02 10:53:16 [INFO] encoded CSR                                                                                                                                                                                   
2023/02/02 10:53:16 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/sign
certs/cert.pem                                                                                                                                                                                                           
2023/02/02 10:53:16 [INFO] Stored TLS root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls
/tlscacerts/tls-localhost-7054-ca-org1.pem                                                                                                                                                                               
2023/02/02 10:53:16 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/Issue
rPublicKey                                                                                                                                                                                                               
2023/02/02 10:53:16 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.co
m/tls/IssuerRevocationPublicKey                                                                                                                                                                                          
Generating the user msp                                                                                                                                                                                                  
+ fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca-org1 -M /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/U
ser1@org1.example.com/msp --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-ca/org1/ca-cert.pem                                                            
2023/02/02 10:53:16 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:16 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                              
2023/02/02 10:53:16 [INFO] encoded CSR                                                                                                                                                                                   
2023/02/02 10:53:16 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/sign
certs/cert.pem                                                                                                                                                                                                           
2023/02/02 10:53:16 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/cac
erts/localhost-7054-ca-org1.pem                                                                                                                                                                                          
2023/02/02 10:53:16 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/Issue
rPublicKey                                                                                                                                                                                                               
2023/02/02 10:53:16 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.co
m/msp/IssuerRevocationPublicKey                                                                                                                                                                                          
Generating the org admin msp                                                                                                                                                                                             
+ fabric-ca-client enroll -u https://org1admin:org1adminpw@localhost:7054 --caname ca-org1 -M /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com
/users/Admin@org1.example.com/msp --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-ca/org1/ca-cert.pem                                                    
2023/02/02 10:53:17 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:17 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                              
2023/02/02 10:53:17 [INFO] encoded CSR                                                                                                                                                                                   
2023/02/02 10:53:17 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/sign
certs/cert.pem                                                                                                                                                                                                           
2023/02/02 10:53:17 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/cac
erts/localhost-7054-ca-org1.pem                                                                                                                                                                                          
2023/02/02 10:53:17 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/Issue
rPublicKey                                                                                                                                                                                                               
2023/02/02 10:53:17 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.co
m/msp/IssuerRevocationPublicKey                                                                                                                                                                                          
Creating Org2 Identities                                                                                                                                                                                                 
Enrolling the CA admin                                                                                                                                                                                                   
+ fabric-ca-client enroll -u https://admin:adminpw@localhost:8054 --caname ca-org2 --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-ca/org2/ca-cert.pem   
2023/02/02 10:53:18 [INFO] Created a default configuration file at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/fabric-ca-client-config.ya
ml                                                                                                                                                                                                                       
2023/02/02 10:53:18 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:18 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                              
2023/02/02 10:53:18 [INFO] encoded CSR                                                                                                                                                                                   
2023/02/02 10:53:18 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/msp/signcerts/cert.pem               
2023/02/02 10:53:18 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/msp/cacerts/localhost-8054-ca-org2.p
em                                                                                                                                                                                                                       
2023/02/02 10:53:18 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/msp/IssuerPublicKey                   
2023/02/02 10:53:18 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/msp/IssuerRevocationPublicK
ey                                                                                                                                                                                                                       
Registering peer0                                                                                                                                                                                                        
+ fabric-ca-client register --caname ca-org2 --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-ca/org2/c
a-cert.pem                                                                                                                                                                                                               
2023/02/02 10:53:18 [INFO] Configuration file location: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/fabric-ca-client-config.yaml         
2023/02/02 10:53:18 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:18 [INFO] TLS Enabled                                                                                                                                                                                   
Password: peer0pw                                                                                                                                                                                                        
Registering user                                                                                                                                                                                                         
+ fabric-ca-client register --caname ca-org2 --id.name user1 --id.secret user1pw --id.type client --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-ca/org2
/ca-cert.pem                                                                                                                                                                                                             
2023/02/02 10:53:19 [INFO] Configuration file location: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/fabric-ca-client-config.yaml         
2023/02/02 10:53:19 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:19 [INFO] TLS Enabled                                                                                                                                                                                   
Password: user1pw                                                                                                                                                                                                        
Registering the org admin                                                                                                                                                                                                
+ fabric-ca-client register --caname ca-org2 --id.name org2admin --id.secret org2adminpw --id.type admin --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-
ca/org2/ca-cert.pem                                                                                                                                                                                                      
2023/02/02 10:53:19 [INFO] Configuration file location: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/fabric-ca-client-config.yaml         
2023/02/02 10:53:19 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:19 [INFO] TLS Enabled                                                                                                                                                                                   
Password: org2adminpw                                                                                                                                                                                                    
Generating the peer0 msp                                                                                                                                                                                                 
+ fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca-org2 -M /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/p
eer0.org2.example.com/msp --csr.hosts peer0.org2.example.com --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-ca/org2/ca-cert.pem                         
2023/02/02 10:53:20 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:20 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                              
2023/02/02 10:53:20 [INFO] encoded CSR                                                                                                                                                                                   
2023/02/02 10:53:20 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/msp/sign
certs/cert.pem                                                                                                                                                                                                           
2023/02/02 10:53:20 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/msp/cac
erts/localhost-8054-ca-org2.pem                                                                                                                                                                                          
2023/02/02 10:53:20 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/msp/Issue
rPublicKey                                                                                                                                                                                                               
2023/02/02 10:53:20 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.co
m/msp/IssuerRevocationPublicKey                                                                                                                                                                                          
Generating the peer0-tls certificates                                                                                                                                                                                    
+ fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca-org2 -M /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/p
eer0.org2.example.com/tls --enrollment.profile tls --csr.hosts peer0.org2.example.com --csr.hosts localhost --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabr
ic-ca/org2/ca-cert.pem                                                                                                                                                                                                   
2023/02/02 10:53:21 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:21 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                              
2023/02/02 10:53:21 [INFO] encoded CSR                                                                                                                                                                                   
2023/02/02 10:53:21 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/sign
certs/cert.pem                                                                                                                                                                                                           
2023/02/02 10:53:21 [INFO] Stored TLS root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls
/tlscacerts/tls-localhost-8054-ca-org2.pem                                                                                                                                                                               
2023/02/02 10:53:21 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/Issue
rPublicKey                                                                                                                                                                                                               
2023/02/02 10:53:21 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.co
m/tls/IssuerRevocationPublicKey                                                                                                                                                                                          
Generating the user msp                                                                                                                                                                                                  
+ fabric-ca-client enroll -u https://user1:user1pw@localhost:8054 --caname ca-org2 -M /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/U
ser1@org2.example.com/msp --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-ca/org2/ca-cert.pem                                                            
2023/02/02 10:53:21 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:21 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                              
2023/02/02 10:53:21 [INFO] encoded CSR                                                                                                                                                                                   
2023/02/02 10:53:22 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/User1@org2.example.com/msp/sign
certs/cert.pem                                                                                                                                                                                                           
2023/02/02 10:53:22 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/User1@org2.example.com/msp/cac
erts/localhost-8054-ca-org2.pem                                                                                                                                                                                          
2023/02/02 10:53:22 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/User1@org2.example.com/msp/Issue
rPublicKey                                                                                                                                                                                                               
2023/02/02 10:53:22 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/User1@org2.example.co
m/msp/IssuerRevocationPublicKey                                                                                                                                                                                          
Generating the org admin msp                                                                                                                                                                                             
+ fabric-ca-client enroll -u https://org2admin:org2adminpw@localhost:8054 --caname ca-org2 -M /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com
/users/Admin@org2.example.com/msp --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-ca/org2/ca-cert.pem                                                    
2023/02/02 10:53:22 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:22 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                              
2023/02/02 10:53:22 [INFO] encoded CSR                                                                                                                                                                                   
2023/02/02 10:53:22 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/sign
certs/cert.pem                                                                                                                                                                                                           
2023/02/02 10:53:22 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/cac
erts/localhost-8054-ca-org2.pem                                                                                                                                                                                          
2023/02/02 10:53:22 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/Issue
rPublicKey                                                                                                                                                                                                               
2023/02/02 10:53:22 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.co
m/msp/IssuerRevocationPublicKey                                                                                                                                                                                          
Creating Orderer Org Identities                                                                                                                                                                                          
Enrolling the CA admin                                                                                                                                                                                                   
+ fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 --caname ca-orderer --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-ca/ordererOrg/ca-ce
rt.pem                                                                                                                                                                                                                   
2023/02/02 10:53:23 [INFO] Created a default configuration file at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/fabric-ca-client-config.yaml
2023/02/02 10:53:23 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:23 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                              
2023/02/02 10:53:23 [INFO] encoded CSR                                                                                                                                                                                   
2023/02/02 10:53:23 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/msp/signcerts/cert.pem                 
2023/02/02 10:53:23 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/msp/cacerts/localhost-9054-ca-orderer.
pem                                                                                                                                                                                                                      
2023/02/02 10:53:23 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/msp/IssuerPublicKey                     
2023/02/02 10:53:23 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/msp/IssuerRevocationPublicKey
Registering orderer                                                                                                                                                                                                      
+ fabric-ca-client register --caname ca-orderer --id.name orderer --id.secret ordererpw --id.type orderer --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric
-ca/ordererOrg/ca-cert.pem                                                                                                                                                                                               
2023/02/02 10:53:23 [INFO] Configuration file location: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/fabric-ca-client-config.yaml           
2023/02/02 10:53:23 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:23 [INFO] TLS Enabled                                                                                                                                                                                   
Password: ordererpw                                                                                                                                                                                                      
Registering the orderer admin                                                                                                                                                                                            
+ fabric-ca-client register --caname ca-orderer --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organization
s/fabric-ca/ordererOrg/ca-cert.pem                                                                                                                                                                                       
2023/02/02 10:53:24 [INFO] Configuration file location: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/fabric-ca-client-config.yaml           
2023/02/02 10:53:24 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:24 [INFO] TLS Enabled                                                                                                                                                                                   
Password: ordererAdminpw                                                                                                                                                                                                 
Generating the orderer msp                                                                                                                                                                                               
+ fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/or
derers/orderer.example.com/msp --csr.hosts orderer.example.com --csr.hosts localhost --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-ca/ordererOrg/ca-cer
t.pem                                                                                                                                                                                                                    
2023/02/02 10:53:24 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:24 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                              
2023/02/02 10:53:24 [INFO] encoded CSR                                                                                                                                                                                   
2023/02/02 10:53:25 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/signce
rts/cert.pem                                                                                                                                                                                                             
2023/02/02 10:53:25 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/cacer
ts/localhost-9054-ca-orderer.pem                                                                                                                                                                                         
2023/02/02 10:53:25 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/IssuerP
ublicKey                                                                                                                                                                                                                 
2023/02/02 10:53:25 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/
msp/IssuerRevocationPublicKey                                                                                                                                                                                            
Generating the orderer-tls certificates                                                                                                                                                                                  
+ fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/or
derers/orderer.example.com/tls --enrollment.profile tls --csr.hosts orderer.example.com --csr.hosts localhost --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fa
bric-ca/ordererOrg/ca-cert.pem                                                                                                                                                                                           
2023/02/02 10:53:25 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:25 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                              
2023/02/02 10:53:25 [INFO] encoded CSR                                                                                                                                                                                   
2023/02/02 10:53:25 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/signce
rts/cert.pem                                                                                                                                                                                                             
2023/02/02 10:53:25 [INFO] Stored TLS root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/t
lscacerts/tls-localhost-9054-ca-orderer.pem                                                                                                                                                                              
2023/02/02 10:53:25 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/IssuerP
ublicKey                                                                                                                                                                                                                 
2023/02/02 10:53:25 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/
tls/IssuerRevocationPublicKey                                                                                                                                                                                            
Generating the admin msp                                                                                                                                                                                                 
+ fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:9054 --caname ca-orderer -M /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/exam
ple.com/users/Admin@example.com/msp --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/fabric-ca/ordererOrg/ca-cert.pem                                            
2023/02/02 10:53:26 [INFO] TLS Enabled                                                                                                                                                                                   
2023/02/02 10:53:26 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                              
2023/02/02 10:53:26 [INFO] encoded CSR                                                                                                                                                                                   
2023/02/02 10:53:26 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/signcerts/c
ert.pem                                                                                                                                                                                                                  
2023/02/02 10:53:26 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/cacerts/lo
calhost-9054-ca-orderer.pem                                                                                                                                                                                              
2023/02/02 10:53:26 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/IssuerPublic
Key                                                                                                                                                                                                                      
2023/02/02 10:53:26 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/I
ssuerRevocationPublicKey                                                                                                                                                                                                 
Generating CCP files for Org1 and Org2                                                                                                                                                                                   
WARN[0000] Found orphan containers ([ca_orderer ca_org1 ca_org2]) for this project. If you removed or renamed this service in your compose file, you can run this command with the --remove-orphans flag to clean it up. 
[+] Running 7/7                                                                                                                                                                                                          
 ⠿ Volume "compose_peer0.org2.example.com"  Created                                                                                                                                                                 0.0s 
 ⠿ Volume "compose_orderer.example.com"     Created                                                                                                                                                                 0.0s 
 ⠿ Volume "compose_peer0.org1.example.com"  Created                                                                                                                                                                 0.0s 
 ⠿ Container orderer.example.com            Started                                                                                                                                                                 1.4s 
 ⠿ Container peer0.org2.example.com         Started                                                                                                                                                                 0.8s 
 ⠿ Container peer0.org1.example.com         Started                                                                                                                                                                 1.2s 
 ⠿ Container cli                            Started                                                                                                                                                                 1.8s 
CONTAINER ID   IMAGE                               COMMAND                  CREATED          STATUS                  PORTS                                                                    NAMES                      
ba19aae91253   hyperledger/fabric-tools:latest     "/bin/bash"              2 seconds ago    Up Less than a second                                                                            cli                        
bc057c41d18c   hyperledger/fabric-peer:latest      "peer node start"        2 seconds ago    Up 1 second             0.0.0.0:9051->9051/tcp, 7051/tcp, 0.0.0.0:9445->9445/tcp                 peer0.org2.example.com     
05ec8b2116e1   hyperledger/fabric-orderer:latest   "orderer"                2 seconds ago    Up Less than a second   0.0.0.0:7050->7050/tcp, 0.0.0.0:7053->7053/tcp, 0.0.0.0:9443->9443/tcp   orderer.example.com        
468d0a548c8e   hyperledger/fabric-peer:latest      "peer node start"        2 seconds ago    Up Less than a second   0.0.0.0:7051->7051/tcp, 0.0.0.0:9444->9444/tcp                           peer0.org1.example.com     
740fe3e92117   hyperledger/fabric-ca:latest        "sh -c 'fabric-ca-se…"   18 seconds ago   Up 17 seconds           0.0.0.0:9054->9054/tcp, 7054/tcp, 0.0.0.0:19054->19054/tcp               ca_orderer                 
e2ef60896525   hyperledger/fabric-ca:latest        "sh -c 'fabric-ca-se…"   18 seconds ago   Up 17 seconds           0.0.0.0:7054->7054/tcp, 0.0.0.0:17054->17054/tcp                         ca_org1                    
9cc58be80f34   hyperledger/fabric-ca:latest        "sh -c 'fabric-ca-se…"   18 seconds ago   Up 17 seconds           0.0.0.0:8054->8054/tcp, 7054/tcp, 0.0.0.0:18054->18054/tcp               ca_org2                    
Using docker and docker-compose                                                                                                                                                                                          
Generating channel genesis block 'mychannel.block'                                                                                                                                                                       
/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/../bin/configtxgen                                                                                                                            
+ configtxgen -profile TwoOrgsApplicationGenesis -outputBlock ./channel-artifacts/mychannel.block -channelID mychannel                                                                                                   
2023-02-02 10:53:29.321 EET 0001 INFO [common.tools.configtxgen] main -> Loading configuration                                                                                                                           
2023-02-02 10:53:29.346 EET 0002 INFO [common.tools.configtxgen.localconfig] completeInitialization -> orderer type: etcdraft                                                                                            
2023-02-02 10:53:29.347 EET 0003 INFO [common.tools.configtxgen.localconfig] completeInitialization -> Orderer.EtcdRaft.Options unset, setting to tick_interval:"500ms" election_tick:10 heartbeat_tick:1 max_inflight_bl
ocks:5 snapshot_interval_size:16777216                                                                                                                                                                                   
2023-02-02 10:53:29.347 EET 0004 INFO [common.tools.configtxgen.localconfig] Load -> Loaded configuration: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/configtx/configtx.yaml             
2023-02-02 10:53:29.492 EET 0005 INFO [common.tools.configtxgen] doOutputBlock -> Generating genesis block                                                                                                               
2023-02-02 10:53:29.492 EET 0006 INFO [common.tools.configtxgen] doOutputBlock -> Creating application channel genesis block                                                                                             
2023-02-02 10:53:29.493 EET 0007 INFO [common.tools.configtxgen] doOutputBlock -> Writing genesis block                                                                                                                  
+ res=0                                                                                                                                                                                                                  
Creating channel mychannel                                                                                                                                                                                               
Using organization 1                                                                                                                                                                                                     
+ osnadmin channel join --channelID mychannel --config-block ./channel-artifacts/mychannel.block -o localhost:7053 --ca-file /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ord
ererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem --client-cert /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.e
xample.com/tls/server.crt --client-key /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key             
+ res=0                                                                                                                                                                                                                  
Status: 201                                                                                                                                                                                                              
{                                                                                                                                                                                                                        
        "name": "mychannel",                                                                                                                                                                                             
        "url": "/participation/v1/channels/mychannel",                                                                                                                                                                   
        "consensusRelation": "consenter",                                                                                                                                                                                
        "status": "active",                                                                                                                                                                                              
        "height": 1                                                                                                                                                                                                      
}                                                                                                                                                                                                                        
                                                                                                                                                                                                                         
Channel 'mychannel' created                                                                                                                                                                                              
Joining org1 peer to the channel...                                                                                                                                                                                      
Using organization 1                                                                                                                                                                                                     
+ peer channel join -b ./channel-artifacts/mychannel.block                                                                                                                                                               
+ res=0                                                                                                                                                                                                                  
2023-02-02 10:53:36.597 EET 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized                                                                                                        
2023-02-02 10:53:36.646 EET 0002 INFO [channelCmd] executeJoin -> Successfully submitted proposal to join channel                                                                                                        
Joining org2 peer to the channel...                                                                                                                                                                                      
Using organization 2                                                                                                                                                                                                     
+ peer channel join -b ./channel-artifacts/mychannel.block                                                                                                                                                               
+ res=0                                                                                                                                                                                                                  
2023-02-02 10:53:40.291 EET 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized                                                                                                        
2023-02-02 10:53:40.353 EET 0002 INFO [channelCmd] executeJoin -> Successfully submitted proposal to join channel                                                                                                        
Setting anchor peer for org1...                                                                                                                                                                                          
Using organization 1                                                                                                                                                                                                     
Fetching channel config for channel mychannel                                                                                                                                                                            
Using organization 1                                                                                                                                                                                                     
Fetching the most recent configuration block for the channel                                                                                                                                                             
+ peer channel fetch config config_block.pb -o orderer.example.com:7050 --ordererTLSHostnameOverride orderer.example.com -c mychannel --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ord
ererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem                                                                                                                                                           
2023-02-02 08:53:40.676 UTC 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized                                                                                                        
2023-02-02 08:53:40.678 UTC 0002 INFO [cli.common] readBlock -> Received block: 0                                                                                                                                        
2023-02-02 08:53:40.678 UTC 0003 INFO [channelCmd] fetch -> Retrieving last config block: 0                                                                                                                              
2023-02-02 08:53:40.679 UTC 0004 INFO [cli.common] readBlock -> Received block: 0                                                                                                                                        
Decoding config block to JSON and isolating config to Org1MSPconfig.json                                                                                                                                                 
+ configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json                                                                                                                      
+ jq '.data.data[0].payload.data.config' config_block.json                                                                                                                                                               
Generating anchor peer update transaction for Org1 on channel mychannel                                                                                                                                                  
+ jq '.channel_group.groups.Application.groups.Org1MSP.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "peer0.org1.example.com","port": 7051}]},"version": "0"}}' Org1MSPconfig.json 
+ configtxlator proto_encode --input Org1MSPconfig.json --type common.Config --output original_config.pb                                                                                                                 
+ configtxlator proto_encode --input Org1MSPmodified_config.json --type common.Config --output modified_config.pb                                                                                                        
+ configtxlator compute_update --channel_id mychannel --original original_config.pb --updated modified_config.pb --output config_update.pb                                                                               
+ configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate --output config_update.json                                                                                                             
+ jq .                                                                                                                                                                                                                   
++ cat config_update.json                                                                                                                                                                                                
+ echo '{"payload":{"header":{"channel_header":{"channel_id":"mychannel", "type":2}},"data":{"config_update":{' '"channel_id":' '"mychannel",' '"isolated_data":' '{},' '"read_set":' '{' '"groups":' '{' '"Application":
' '{' '"groups":' '{' '"Org1MSP":' '{' '"groups":' '{},' '"mod_policy":' '"",' '"policies":' '{' '"Admins":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Endorsement":' '{' '"mod_policy":' '""
,' '"policy":' null, '"version":' '"0"' '},' '"Readers":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Writers":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '}' '},' '"valu
es":' '{' '"MSP":' '{' '"mod_policy":' '"",' '"value":' null, '"version":' '"0"' '}' '},' '"version":' '"0"' '}' '},' '"mod_policy":' '"",' '"policies":' '{},' '"values":' '{},' '"version":' '"0"' '}' '},' '"mod_polic
y":' '"",' '"policies":' '{},' '"values":' '{},' '"version":' '"0"' '},' '"write_set":' '{' '"groups":' '{' '"Application":' '{' '"groups":' '{' '"Org1MSP":' '{' '"groups":' '{},' '"mod_policy":' '"Admins",' '"policie
s":' '{' '"Admins":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Endorsement":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Readers":' '{' '"mod_policy":' '"",' '"po
licy":' null, '"version":' '"0"' '},' '"Writers":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '}' '},' '"values":' '{' '"AnchorPeers":' '{' '"mod_policy":' '"Admins",' '"value":' '{' '"anchor_peers
":' '[' '{' '"host":' '"peer0.org1.example.com",' '"port":' 7051 '}' ']' '},' '"version":' '"0"' '},' '"MSP":' '{' '"mod_policy":' '"",' '"value":' null, '"version":' '"0"' '}' '},' '"version":' '"1"' '}' '},' '"mod_p
olicy":' '"",' '"policies":' '{},' '"values":' '{},' '"version":' '"0"' '}' '},' '"mod_policy":' '"",' '"policies":' '{},' '"values":' '{},' '"version":' '"0"' '}' '}}}}'                                               
+ configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope --output Org1MSPanchors.tx                                                                                                    
2023-02-02 08:53:40.925 UTC 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized                                                                                                        
2023-02-02 08:53:40.934 UTC 0002 INFO [channelCmd] update -> Successfully submitted channel update                                                                                                                       
Anchor peer set for org 'Org1MSP' on channel 'mychannel'                                                                                                                                                                 
Setting anchor peer for org2...                                                                                                                                                                                          
Using organization 2                                                                                                                                                                                                     
Fetching channel config for channel mychannel                                                                                                                                                                            
Using organization 2                                                                                                                                                                                                     
Fetching the most recent configuration block for the channel                                                                                                                                                             
+ peer channel fetch config config_block.pb -o orderer.example.com:7050 --ordererTLSHostnameOverride orderer.example.com -c mychannel --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ord
ererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem                                                                                                                                                           
2023-02-02 08:53:41.220 UTC 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized                                                                                                        
2023-02-02 08:53:41.222 UTC 0002 INFO [cli.common] readBlock -> Received block: 1                                                                                                                                        
2023-02-02 08:53:41.222 UTC 0003 INFO [channelCmd] fetch -> Retrieving last config block: 1                                                                                                                              
2023-02-02 08:53:41.223 UTC 0004 INFO [cli.common] readBlock -> Received block: 1                                                                                                                                        
Decoding config block to JSON and isolating config to Org2MSPconfig.json                                                                                                                                                 
+ configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json                                                                                                                      
+ jq '.data.data[0].payload.data.config' config_block.json                                                                                                                                                               
+ jq '.channel_group.groups.Application.groups.Org2MSP.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "peer0.org2.example.com","port": 9051}]},"version": "0"}}' Org2MSPconfig.json 
Generating anchor peer update transaction for Org2 on channel mychannel                                                                                                                                                  
+ configtxlator proto_encode --input Org2MSPconfig.json --type common.Config --output original_config.pb                                                                                                                 
+ configtxlator proto_encode --input Org2MSPmodified_config.json --type common.Config --output modified_config.pb                                                                                                        
+ configtxlator compute_update --channel_id mychannel --original original_config.pb --updated modified_config.pb --output config_update.pb                                                                               
+ configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate --output config_update.json                                                                                                             
+ jq .                                                                                                                                                                                                                   
++ cat config_update.json                                                                                                                                                                                                
+ echo '{"payload":{"header":{"channel_header":{"channel_id":"mychannel", "type":2}},"data":{"config_update":{' '"channel_id":' '"mychannel",' '"isolated_data":' '{},' '"read_set":' '{' '"groups":' '{' '"Application":
' '{' '"groups":' '{' '"Org2MSP":' '{' '"groups":' '{},' '"mod_policy":' '"",' '"policies":' '{' '"Admins":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Endorsement":' '{' '"mod_policy":' '""
,' '"policy":' null, '"version":' '"0"' '},' '"Readers":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Writers":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '}' '},' '"valu
es":' '{' '"MSP":' '{' '"mod_policy":' '"",' '"value":' null, '"version":' '"0"' '}' '},' '"version":' '"0"' '}' '},' '"mod_policy":' '"",' '"policies":' '{},' '"values":' '{},' '"version":' '"0"' '}' '},' '"mod_polic
y":' '"",' '"policies":' '{},' '"values":' '{},' '"version":' '"0"' '},' '"write_set":' '{' '"groups":' '{' '"Application":' '{' '"groups":' '{' '"Org2MSP":' '{' '"groups":' '{},' '"mod_policy":' '"Admins",' '"policie
s":' '{' '"Admins":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Endorsement":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Readers":' '{' '"mod_policy":' '"",' '"po
licy":' null, '"version":' '"0"' '},' '"Writers":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '}' '},' '"values":' '{' '"AnchorPeers":' '{' '"mod_policy":' '"Admins",' '"value":' '{' '"anchor_peers
":' '[' '{' '"host":' '"peer0.org2.example.com",' '"port":' 9051 '}' ']' '},' '"version":' '"0"' '},' '"MSP":' '{' '"mod_policy":' '"",' '"value":' null, '"version":' '"0"' '}' '},' '"version":' '"1"' '}' '},' '"mod_p
olicy":' '"",' '"policies":' '{},' '"values":' '{},' '"version":' '"0"' '}' '},' '"mod_policy":' '"",' '"policies":' '{},' '"values":' '{},' '"version":' '"0"' '}' '}}}}'                                               
+ configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope --output Org2MSPanchors.tx                                                                                                    
2023-02-02 08:53:41.453 UTC 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized                                                                                                        
2023-02-02 08:53:41.462 UTC 0002 INFO [channelCmd] update -> Successfully submitted channel update                                                                                                                       
Anchor peer set for org 'Org2MSP' on channel 'mychannel'                                                                                                                                                                 
Channel 'mychannel' joined                                                                                                                                                                                               
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-typescript/ -ccl typescript                         
                                                                                                                                                                                                                         
Using docker and docker-compose                                                                                                                                                                                          
deploying chaincode on channel 'mychannel'                                                                                                                                                                               
executing with the following                                                                                                                                                                                             
- CHANNEL_NAME: mychannel                                                                                                                                                                                                
- CC_NAME: basic                                                                                                                                                                                                         
- CC_SRC_PATH: ../asset-transfer-basic/chaincode-typescript/                                                                                                                                                             
- CC_SRC_LANGUAGE: typescript                                                                                                                                                                                            
- CC_VERSION: 1.0                                                                                                                                                                                                        
- CC_SEQUENCE: 1                                                                                                                                                                                                         
- CC_END_POLICY: NA                                                                                                                                                                                                      
- CC_COLL_CONFIG: NA                                                                                                                                                                                                     
- CC_INIT_FCN: NA                                                                                                                                                                                                        
- DELAY: 3                                                                                                                                                                                                               
- MAX_RETRY: 5                                                                                                                                                                                                           
- VERBOSE: false                                                                                                                                                                                                         
Compiling TypeScript code into JavaScript...                                                                                                                                                                             
/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/chaincode-typescript /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network                                       
npm WARN EBADENGINE Unsupported engine {                                                                                                                                                                                 
npm WARN EBADENGINE   package: 'fabric-contract-api@2.4.1',                                                                                                                                                              
npm WARN EBADENGINE   required: { node: '^16.4.0', npm: '^8.0.0' },                                                                                                                                                      
npm WARN EBADENGINE   current: { node: 'v18.1.0', npm: '9.3.1' }                                                                                                                                                         
npm WARN EBADENGINE }                                                                                                                                                                                                    
npm WARN EBADENGINE Unsupported engine {                                                                                                                                                                                 
npm WARN EBADENGINE   package: 'fabric-shim@2.4.1',                                                                                                                                                                      
npm WARN EBADENGINE   required: { node: '^16.4.0', npm: '^8.0.0' },                                                                                                                                                      
npm WARN EBADENGINE   current: { node: 'v18.1.0', npm: '9.3.1' }                                                                                                                                                         
npm WARN EBADENGINE }                                                                                                                                                                                                    
npm WARN EBADENGINE Unsupported engine {                                                                                                                                                                                 
npm WARN EBADENGINE   package: 'fabric-shim-api@2.4.1',                                                                                                                                                                  
npm WARN EBADENGINE   required: { eslint: '^6.6.0', node: '^16.4.0', npm: '^8.0.0' },                                                                                                                                    
npm WARN EBADENGINE   current: { node: 'v18.1.0', npm: '9.3.1' }                                                                                                                                                         
npm WARN EBADENGINE }                                                                                                                                                                                                    
                                                                                                                                                                                                                         
up to date, audited 326 packages in 2s                                                                                                                                                                                   
                                                                                                                                                                                                                         
26 packages are looking for funding                                                                                                                                                                                      
  run `npm fund` for details                                                                                                                                                                                             
                                                                                                                                                                                                                         
1 high severity vulnerability                                                                                                                                                                                            
                                                                                                                                                                                                                         
To address all issues, run:                                                                                                                                                                                              
  npm audit fix                                                                                                                                                                                                          
                                                                                                                                                                                                                         
Run `npm audit` for details.                                                                                                                                                                                             
                                                                                                                                                                                                                         
> asset-transfer-basic@1.0.0 build                                                                                                                                                                                       
> tsc                                                                                                                                                                                                                    
                                                                                                                                                                                                                         
/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network                                                                                                                                               
Finished compiling TypeScript code into JavaScript                                                                                                                                                                       
+ peer lifecycle chaincode package basic.tar.gz --path ../asset-transfer-basic/chaincode-typescript/ --lang node --label basic_1.0                                                                                       
+ res=0                                                                                                                                                                                                                  
++ peer lifecycle chaincode calculatepackageid basic.tar.gz                                                                                                                                                              
+ PACKAGE_ID=basic_1.0:53a6eb996d58b96f6882e4de90c2335f854c1c357c0676a002662d53920a2a37                                                                                                                                  
Chaincode is packaged                                                                                                                                                                                                    
Installing chaincode on peer0.org1...                                                                                                                                                                                    
Using organization 1                                                                                                                                                                                                     
+ peer lifecycle chaincode queryinstalled --output json                                                                                                                                                                  
+ jq -r 'try (.installed_chaincodes[].package_id)'                                                                                                                                                                       
+ grep '^basic_1.0:53a6eb996d58b96f6882e4de90c2335f854c1c357c0676a002662d53920a2a37$'                                                                                                                                    
+ test 1 -ne 0                                                                                                                                                                                                           
+ peer lifecycle chaincode install basic.tar.gz                                                                                                                                                                          
+ res=0                                                                                                                                                                                                                  
2023-02-02 10:58:30.281 EET 0001 INFO [cli.lifecycle.chaincode] submitInstallProposal -> Installed remotely: response:
022\tbasic_1.0" >                                                                                                                                                                                                        
2023-02-02 10:58:30.285 EET 0002 INFO [cli.lifecycle.chaincode] submitInstallProposal -> Chaincode code package identifier: basic_1.0:53a6eb996d58b96f6882e4de90c2335f854c1c357c0676a002662d53920a2a37                   
Chaincode is installed on peer0.org1                                                                                                                                                                                     
Install chaincode on peer0.org2...                                                                                                                                                                                       
Using organization 2                                                                                                                                                                                                     
+ peer lifecycle chaincode queryinstalled --output json                                                                                                                                                                  
+ jq -r 'try (.installed_chaincodes[].package_id)'                                                                                                                                                                       
+ grep '^basic_1.0:53a6eb996d58b96f6882e4de90c2335f854c1c357c0676a002662d53920a2a37$'                                                                                                                                    
+ test 1 -ne 0                                                                                                                                                                                                           
+ peer lifecycle chaincode install basic.tar.gz                                                                                                                                                                          
+ res=0                                                                                                                                                                                                                  
2023-02-02 10:58:40.398 EET 0001 INFO [cli.lifecycle.chaincode] submitInstallProposal -> Installed remotely: response:
022\tbasic_1.0" >                                                                                                                                                                                                        
2023-02-02 10:58:40.401 EET 0002 INFO [cli.lifecycle.chaincode] submitInstallProposal -> Chaincode code package identifier: basic_1.0:53a6eb996d58b96f6882e4de90c2335f854c1c357c0676a002662d53920a2a37                   
Chaincode is installed on peer0.org2                                                                                                                                                                                     
Using organization 1                                                                                                                                                                                                     
+ peer lifecycle chaincode queryinstalled --output json                                                                                                                                                                  
+ jq -r 'try (.installed_chaincodes[].package_id)'                                                                                                                                                                       
+ grep '^basic_1.0:53a6eb996d58b96f6882e4de90c2335f854c1c357c0676a002662d53920a2a37$'                                                                                                                                    
+ res=0                                                                                                                                                                                                                  
basic_1.0:53a6eb996d58b96f6882e4de90c2335f854c1c357c0676a002662d53920a2a37                                                                                                                                               
Query installed successful on peer0.org1 on channel                                                                                                                                                                      
Using organization 1                                                                                                                                                                                                     
+ peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ord
ererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem --channelID mychannel --name basic --version 1.0 --package-id basic_1.0:53a6eb996d58b96f6882e4de90c2335f854c1c357c0676a002662d53920a2a37 --sequence 1     
+ res=0                                                                                                                                                                                                                  
2023-02-02 10:58:43.876 EET 0001 INFO [chaincodeCmd] ClientWait -> txid [5f26d2b8d426ecb43815bf3dd075df95b6d29e28958d2bd3b619b7a532976836] committed with status (VALID) at localhost:7051                               
Chaincode definition approved on peer0.org1 on channel 'mychannel'                                                                                                                                                       
Using organization 1                                                                                                                                                                                                     
Checking the commit readiness of the chaincode definition on peer0.org1 on channel 'mychannel'...                                                                                                                        
Attempting to check the commit readiness of the chaincode definition on peer0.org1, Retry after 3 seconds.                                                                                                               
+ peer lifecycle chaincode checkcommitreadiness --channelID mychannel --name basic --version 1.0 --sequence 1 --output json                                                                                              
+ res=0                                                                                                                                                                                                                  
{                                                                                                                                                                                                                        
        "approvals": {                                                                                                                                                                                                   
                "Org1MSP": true,                                                                                                                                                                                         
                "Org2MSP": false                                                                                                                                                                                         
        }                                                                                                                                                                                                                
}                                                                                                                                                                                                                        
Checking the commit readiness of the chaincode definition successful on peer0.org1 on channel 'mychannel'                                                                                                                
Using organization 2                                                                                                                                                                                                     
Checking the commit readiness of the chaincode definition on peer0.org2 on channel 'mychannel'...                                                                                                                        
Attempting to check the commit readiness of the chaincode definition on peer0.org2, Retry after 3 seconds.                                                                                                               
+ peer lifecycle chaincode checkcommitreadiness --channelID mychannel --name basic --version 1.0 --sequence 1 --output json                                                                                              
+ res=0                                                                                                                                                                                                                  
{                                                                                                                                                                                                                        
        "approvals": {                                                                                                                                                                                                   
                "Org1MSP": true,                                                                                                                                                                                         
                "Org2MSP": false                                                                                                                                                                                         
        }                                                                                                                                                                                                                
}                                                                                                                                                                                                                        
Checking the commit readiness of the chaincode definition successful on peer0.org2 on channel 'mychannel'                                                                                                                
Using organization 2                                                                                                                                                                                                     
+ peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ord
ererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem --channelID mychannel --name basic --version 1.0 --package-id basic_1.0:53a6eb996d58b96f6882e4de90c2335f854c1c357c0676a002662d53920a2a37 --sequence 1     
+ res=0                                                                                                                                                                                                                  
2023-02-02 10:58:54.028 EET 0001 INFO [chaincodeCmd] ClientWait -> txid [2d1e8e6a7418058c8610e85282044e73f80c52e8a2bd254dbd4b1c2131891455] committed with status (VALID) at localhost:9051                               
Chaincode definition approved on peer0.org2 on channel 'mychannel'                                                                                                                                                       
Using organization 1                                                                                                                                                                                                     
Checking the commit readiness of the chaincode definition on peer0.org1 on channel 'mychannel'...                                                                                                                        
Attempting to check the commit readiness of the chaincode definition on peer0.org1, Retry after 3 seconds.                                                                                                               
+ peer lifecycle chaincode checkcommitreadiness --channelID mychannel --name basic --version 1.0 --sequence 1 --output json                                                                                              
+ res=0                                                                                                                                                                                                                  
{                                                                                                                                                                                                                        
        "approvals": {                                                                                                                                                                                                   
                "Org1MSP": true,                                                                                                                                                                                         
                "Org2MSP": true                                                                                                                                                                                          
        }                                                                                                                                                                                                                
}                                                                                                                                                                                                                        
Checking the commit readiness of the chaincode definition successful on peer0.org1 on channel 'mychannel'                                                                                                                
Using organization 2                                                                                                                                                                                                     
Checking the commit readiness of the chaincode definition on peer0.org2 on channel 'mychannel'...                                                                                                                        
Attempting to check the commit readiness of the chaincode definition on peer0.org2, Retry after 3 seconds.                                                                                                               
+ peer lifecycle chaincode checkcommitreadiness --channelID mychannel --name basic --version 1.0 --sequence 1 --output json                                                                                              
+ res=0                                                                                                                                                                                                                  
{                                                                                                                                                                                                                        
        "approvals": {                                                                                                                                                                                                   
                "Org1MSP": true,                                                                                                                                                                                         
                "Org2MSP": true                                                                                                                                                                                          
        }                                                                                                                                                                                                                
}                                                                                                                                                                                                                        
Checking the commit readiness of the chaincode definition successful on peer0.org2 on channel 'mychannel'                                                                                                                
Using organization 1                                                                                                                                                                                                     
Using organization 2                                                                                                                                                                                                     
+ peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/ordererOrgan
izations/example.com/tlsca/tlsca.example.com-cert.pem --channelID mychannel --name basic --peerAddresses localhost:7051 --tlsRootCertFiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/org
anizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem --peerAddresses localhost:9051 --tlsRootCertFiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organiza
tions/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem --version 1.0 --sequence 1                                                                                                                
+ res=0                                                                                                                                                                                                                  
2023-02-02 10:59:04.148 EET 0001 INFO [chaincodeCmd] ClientWait -> txid [76de491a538c97aba5d9034668ff0071974231afe3adb3f63913f008226453b3] committed with status (VALID) at localhost:9051                               
2023-02-02 10:59:04.145 EET 0002 INFO [chaincodeCmd] ClientWait -> txid [76de491a538c97aba5d9034668ff0071974231afe3adb3f63913f008226453b3] committed with status (VALID) at localhost:7051                               
Chaincode definition committed on channel 'mychannel'                                                                                                                                                                    
Using organization 1                                                                                                                                                                                                     
Querying chaincode definition on peer0.org1 on channel 'mychannel'...                                                                                                                                                    
Attempting to Query committed status on peer0.org1, Retry after 3 seconds.                                                                                                                                               
+ peer lifecycle chaincode querycommitted --channelID mychannel --name basic                                                                                                                                             
+ res=0                                                                                                                                                                                                                  
Committed chaincode definition for chaincode 'basic' on channel 'mychannel':                                                                                                                                             
Version: 1.0, Sequence: 1, Endorsement Plugin: escc, Validation Plugin: vscc, Approvals: [Org1MSP: true, Org2MSP: true]                                                                                                  
Query chaincode definition successful on peer0.org1 on channel 'mychannel'                                                                                                                                               
Using organization 2                                                                                                                                                                                                     
Querying chaincode definition on peer0.org2 on channel 'mychannel'...                                                                                                                                                    
Attempting to Query committed status on peer0.org2, Retry after 3 seconds.                                                                                                                                               
+ peer lifecycle chaincode querycommitted --channelID mychannel --name basic                                                                                                                                             
+ res=0                                                                                                                                                                                                                  
Committed chaincode definition for chaincode 'basic' on channel 'mychannel':                                                                                                                                             
Version: 1.0, Sequence: 1, Endorsement Plugin: escc, Validation Plugin: vscc, Approvals: [Org1MSP: true, Org2MSP: true]                                                                                                  
Query chaincode definition successful on peer0.org2 on channel 'mychannel'                                                                                                                                               
Chaincode initialization is not required                                                                                                                                                                                 
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$                                                                                                                             
----------------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------------
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706$ cd fabric-samples/asset-transfer-basic/application-gateway-typescript                                                                  
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript$ npm install                                                         
                                                                                                                                                                                                        
> asset-transfer-basic@1.0.0 prepare                                                                                                                                                                    
> npm run build                                                                                                                                                                                         
                                                                                                                                                                                                        
                                                                                                                                                                                                        
> asset-transfer-basic@1.0.0 build                                                                                                                                                                      
> tsc                                                                                                                                                                                                   
                                                                                                                                                                                                        
                                                                                                                                                                                                        
up to date, audited 480 packages in 25s                                                                                                                                                                 
                                                                                                                                                                                                        
52 packages are looking for funding                                                                                                                                                                     
  run `npm fund` for details                                                                                                                                                                            
                                                                                                                                                                                                        
1 moderate severity vulnerability                                                                                                                                                                       
                                                                                                                                                                                                        
To address all issues, run:                                                                                                                                                                             
  npm audit fix                                                                                                                                                                                         
                                                                                                                                                                                                        
Run `npm audit` for details.                                                                                                                                                                            
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript$ npm start
> asset-transfer-basic@1.0.0 start                                                                                                                                                                      
> node dist/app.js                                                                                                                                                                                      
                                                                                                                                                                                                        
1                                                                                                                                                                                                       
The value of PORT is : 8000                                                                                                                                                                             
Example app listening on port 8000! 


New asset deploted in the world state                                                                                                                                                                   
{                                                                                                                                                                                                       
  riskassessmentId: 100,                                                                                                                                                                                
  vulnerabilities: [ 'aksdjalj' ],                                                                                                                                                                      
  AllowedOrgs: 'something'                                                                                                                                                                              
}                                                                                                                                                                                                       
Ready                                                                                                                                                                                                   
   
New asset deploted in the world state                                                                                                                                                                   
{                                                                                                                                                                                                       
  riskassessmentId: 101,                                                                                                                                                                                
  vulnerabilities: [                                                                                                                                                                                    
    "This will be read by Org1 and Org2. Orgw1 as creator org2 for having the attribute 'allowedOrgs' whith value 'attributeValueForAccess'"                                                            
  ],                                                                                                                                                                                                    
  AllowedOrgs: 'attributeValueForAccess'                                                                                                                                                                
}                                                                                                                                                                                                       
Ready  

get all assets API!!!                                                                                                                                                                                   
Ready                                                                                                                                                                                                   
/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@hyperledger/fabric-gateway/dist/gatewayerror.js:39                      
    return new GatewayError({                                                                                                                                                                           
           ^                                                                                                                                                                                            
                                                                                                                                                                                                        
GatewayError: 2 UNKNOWN: evaluate call to endorser returned error: chaincode response 500, Error, you are not allowed to read an asset Your attribute is: null but allowed Attributes: cat,dog,newAttrib
uteValue                                                                                                                                                                                                
    at newGatewayError (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@hyperledger/fabric-gateway/dist/gatewayerror.js:
39:12)                                                                                                                                                                                                  
    at Object.callback (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@hyperledger/fabric-gateway/dist/client.js:101:67
)                                                                                                                                                                                                       
    at Object.onReceiveStatus (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/client.js:195:36) 
    at Object.onReceiveStatus (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/client-interceptor
s.js:365:141)                                                                                                                                                                                           
    ... 2 lines matching cause stack trace ...                                                                                                                                                          
    at process.processTicksAndRejections (node:internal/process/task_queues:77:11) {                                                                                                                    
  code: 2,                                                                                                                                                                                              
  details: [                                                                                                                                                                                            
    {                                                                                                                                                                                                   
      address: 'peer0.org1.example.com:7051',                                                                                                                                                           
      message: 'chaincode response 500, Error, you are not allowed to read an asset Your attribute is: null but allowed Attributes: cat,dog,newAttributeValue',                                         
      mspId: 'Org1MSP'                                                                                                                                                                                  
    }                                                                                                                                                                                                   
  ],                                                                                                                                                                                                    
  cause: Error: 2 UNKNOWN: evaluate call to endorser returned error: chaincode response 500, Error, you are not allowed to read an asset Your attribute is: null but allowed Attributes: cat,dog,newAttr
ibuteValue                                                                                                                                                                                              
      at Object.callErrorFromStatus (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/call.js:31:1
9)                                                                                                                                                                                                      
      at Object.onReceiveStatus (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/client.js:195:52
)                                                                                                                                                                                                       
      at Object.onReceiveStatus (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/client-intercept
ors.js:365:141)                                                                                                                                                                                         
      at Object.onReceiveStatus (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/client-intercept
ors.js:328:181)                                                                                                                                                                                         
      at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/call-stream.js:188:78                   
      at process.processTicksAndRejections (node:internal/process/task_queues:77:11)                                                                                                                    
  for call at                                                                                                                                                                                           
      at Client.makeUnaryRequest (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/client.js:163:3
4)                                                                                                                                                                                                      
      at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@hyperledger/fabric-gateway/dist/client.js:44:110               
      at new Promise ()                                                                                                                                                                      
      at GatewayClientImpl.evaluate (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@hyperledger/fabric-gateway/dist/cli
ent.js:44:16)                                                                                                                                                                                           
      at ProposalImpl.evaluate (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@hyperledger/fabric-gateway/dist/proposal
.js:50:96)                                                                                                                                                                                              
      at async getAllAssets (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/dist/app.js:177:25)                                      
      at async /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/dist/app.js:314:21 {                                                   
    code: 2,                                                                                                                                                                                            
    details: 'evaluate call to endorser returned error: chaincode response 500, Error, you are not allowed to read an asset Your attribute is: null but allowed Attributes: cat,dog,newAttributeValue', 
    metadata: Metadata {                                                                                                                                                                                
      internalRepr: Map(2) {                                                                                                                                                                            
        'content-type' => [ 'application/grpc' ],                                                                                                                                                       
        'grpc-status-details-bin' => [                                                                                                                                                                  
          Buffer(417) [Uint8Array] [                                                                                                                                                                    
              8,   2,  18, 183,   1, 101, 118,  97, 108, 117,  97, 116,                                                                                                                                 
            101,  32,  99,  97, 108, 108,  32, 116, 111,  32, 101, 110,                                                                                                                                 
            100, 111, 114, 115, 101, 114,  32, 114, 101, 116, 117, 114,                                                                                                                                 
            110, 101, 100,  32, 101, 114, 114, 111, 114,  58,  32,  99,                                                                                                                                 
            104,  97, 105, 110,  99, 111, 100, 101,  32, 114, 101, 115,                                                                                                                                 
            112, 111, 110, 115, 101,  32,  53,  48,  48,  44,  32,  69,                                                                                                                                 
            114, 114, 111, 114,  44,  32, 121, 111, 117,  32,  97, 114,                                                                                                                                 
            101,  32, 110, 111, 116,  32,  97, 108, 108, 111, 119, 101,                                                                                                                                 
            100,  32, 116, 111,                                                                                                                                                                         
            ... 317 more items                                                                                                                                                                          
          ]                                                                                                                                                                                             
        ]                                                                                                                                                                                               
      },                                                                                                                                                                                                
      options: {}                                                                                                                                                                                       
    }                                                                                                                                                                                                   
  }                                                                                                                                                                                                     
}                                                                                                                                                                                                       
                                                                                                                                                                                                        
Node.js v18.1.0                                                                                                                                                                                         
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript$  
------------------------------------------------------------------------------------------------------------------------------------------------------
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ export PATH=${PWD}/../bin:${PWD}:$PATH                                                                     
export FABRIC_CFG_PATH=$PWD/../config/                                                                                                                                                                  
export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/org1.example.com/                                                                                                                   
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ fabric-ca-client identity modify user1 --id.secret user1pw --attrs newAttributeName=newAttributeValue:ecert --tls.certfiles "${PWD}/organizations/fabric-ca/org1/tls-cert.pem"                                                                                                                                     2023/02/02 11:30:49 [INFO] Configuration file location: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/fabric-ca-client-con
fig.yaml                                                                                                                                                                                                
2023/02/02 11:30:49 [INFO] TLS Enabled                                                                                                                                                                  
2023/02/02 11:30:49 [INFO] TLS Enabled                                                                                                                                                                  
Successfully modified identity - Name: user1, Type: client, Affiliation: , Max Enrollments: -1, Secret: , Attributes: [{Name:hf.EnrollmentID Value:user1 ECert:true} {Name:hf.Type Value:client ECert:tr
ue} {Name:hf.Affiliation Value: ECert:true} {Name:newAttributeName Value:newAttributeValue ECert:true}]                                                                                                 
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ 
fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca-org1 -M ${PWD}/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/org1/tls-cert.pem                                                                 
2023/02/02 11:31:51 [INFO] TLS Enabled                                                                                                                                                                  
2023/02/02 11:31:51 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                             
2023/02/02 11:31:51 [INFO] encoded CSR                                                                                                                                                                  
2023/02/02 11:31:51 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/user1@org1.exa
mple.com/msp/signcerts/cert.pem                                                                                                                                                                         
2023/02/02 11:31:51 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/user1@org1.ex
ample.com/msp/cacerts/localhost-7054-ca-org1.pem                                                                                                                                                        
2023/02/02 11:31:51 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/user1@org1.exam
ple.com/msp/IssuerPublicKey                                                                                                                                                                             
2023/02/02 11:31:51 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/user
1@org1.example.com/msp/IssuerRevocationPublicKey                                                                                                                                                        
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ export PATH=${PWD}/../bin:${PWD}:$PATH                                                                     
export FABRIC_CFG_PATH=$PWD/../config/                                                                                                                                                                  
export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/org2.example.com/                                                                                                                   
[  s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ 
fabric-ca-client identity modify user1 --id.secret user1pw --attrs newAttributeName=newAttributeValue:ecert --tls.certfiles "${PWD}/organizations/fabric-ca/org2/tls-cert.pem" 
                                                                                                                                    
2023/02/02 11:33:47 [INFO] Configuration file location: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/fabric-ca-client-config.yaml                                                                                                                                                                                                
2023/02/02 11:33:47 [INFO] TLS Enabled                                                                                                                                                                  
2023/02/02 11:33:47 [INFO] TLS Enabled                                                                                                                                                                  
Successfully modified identity - Name: user1, Type: client, Affiliation: , Max Enrollments: -1, Secret: , Attributes: [{Name:hf.EnrollmentID Value:user1 ECert:true} {Name:hf.Type Value:client ECert:tr
ue} {Name:hf.Affiliation Value: ECert:true} {Name:newAttributeName Value:newAttributeValue ECert:true}]                                                                                                 
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ 
fabric-ca-client identity modify user1 --id.secret user1pw --attrs allowedOrgs=attributeValueForAccess:ecert --tls.certfiles "${PWD}/organizations/fabric-ca/org2/tls-cert.pem"  
                                                                                                                                  
2023/02/02 11:35:52 [INFO] Configuration file location: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/fabric-ca-client-config.yaml                                                                                                                                                                                                
2023/02/02 11:35:52 [INFO] TLS Enabled                                                                                                                                                                  
2023/02/02 11:35:52 [INFO] TLS Enabled                                                                                                                                                                  
Successfully modified identity - Name: user1, Type: client, Affiliation: , Max Enrollments: -1, Secret: , Attributes: [{Name:newAttributeName Value:newAttributeValue ECert:true} {Name:allowedOrgs Valu
e:attributeValueForAccess ECert:true} {Name:hf.EnrollmentID Value:user1 ECert:true} {Name:hf.Type Value:client ECert:true} {Name:hf.Affiliation Value: ECert:true}]        ]    or   
[ fabric-ca-client identity modify user1 --id.secret user1pw --attrs newAttributeName=newAttributeValue:ecert,allowedOrgs=attributeValueForAccess:ecert --tls.certfiles "${PWD}/organizations/fabric-ca/org2/tls-cert.pem" ]
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ 
fabric-ca-client enroll -u https://user1:user1pw@localhost:8054 --caname ca-org2 -M ${PWD}/organizations/peerOrganizations/org2.example.com/users/User1@org2.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/org2/tls-cert.pem                                                            
2023/02/02 11:43:58 [INFO] TLS Enabled                                                                                                                                                                  
2023/02/02 11:43:58 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                             
2023/02/02 11:43:58 [INFO] encoded CSR                                                                                                                                                                  
2023/02/02 11:43:59 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/user1@org2.exa
mple.com/msp/signcerts/cert.pem                                                                                                                                                                         
2023/02/02 11:43:59 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/user1@org2.ex
ample.com/msp/cacerts/localhost-8054-ca-org2.pem                                                                                                                                                        
2023/02/02 11:43:59 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/user1@org2.exam
ple.com/msp/IssuerPublicKey                                                                                                                                                                             
2023/02/02 11:43:59 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/user
1@org2.example.com/msp/IssuerRevocationPublicKey                                                                                                                                                        
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$      
------------------------------------------------------------------------------------------------------------------------------------------------------
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript$ npm start                                                           
                                                                                                                                                                                                        
> asset-transfer-basic@1.0.0 start                                                                                                                                                                      
> node dist/app.js                                                                                                                                                                                      
                                                                                                                                                                                                        
1 

  

The value of PORT is : 8000                                                                                                                                                                             
Example app listening on port 8000!                                                                                                                                                                     
get all assets API!!!                                                                                                                                                                                   
0  

 CHANGING THE APP FOR ORG2

s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript$ npm run build                                                                           
                                                                                                                                                                                                                            
> asset-transfer-basic@1.0.0 build                                                                                                                                                                                          
> tsc                                                                                                                                                                                                                       
                                                                                                                                                                                                                            
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript$ npm start                                                                               
                                                                                                                                                                                                                            
> asset-transfer-basic@1.0.0 start                                                                                                                                                                                          
> node dist/app.js                                                                                                                                                                                                          
                                                                                                                                                                                                                            
1                                                                                                                                                                                                                           
The value of PORT is : 8000                                                                                                                                                                                                 
Example app listening on port 8000!                                                                                                                                                                                         
get all assets API!!!                                                                                                                                                                                                       
0                                                                                                                                                                                                                           
^C                                                                                                                                                                                                                          
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript$   
           


















------------------------------------------------------------------------------------------------------------------------------------------------------
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ cd addOrg3   
(if error configtxgen tool not found. exiting add ;/usr/bin to the existing PATH environment variable an restart terminal)
                                                                                                      
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3$ ./addOrg3.sh up -c mychannel -ca                                                                                       
Using docker and docker-compose                                                                                                                                                                                             
Adding org3 to channel 'mychannel' with '10' seconds and CLI delay of '3' seconds and using database 'leveldb'                                                                                                              
                                                                                                                                                                                                                            
Generating certificates using Fabric CA                                                                                                                                                                                     
WARN[0000] Found orphan containers ([cli peer0.org2.example.com orderer.example.com peer0.org1.example.com ca_org2 ca_org1 ca_orderer]) for this project. If you removed or renamed this service in your compose file, you c
an run this command with the --remove-orphans flag to clean it up.                                                                                                                                                          
[+] Running 2/2                                                                                                                                                                                                             
 ⠿ Network compose_default  Created                                                                                                                                                                                    0.0s 
 ⠿ Container ca_org3        Started                                                                                                                                                                                    0.8s 
Creating Org3 Identities                                                                                                                                                                                                    
Enrolling the CA admin                                                                                                                                                                                                      
+ fabric-ca-client enroll -u https://admin:adminpw@localhost:11054 --caname ca-org3 --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3/fabric-ca/org3/tls-cert.pem          
2023/02/02 17:07:53 [INFO] Created a default configuration file at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/fabric-ca-client-config.yaml 
2023/02/02 17:07:53 [INFO] TLS Enabled                                                                                                                                                                                      
2023/02/02 17:07:53 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                                 
2023/02/02 17:07:53 [INFO] encoded CSR                                                                                                                                                                                      
2023/02/02 17:07:53 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/msp/signcerts/cert.pem                  
2023/02/02 17:07:53 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/msp/cacerts/localhost-11054-ca-org3.pem
2023/02/02 17:07:53 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/msp/IssuerPublicKey                      
2023/02/02 17:07:53 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/msp/IssuerRevocationPublicKey 
Registering peer0                                                                                                                                                                                                           
+ fabric-ca-client register --caname ca-org3 --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3/fabric-ca/org3/tls-cert.p
em                                                                                                                                                                                                                          
2023/02/02 17:07:54 [INFO] Configuration file location: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/fabric-ca-client-config.yaml            
2023/02/02 17:07:54 [INFO] TLS Enabled                                                                                                                                                                                      
2023/02/02 17:07:54 [INFO] TLS Enabled                                                                                                                                                                                      
Password: peer0pw                                                                                                                                                                                                           
Registering user                                                                                                                                                                                                            
+ fabric-ca-client register --caname ca-org3 --id.name user1 --id.secret user1pw --id.type client --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3/fabric-ca/org3/tls-cert
.pem                                                                                                                                                                                                                        
2023/02/02 17:07:55 [INFO] Configuration file location: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/fabric-ca-client-config.yaml            
2023/02/02 17:07:55 [INFO] TLS Enabled                                                                                                                                                                                      
2023/02/02 17:07:55 [INFO] TLS Enabled                                                                                                                                                                                      
Password: user1pw                                                                                                                                                                                                           
Registering the org admin                                                                                                                                                                                                   
+ fabric-ca-client register --caname ca-org3 --id.name org3admin --id.secret org3adminpw --id.type admin --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3/fabric-ca/org3/t
ls-cert.pem                                                                                                                                                                                                                 
2023/02/02 17:07:56 [INFO] Configuration file location: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/fabric-ca-client-config.yaml            
2023/02/02 17:07:56 [INFO] TLS Enabled                                                                                                                                                                                      
2023/02/02 17:07:56 [INFO] TLS Enabled                                                                                                                                                                                      
Password: org3adminpw                                                                                                                                                                                                       
Generating the peer0 msp                                                                                                                                                                                                    
+ fabric-ca-client enroll -u https://peer0:peer0pw@localhost:11054 --caname ca-org3 -M /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3/../organizations/peerOrganizations/org3.example.co
m/peers/peer0.org3.example.com/msp --csr.hosts peer0.org3.example.com --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3/fabric-ca/org3/tls-cert.pem                        
2023/02/02 17:07:57 [INFO] TLS Enabled                                                                                                                                                                                      
2023/02/02 17:07:57 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                                 
2023/02/02 17:07:57 [INFO] encoded CSR                                                                                                                                                                                      
2023/02/02 17:07:57 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/msp/signcer
ts/cert.pem                                                                                                                                                                                                                 
2023/02/02 17:07:57 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/msp/cacert
s/localhost-11054-ca-org3.pem                                                                                                                                                                                               
2023/02/02 17:07:57 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/msp/IssuerPu
blicKey                                                                                                                                                                                                                     
2023/02/02 17:07:57 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/m
sp/IssuerRevocationPublicKey                                                                                                                                                                                                
Generating the peer0-tls certificates                                                                                                                                                                                       
+ fabric-ca-client enroll -u https://peer0:peer0pw@localhost:11054 --caname ca-org3 -M /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3/../organizations/peerOrganizations/org3.example.co
m/peers/peer0.org3.example.com/tls --enrollment.profile tls --csr.hosts peer0.org3.example.com --csr.hosts localhost --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3/fabr
ic-ca/org3/tls-cert.pem                                                                                                                                                                                                     
2023/02/02 17:07:58 [INFO] TLS Enabled                                                                                                                                                                                      
2023/02/02 17:07:58 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                                 
2023/02/02 17:07:58 [INFO] encoded CSR                                                                                                                                                                                      
2023/02/02 17:07:58 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/signcer
ts/cert.pem                                                                                                                                                                                                                 
2023/02/02 17:07:59 [INFO] Stored TLS root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/tl
scacerts/tls-localhost-11054-ca-org3.pem                                                                                                                                                                                    
2023/02/02 17:07:59 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/IssuerPu
blicKey                                                                                                                                                                                                                     
2023/02/02 17:07:59 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/t
ls/IssuerRevocationPublicKey                                                                                                                                                                                                
Generating the user msp                                                                                                                                                                                                     
+ fabric-ca-client enroll -u https://user1:user1pw@localhost:11054 --caname ca-org3 -M /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3/../organizations/peerOrganizations/org3.example.co
m/users/User1@org3.example.com/msp --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3/fabric-ca/org3/tls-cert.pem                                                           
2023/02/02 17:08:00 [INFO] TLS Enabled                                                                                                                                                                                      
2023/02/02 17:08:00 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                                 
2023/02/02 17:08:00 [INFO] encoded CSR                                                                                                                                                                                      
2023/02/02 17:08:00 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/users/User1@org3.example.com/msp/signcer
ts/cert.pem                                                                                                                                                                                                                 
2023/02/02 17:08:00 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/users/User1@org3.example.com/msp/cacert
s/localhost-11054-ca-org3.pem                                                                                                                                                                                               
2023/02/02 17:08:00 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/users/User1@org3.example.com/msp/IssuerPu
blicKey                                                                                                                                                                                                                     
2023/02/02 17:08:00 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/users/User1@org3.example.com/m
sp/IssuerRevocationPublicKey                                                                                                                                                                                                
Generating the org admin msp                                                                                                                                                                                                
+ fabric-ca-client enroll -u https://org3admin:org3adminpw@localhost:11054 --caname ca-org3 -M /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3/../organizations/peerOrganizations/org3.ex
ample.com/users/Admin@org3.example.com/msp --tls.certfiles /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3/fabric-ca/org3/tls-cert.pem                                                   
2023/02/02 17:08:01 [INFO] TLS Enabled                                                                                                                                                                                      
2023/02/02 17:08:01 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                                                                 
2023/02/02 17:08:01 [INFO] encoded CSR                                                                                                                                                                                      
2023/02/02 17:08:01 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp/signcer
ts/cert.pem                                                                                                                                                                                                                 
2023/02/02 17:08:01 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp/cacert
s/localhost-11054-ca-org3.pem                                                                                                                                                                                               
2023/02/02 17:08:01 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp/IssuerPu
blicKey                                                                                                                                                                                                                     
2023/02/02 17:08:01 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/m
sp/IssuerRevocationPublicKey                                                                                                                                                                                                
Generating CCP files for Org3                                                                                                                                                                                               
/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3/../../bin/configtxgen                                                                                                                    
Generating Org3 organization definition                                                                                                                                                                                     
+ configtxgen -printOrg Org3MSP                                                                                                                                                                                             
2023-02-02 17:08:02.810 EET 0001 INFO [common.tools.configtxgen] main -> Loading configuration                                                                                                                              
2023-02-02 17:08:02.832 EET 0002 INFO [common.tools.configtxgen.localconfig] LoadTopLevel -> Loaded configuration: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3/configtx.yaml         
+ res=0                                                                                                                                                                                                                     
Bringing up Org3 peer                                                                                                                                                                                                       
WARN[0000] Found orphan containers ([ca_org3 cli peer0.org2.example.com orderer.example.com peer0.org1.example.com ca_org2 ca_org1 ca_orderer]) for this project. If you removed or renamed this service in your compose fil
e, you can run this command with the --remove-orphans flag to clean it up.                                                                                                                                                  
[+] Running 2/2                                                                                                                                                                                                             
 ⠿ Volume "compose_peer0.org3.example.com"  Created                                                                                                                                                                    0.0s 
 ⠿ Container peer0.org3.example.com         Started                                                                                                                                                                    0.7s 
Generating and submitting config tx to add Org3                                                                                                                                                                             
Creating config transaction to add org3 to network                                                                                                                                                                          
Using organization 1                                                                                                                                                                                                        
Fetching the most recent configuration block for the channel                                                                                                                                                                
+ peer channel fetch config config_block.pb -o orderer.example.com:7050 --ordererTLSHostnameOverride orderer.example.com -c mychannel --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordere
rOrganizations/example.com/tlsca/tlsca.example.com-cert.pem                                                                                                                                                                 
2023-02-02 15:08:04.544 UTC 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized                                                                                                           
2023-02-02 15:08:04.549 UTC 0002 INFO [cli.common] readBlock -> Received block: 15                                                                                                                                          
2023-02-02 15:08:04.549 UTC 0003 INFO [channelCmd] fetch -> Retrieving last config block: 2                                                                                                                                 
2023-02-02 15:08:04.553 UTC 0004 INFO [cli.common] readBlock -> Received block: 2                                                                                                                                           
+ configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json                                                                                                                         
Decoding config block to JSON and isolating config to config.json                                                                                                                                                           
+ jq '.data.data[0].payload.data.config' config_block.json                                                                                                                                                                  
+ jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"Org3MSP":.[1]}}}}}' config.json ./organizations/peerOrganizations/org3.example.com/org3.json                                                         
+ configtxlator proto_encode --input config.json --type common.Config --output original_config.pb                                                                                                                           
+ configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb                                                                                                                  
+ configtxlator compute_update --channel_id mychannel --original original_config.pb --updated modified_config.pb --output config_update.pb                                                                                  
+ configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate --output config_update.json                                                                                                                
+ jq .                                                                                                                                                                                                                      
++ cat config_update.json                                                                                                                                                                                                   
+ echo '{"payload":{"header":{"channel_header":{"channel_id":"mychannel", "type":2}},"data":{"config_update":{' '"channel_id":' '"mychannel",' '"isolated_data":' '{},' '"read_set":' '{' '"groups":' '{' '"Application":' '
{' '"groups":' '{' '"Org1MSP":' '{' '"groups":' '{},' '"mod_policy":' '"",' '"policies":' '{},' '"values":' '{},' '"version":' '"1"' '},' '"Org2MSP":' '{' '"groups":' '{},' '"mod_policy":' '"",' '"policies":' '{},' '"val
ues":' '{},' '"version":' '"1"' '}' '},' '"mod_policy":' '"",' '"policies":' '{' '"Admins":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Endorsement":' '{' '"mod_policy":' '"",' '"policy":' null
, '"version":' '"0"' '},' '"LifecycleEndorsement":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Readers":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Writers":' '{' '"
mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '}' '},' '"values":' '{' '"Capabilities":' '{' '"mod_policy":' '"",' '"value":' null, '"version":' '"0"' '}' '},' '"version":' '"0"' '}' '},' '"mod_policy":' '"",'
 '"policies":' '{},' '"values":' '{},' '"version":' '"0"' '},' '"write_set":' '{' '"groups":' '{' '"Application":' '{' '"groups":' '{' '"Org1MSP":' '{' '"groups":' '{},' '"mod_policy":' '"",' '"policies":' '{},' '"values
":' '{},' '"version":' '"1"' '},' '"Org2MSP":' '{' '"groups":' '{},' '"mod_policy":' '"",' '"policies":' '{},' '"values":' '{},' '"version":' '"1"' '},' '"Org3MSP":' '{' '"groups":' '{},' '"mod_policy":' '"Admins",' '"po
licies":' '{' '"Admins":' '{' '"mod_policy":' '"Admins",' '"policy":' '{' '"type":' 1, '"value":' '{' '"identities":' '[' '{' '"principal":' '{' '"msp_identifier":' '"Org3MSP",' '"role":' '"ADMIN"' '},' '"principal_class
ification":' '"ROLE"' '}' '],' '"rule":' '{' '"n_out_of":' '{' '"n":' 1, '"rules":' '[' '{' '"signed_by":' 0 '}' ']' '}' '},' '"version":' 0 '}' '},' '"version":' '"0"' '},' '"Endorsement":' '{' '"mod_policy":' '"Admins"
,' '"policy":' '{' '"type":' 1, '"value":' '{' '"identities":' '[' '{' '"principal":' '{' '"msp_identifier":' '"Org3MSP",' '"role":' '"PEER"' '},' '"principal_classification":' '"ROLE"' '}' '],' '"rule":' '{' '"n_out_of"
:' '{' '"n":' 1, '"rules":' '[' '{' '"signed_by":' 0 '}' ']' '}' '},' '"version":' 0 '}' '},' '"version":' '"0"' '},' '"Readers":' '{' '"mod_policy":' '"Admins",' '"policy":' '{' '"type":' 1, '"value":' '{' '"identities"
:' '[' '{' '"principal":' '{' '"msp_identifier":' '"Org3MSP",' '"role":' '"ADMIN"' '},' '"principal_classification":' '"ROLE"' '},' '{' '"principal":' '{' '"msp_identifier":' '"Org3MSP",' '"role":' '"PEER"' '},' '"princi
pal_classification":' '"ROLE"' '},' '{' '"principal":' '{' '"msp_identifier":' '"Org3MSP",' '"role":' '"CLIENT"' '},' '"principal_classification":' '"ROLE"' '}' '],' '"rule":' '{' '"n_out_of":' '{' '"n":' 1, '"rules":' '
[' '{' '"signed_by":' 0 '},' '{' '"signed_by":' 1 '},' '{' '"signed_by":' 2 '}' ']' '}' '},' '"version":' 0 '}' '},' '"version":' '"0"' '},' '"Writers":' '{' '"mod_policy":' '"Admins",' '"policy":' '{' '"type":' 1, '"val
ue":' '{' '"identities":' '[' '{' '"principal":' '{' '"msp_identifier":' '"Org3MSP",' '"role":' '"ADMIN"' '},' '"principal_classification":' '"ROLE"' '},' '{' '"principal":' '{' '"msp_identifier":' '"Org3MSP",' '"role":'
 '"CLIENT"' '},' '"principal_classification":' '"ROLE"' '}' '],' '"rule":' '{' '"n_out_of":' '{' '"n":' 1, '"rules":' '[' '{' '"signed_by":' 0 '},' '{' '"signed_by":' 1 '}' ']' '}' '},' '"version":' 0 '}' '},' '"version"
:' '"0"' '}' '},' '"values":' '{' '"MSP":' '{' '"mod_policy":' '"Admins",' '"value":' '{' '"config":' '{' '"admins":' '[],' '"crypto_config":' '{' '"identity_identifier_hash_function":' '"SHA256",' '"signature_hash_famil
y":' '"SHA2"' '},' '"fabric_node_ous":' '{' '"admin_ou_identifier":' '{' '"certificate":' '"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNLVENDQWMrZ0F3SUJBZ0lVSHNDRGo2a0N5ai9XWmd5VmYwb1RHTHM5cUdvd0NnWUlLb1pJemowRUF3SXcKY1RF
TE1Ba0dBMVVFQmhNQ1ZWTXhGekFWQmdOVkJBZ1REazV2Y25Sb0lFTmhjbTlzYVc1aE1SQXdEZ1lEVlFRSApFd2RTWVd4bGFXZG9NUmt3RndZRFZRUUtFeEJ2Y21jekxtVjRZVzF3YkdVdVkyOXRNUnd3R2dZRFZRUURFeE5qCllTNXZjbWN6TG1WNFlXMXdiR1V1WTI5dE1CNFhEVEl6TURJd01q
RTFNRE13TUZvWERUTTRNREV5T1RFMU1ETXcKTUZvd2NURUxNQWtHQTFVRUJoTUNWVk14RnpBVkJnTlZCQWdURGs1dmNuUm9JRU5oY205c2FXNWhNUkF3RGdZRApWUVFIRXdkU1lXeGxhV2RvTVJrd0Z3WURWUVFLRXhCdmNtY3pMbVY0WVcxd2JHVXVZMjl0TVJ3d0dnWURWUVFECkV4TmpZUzV2
Y21jekxtVjRZVzF3YkdVdVkyOXRNRmt3RXdZSEtvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUUKQW1pbTlTb09uN21wMUY1V0pwS1NtTEs0VkljRzJ6N3RMRDdYZzhyb1JGQTUyTkRaZU4zZmNzWjBGUGlnMW5PeQpPODZQaEJnWTZkM3JKNFZyMmozUUthTkZNRU13RGdZRFZSMFBBUUgvQkFR
REFnRUdNQklHQTFVZEV3RUIvd1FJCk1BWUJBZjhDQVFFd0hRWURWUjBPQkJZRUZPZjNYUjJEbXdWQ3N1aDZzVGQveEtiSFQwWWVNQW9HQ0NxR1NNNDkKQkFNQ0EwZ0FNRVVDSVFDbjcvZUhRYitBeFJ0Z2svaFU1QXlNZmYzUW1KRWZaOENMdWtwVFY1bFA5UUlnWm5vawpadXAzdEE1MDM1N1I3
b1NhaEZqb0xsYUFobzVuUE1iUDRPcC9tSnc9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K",' '"organizational_unit_identifier":' '"admin"' '},' '"client_ou_identifier":' '{' '"certificate":' '"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNL
VENDQWMrZ0F3SUJBZ0lVSHNDRGo2a0N5ai9XWmd5VmYwb1RHTHM5cUdvd0NnWUlLb1pJemowRUF3SXcKY1RFTE1Ba0dBMVVFQmhNQ1ZWTXhGekFWQmdOVkJBZ1REazV2Y25Sb0lFTmhjbTlzYVc1aE1SQXdEZ1lEVlFRSApFd2RTWVd4bGFXZG9NUmt3RndZRFZRUUtFeEJ2Y21jekxtVjRZVzF3
YkdVdVkyOXRNUnd3R2dZRFZRUURFeE5qCllTNXZjbWN6TG1WNFlXMXdiR1V1WTI5dE1CNFhEVEl6TURJd01qRTFNRE13TUZvWERUTTRNREV5T1RFMU1ETXcKTUZvd2NURUxNQWtHQTFVRUJoTUNWVk14RnpBVkJnTlZCQWdURGs1dmNuUm9JRU5oY205c2FXNWhNUkF3RGdZRApWUVFIRXdkU1lX
eGxhV2RvTVJrd0Z3WURWUVFLRXhCdmNtY3pMbVY0WVcxd2JHVXVZMjl0TVJ3d0dnWURWUVFECkV4TmpZUzV2Y21jekxtVjRZVzF3YkdVdVkyOXRNRmt3RXdZSEtvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUUKQW1pbTlTb09uN21wMUY1V0pwS1NtTEs0VkljRzJ6N3RMRDdYZzhyb1JGQTUy
TkRaZU4zZmNzWjBGUGlnMW5PeQpPODZQaEJnWTZkM3JKNFZyMmozUUthTkZNRU13RGdZRFZSMFBBUUgvQkFRREFnRUdNQklHQTFVZEV3RUIvd1FJCk1BWUJBZjhDQVFFd0hRWURWUjBPQkJZRUZPZjNYUjJEbXdWQ3N1aDZzVGQveEtiSFQwWWVNQW9HQ0NxR1NNNDkKQkFNQ0EwZ0FNRVVDSVFD
bjcvZUhRYitBeFJ0Z2svaFU1QXlNZmYzUW1KRWZaOENMdWtwVFY1bFA5UUlnWm5vawpadXAzdEE1MDM1N1I3b1NhaEZqb0xsYUFobzVuUE1iUDRPcC9tSnc9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K",' '"organizational_unit_identifier":' '"client"' '},' '"enable
":' true, '"orderer_ou_identifier":' '{' '"certificate":' '"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNLVENDQWMrZ0F3SUJBZ0lVSHNDRGo2a0N5ai9XWmd5VmYwb1RHTHM5cUdvd0NnWUlLb1pJemowRUF3SXcKY1RFTE1Ba0dBMVVFQmhNQ1ZWTXhGekFWQmdO
VkJBZ1REazV2Y25Sb0lFTmhjbTlzYVc1aE1SQXdEZ1lEVlFRSApFd2RTWVd4bGFXZG9NUmt3RndZRFZRUUtFeEJ2Y21jekxtVjRZVzF3YkdVdVkyOXRNUnd3R2dZRFZRUURFeE5qCllTNXZjbWN6TG1WNFlXMXdiR1V1WTI5dE1CNFhEVEl6TURJd01qRTFNRE13TUZvWERUTTRNREV5T1RFMU1E
TXcKTUZvd2NURUxNQWtHQTFVRUJoTUNWVk14RnpBVkJnTlZCQWdURGs1dmNuUm9JRU5oY205c2FXNWhNUkF3RGdZRApWUVFIRXdkU1lXeGxhV2RvTVJrd0Z3WURWUVFLRXhCdmNtY3pMbVY0WVcxd2JHVXVZMjl0TVJ3d0dnWURWUVFECkV4TmpZUzV2Y21jekxtVjRZVzF3YkdVdVkyOXRNRmt3
RXdZSEtvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUUKQW1pbTlTb09uN21wMUY1V0pwS1NtTEs0VkljRzJ6N3RMRDdYZzhyb1JGQTUyTkRaZU4zZmNzWjBGUGlnMW5PeQpPODZQaEJnWTZkM3JKNFZyMmozUUthTkZNRU13RGdZRFZSMFBBUUgvQkFRREFnRUdNQklHQTFVZEV3RUIvd1FJCk1B
WUJBZjhDQVFFd0hRWURWUjBPQkJZRUZPZjNYUjJEbXdWQ3N1aDZzVGQveEtiSFQwWWVNQW9HQ0NxR1NNNDkKQkFNQ0EwZ0FNRVVDSVFDbjcvZUhRYitBeFJ0Z2svaFU1QXlNZmYzUW1KRWZaOENMdWtwVFY1bFA5UUlnWm5vawpadXAzdEE1MDM1N1I3b1NhaEZqb0xsYUFobzVuUE1iUDRPcC9t
Snc9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K",' '"organizational_unit_identifier":' '"orderer"' '},' '"peer_ou_identifier":' '{' '"certificate":' '"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNLVENDQWMrZ0F3SUJBZ0lVSHNDRGo2a0N5
ai9XWmd5VmYwb1RHTHM5cUdvd0NnWUlLb1pJemowRUF3SXcKY1RFTE1Ba0dBMVVFQmhNQ1ZWTXhGekFWQmdOVkJBZ1REazV2Y25Sb0lFTmhjbTlzYVc1aE1SQXdEZ1lEVlFRSApFd2RTWVd4bGFXZG9NUmt3RndZRFZRUUtFeEJ2Y21jekxtVjRZVzF3YkdVdVkyOXRNUnd3R2dZRFZRUURFeE5q
CllTNXZjbWN6TG1WNFlXMXdiR1V1WTI5dE1CNFhEVEl6TURJd01qRTFNRE13TUZvWERUTTRNREV5T1RFMU1ETXcKTUZvd2NURUxNQWtHQTFVRUJoTUNWVk14RnpBVkJnTlZCQWdURGs1dmNuUm9JRU5oY205c2FXNWhNUkF3RGdZRApWUVFIRXdkU1lXeGxhV2RvTVJrd0Z3WURWUVFLRXhCdmNt
Y3pMbVY0WVcxd2JHVXVZMjl0TVJ3d0dnWURWUVFECkV4TmpZUzV2Y21jekxtVjRZVzF3YkdVdVkyOXRNRmt3RXdZSEtvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUUKQW1pbTlTb09uN21wMUY1V0pwS1NtTEs0VkljRzJ6N3RMRDdYZzhyb1JGQTUyTkRaZU4zZmNzWjBGUGlnMW5PeQpPODZQ
aEJnWTZkM3JKNFZyMmozUUthTkZNRU13RGdZRFZSMFBBUUgvQkFRREFnRUdNQklHQTFVZEV3RUIvd1FJCk1BWUJBZjhDQVFFd0hRWURWUjBPQkJZRUZPZjNYUjJEbXdWQ3N1aDZzVGQveEtiSFQwWWVNQW9HQ0NxR1NNNDkKQkFNQ0EwZ0FNRVVDSVFDbjcvZUhRYitBeFJ0Z2svaFU1QXlNZmYz
UW1KRWZaOENMdWtwVFY1bFA5UUlnWm5vawpadXAzdEE1MDM1N1I3b1NhaEZqb0xsYUFobzVuUE1iUDRPcC9tSnc9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K",' '"organizational_unit_identifier":' '"peer"' '}' '},' '"intermediate_certs":' '[],' '"name":
' '"Org3MSP",' '"organizational_unit_identifiers":' '[],' '"revocation_list":' '[],' '"root_certs":' '[' '"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNLVENDQWMrZ0F3SUJBZ0lVSHNDRGo2a0N5ai9XWmd5VmYwb1RHTHM5cUdvd0NnWUlLb1pJe
mowRUF3SXcKY1RFTE1Ba0dBMVVFQmhNQ1ZWTXhGekFWQmdOVkJBZ1REazV2Y25Sb0lFTmhjbTlzYVc1aE1SQXdEZ1lEVlFRSApFd2RTWVd4bGFXZG9NUmt3RndZRFZRUUtFeEJ2Y21jekxtVjRZVzF3YkdVdVkyOXRNUnd3R2dZRFZRUURFeE5qCllTNXZjbWN6TG1WNFlXMXdiR1V1WTI5dE1CN
FhEVEl6TURJd01qRTFNRE13TUZvWERUTTRNREV5T1RFMU1ETXcKTUZvd2NURUxNQWtHQTFVRUJoTUNWVk14RnpBVkJnTlZCQWdURGs1dmNuUm9JRU5oY205c2FXNWhNUkF3RGdZRApWUVFIRXdkU1lXeGxhV2RvTVJrd0Z3WURWUVFLRXhCdmNtY3pMbVY0WVcxd2JHVXVZMjl0TVJ3d0dnWURWU
VFECkV4TmpZUzV2Y21jekxtVjRZVzF3YkdVdVkyOXRNRmt3RXdZSEtvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUUKQW1pbTlTb09uN21wMUY1V0pwS1NtTEs0VkljRzJ6N3RMRDdYZzhyb1JGQTUyTkRaZU4zZmNzWjBGUGlnMW5PeQpPODZQaEJnWTZkM3JKNFZyMmozUUthTkZNRU13RGdZR
FZSMFBBUUgvQkFRREFnRUdNQklHQTFVZEV3RUIvd1FJCk1BWUJBZjhDQVFFd0hRWURWUjBPQkJZRUZPZjNYUjJEbXdWQ3N1aDZzVGQveEtiSFQwWWVNQW9HQ0NxR1NNNDkKQkFNQ0EwZ0FNRVVDSVFDbjcvZUhRYitBeFJ0Z2svaFU1QXlNZmYzUW1KRWZaOENMdWtwVFY1bFA5UUlnWm5vawpad
XAzdEE1MDM1N1I3b1NhaEZqb0xsYUFobzVuUE1iUDRPcC9tSnc9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K"' '],' '"signing_identity":' null, '"tls_intermediate_certs":' '[],' '"tls_root_certs":' '[' '"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tC
k1JSUNLVENDQWMrZ0F3SUJBZ0lVSHNDRGo2a0N5ai9XWmd5VmYwb1RHTHM5cUdvd0NnWUlLb1pJemowRUF3SXcKY1RFTE1Ba0dBMVVFQmhNQ1ZWTXhGekFWQmdOVkJBZ1REazV2Y25Sb0lFTmhjbTlzYVc1aE1SQXdEZ1lEVlFRSApFd2RTWVd4bGFXZG9NUmt3RndZRFZRUUtFeEJ2Y21jekxtV
jRZVzF3YkdVdVkyOXRNUnd3R2dZRFZRUURFeE5qCllTNXZjbWN6TG1WNFlXMXdiR1V1WTI5dE1CNFhEVEl6TURJd01qRTFNRE13TUZvWERUTTRNREV5T1RFMU1ETXcKTUZvd2NURUxNQWtHQTFVRUJoTUNWVk14RnpBVkJnTlZCQWdURGs1dmNuUm9JRU5oY205c2FXNWhNUkF3RGdZRApWUVFIR
XdkU1lXeGxhV2RvTVJrd0Z3WURWUVFLRXhCdmNtY3pMbVY0WVcxd2JHVXVZMjl0TVJ3d0dnWURWUVFECkV4TmpZUzV2Y21jekxtVjRZVzF3YkdVdVkyOXRNRmt3RXdZSEtvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUUKQW1pbTlTb09uN21wMUY1V0pwS1NtTEs0VkljRzJ6N3RMRDdYZzhyb
1JGQTUyTkRaZU4zZmNzWjBGUGlnMW5PeQpPODZQaEJnWTZkM3JKNFZyMmozUUthTkZNRU13RGdZRFZSMFBBUUgvQkFRREFnRUdNQklHQTFVZEV3RUIvd1FJCk1BWUJBZjhDQVFFd0hRWURWUjBPQkJZRUZPZjNYUjJEbXdWQ3N1aDZzVGQveEtiSFQwWWVNQW9HQ0NxR1NNNDkKQkFNQ0EwZ0FNR
VVDSVFDbjcvZUhRYitBeFJ0Z2svaFU1QXlNZmYzUW1KRWZaOENMdWtwVFY1bFA5UUlnWm5vawpadXAzdEE1MDM1N1I3b1NhaEZqb0xsYUFobzVuUE1iUDRPcC9tSnc9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K"' ']' '},' '"type":' 0 '},' '"version":' '"0"' '}' '},' 
'"version":' '"0"' '}' '},' '"mod_policy":' '"Admins",' '"policies":' '{' '"Admins":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Endorsement":' '{' '"mod_policy":' '"",' '"policy":' null, '"ver
sion":' '"0"' '},' '"LifecycleEndorsement":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Readers":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Writers":' '{' '"mod_pol
icy":' '"",' '"policy":' null, '"version":' '"0"' '}' '},' '"values":' '{' '"Capabilities":' '{' '"mod_policy":' '"",' '"value":' null, '"version":' '"0"' '}' '},' '"version":' '"1"' '}' '},' '"mod_policy":' '"",' '"poli
cies":' '{},' '"values":' '{},' '"version":' '"0"' '}' '}}}}'                                                                                                                                                               
+ configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope --output org3_update_in_envelope.pb                                                                                              
Signing config transaction                                                                                                                                                                                                  
Using organization 1                                                                                                                                                                                                        
+ peer channel signconfigtx -f org3_update_in_envelope.pb                                                                                                                                                                   
2023-02-02 15:08:05.010 UTC 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized                                                                                                           
Submitting transaction from a different peer (peer0.org2) which also signs it                                                                                                                                               
Using organization 2                                                                                                                                                                                                        
+ peer channel update -f org3_update_in_envelope.pb -c mychannel -o orderer.example.com:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organization
s/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem                                                                                                                                                         
2023-02-02 15:08:05.235 UTC 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized                                                                                                           
2023-02-02 15:08:05.257 UTC 0002 INFO [channelCmd] update -> Successfully submitted channel update                                                                                                                          
Config transaction to add org3 to network submitted                                                                                                                                                                         
Joining Org3 peers to network                                                                                                                                                                                               
Using organization 3                                                                                                                                                                                                        
Fetching channel config block from orderer...                                                                                                                                                                               
+ peer channel fetch 0 mychannel.block -o orderer.example.com:7050 --ordererTLSHostnameOverride orderer.example.com -c mychannel --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrga
nizations/example.com/tlsca/tlsca.example.com-cert.pem                                                                                                                                                                      
+ res=0                                                                                                                                                                                                                     
2023-02-02 15:08:05.784 UTC 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized                                                                                                           
2023-02-02 15:08:05.788 UTC 0002 INFO [cli.common] readBlock -> Received block: 0                                                                                                                                           
Joining org3 peer to the channel...                                                                                                                                                                                         
+ peer channel join -b mychannel.block                                                                                                                                                                                      
+ res=0                                                                                                                                                                                                                     
2023-02-02 15:08:09.096 UTC 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized                                                                                                           
2023-02-02 15:08:09.151 UTC 0002 INFO [channelCmd] executeJoin -> Successfully submitted proposal to join channel                                                                                                           
Setting anchor peer for org3...                                                                                                                                                                                             
Using organization 3                                                                                                                                                                                                        
Fetching channel config for channel mychannel                                                                                                                                                                               
Using organization 3                                                                                                                                                                                                        
Fetching the most recent configuration block for the channel                                                                                                                                                                
+ peer channel fetch config config_block.pb -o orderer.example.com:7050 --ordererTLSHostnameOverride orderer.example.com -c mychannel --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordere
rOrganizations/example.com/tlsca/tlsca.example.com-cert.pem                                                                                                                                                                 
2023-02-02 15:08:09.483 UTC 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized                                                                                                           
2023-02-02 15:08:09.485 UTC 0002 INFO [cli.common] readBlock -> Received block: 16                                                                                                                                          
2023-02-02 15:08:09.487 UTC 0003 INFO [channelCmd] fetch -> Retrieving last config block: 16                                                                                                                                
2023-02-02 15:08:09.489 UTC 0004 INFO [cli.common] readBlock -> Received block: 16                                                                                                                                          
Decoding config block to JSON and isolating config to Org3MSPconfig.json                                                                                                                                                    
+ configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json                                                                                                                         
+ jq '.data.data[0].payload.data.config' config_block.json                                                                                                                                                                  
Generating anchor peer update transaction for Org3 on channel mychannel                                                                                                                                                     
+ jq '.channel_group.groups.Application.groups.Org3MSP.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "peer0.org3.example.com","port": 11051}]},"version": "0"}}' Org3MSPconfig.json   
+ configtxlator proto_encode --input Org3MSPconfig.json --type common.Config --output original_config.pb                                                                                                                    
+ configtxlator proto_encode --input Org3MSPmodified_config.json --type common.Config --output modified_config.pb                                                                                                           
+ configtxlator compute_update --channel_id mychannel --original original_config.pb --updated modified_config.pb --output config_update.pb                                                                                  
+ configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate --output config_update.json                                                                                                                
+ jq .                                                                                                                                                                                                                      
++ cat config_update.json                                                                                                                                                                                                   
+ echo '{"payload":{"header":{"channel_header":{"channel_id":"mychannel", "type":2}},"data":{"config_update":{' '"channel_id":' '"mychannel",' '"isolated_data":' '{},' '"read_set":' '{' '"groups":' '{' '"Application":' '
{' '"groups":' '{' '"Org3MSP":' '{' '"groups":' '{},' '"mod_policy":' '"",' '"policies":' '{' '"Admins":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Endorsement":' '{' '"mod_policy":' '"",' '"p
olicy":' null, '"version":' '"0"' '},' '"Readers":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Writers":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '}' '},' '"values":' '{'
 '"MSP":' '{' '"mod_policy":' '"",' '"value":' null, '"version":' '"0"' '}' '},' '"version":' '"0"' '}' '},' '"mod_policy":' '"",' '"policies":' '{},' '"values":' '{},' '"version":' '"1"' '}' '},' '"mod_policy":' '"",' '
"policies":' '{},' '"values":' '{},' '"version":' '"0"' '},' '"write_set":' '{' '"groups":' '{' '"Application":' '{' '"groups":' '{' '"Org3MSP":' '{' '"groups":' '{},' '"mod_policy":' '"Admins",' '"policies":' '{' '"Admi
ns":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Endorsement":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '},' '"Readers":' '{' '"mod_policy":' '"",' '"policy":' null, '"ve
rsion":' '"0"' '},' '"Writers":' '{' '"mod_policy":' '"",' '"policy":' null, '"version":' '"0"' '}' '},' '"values":' '{' '"AnchorPeers":' '{' '"mod_policy":' '"Admins",' '"value":' '{' '"anchor_peers":' '[' '{' '"host":'
 '"peer0.org3.example.com",' '"port":' 11051 '}' ']' '},' '"version":' '"0"' '},' '"MSP":' '{' '"mod_policy":' '"",' '"value":' null, '"version":' '"0"' '}' '},' '"version":' '"1"' '}' '},' '"mod_policy":' '"",' '"polici
es":' '{},' '"values":' '{},' '"version":' '"1"' '}' '},' '"mod_policy":' '"",' '"policies":' '{},' '"values":' '{},' '"version":' '"0"' '}' '}}}}'                                                                         
+ configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope --output Org3MSPanchors.tx                                                                                                       
2023-02-02 15:08:09.921 UTC 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized                                                                                                           
2023-02-02 15:08:09.937 UTC 0002 INFO [channelCmd] update -> Successfully submitted channel update                                                                                                                          
Anchor peer set for org 'Org3MSP' on channel 'mychannel'                                                                                                                                                                    
Channel 'mychannel' joined                                                                                                                                                                                                  
Org3 peer successfully added to network                                                                                                                                                                                     
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3$          
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/addOrg3$ cd ../                                                                                                                 
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ export PATH=${PWD}/../bin:$PATH                                                                                                
export FABRIC_CFG_PATH=$PWD/../config/                                                                                                                                                                                      
export CORE_PEER_TLS_ENABLED=true                                                                                                                                                                                           
export CORE_PEER_LOCALMSPID="Org3MSP"                                                                                                                                                                                       
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt                                                                                          
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp                                                                                                     
export CORE_PEER_ADDRESS=localhost:11051 

(                                                                                                                                                                                           
export CORE_PEER_LOCALMSPID="Org1MSP"                                                                                                                                                                                       
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt                                                                                          
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp                                                                                                     
export CORE_PEER_ADDRESS=localhost:7051   )  
(     unset CORE_PEER_TLS_ENABLED 
unset CORE_PEER_LOCALMSPID 
unset CORE_PEER_TLS_ROOTCERT_FILE 
unset CORE_PEER_MSPCONFIGPATH 
unset CORE_PEER_ADDRESS    )                                                                                                                                                                            

#IMPORTANT to have package.json with the cc for the next
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ peer lifecycle chaincode package basic.tar.gz --path ../asset-transfer-basic/chaincode-typescript/ --lang node --label basic_1.0    
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ peer lifecycle chaincode install basic.tar.gz                                                                                  
2023-02-02 17:17:04.102 EET 0001 INFO [cli.lifecycle.chaincode] submitInstallProposal -> Installed remotely: response:
\tbasic_1.0" >                                                                                                                                                                                                              
2023-02-02 17:17:04.113 EET 0002 INFO [cli.lifecycle.chaincode] submitInstallProposal -> Chaincode code package identifier: basic_1.0:83560be73b1087a10be153fb8036f6420fccde6153b6b0ea848eb1e505f343bf                      
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ peer lifecycle chaincode queryinstalled   
                                                                                     
Installed chaincodes on peer:                                                                                                                                                                                               
Package ID: basic_1.0:83560be73b1087a10be153fb8036f6420fccde6153b6b0ea848eb1e505f343bf, Label: basic_1.0                                                                                                                    
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ export CC_PACKAGE_ID=basic_1.0:83560be73b1087a10be153fb8036f6420fccde6153b6b0ea848eb1e505f343bf               
export CC_PACKAGE_ID=basic_1.0:54dfa08c818b6dcefe7ccf4df48a98e146bf9549b0351b6348d614cbb54ddb24
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --channelID mychannel --name basic --version 1.0 --package-id $CC_PACKAGE_ID --sequence 1        
2023-02-02 17:21:26.382 EET 0001 INFO [chaincodeCmd] ClientWait -> txid [93d6b74f3f5c6a563c47e59a6be0b9bcd662b220982963ed04a3aa3b0536ccb8] committed with status (VALID) at localhost:11051                                 
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ peer lifecycle chaincode querycommitted --channelID mychannel --name basic  
                                                   
Committed chaincode definition for chaincode 'basic' on channel 'mychannel':                                                                                                                                                
Version: 1.0, Sequence: 3, Endorsement Plugin: escc, Validation Plugin: vscc, Approvals: [Org1MSP: true, Org2MSP: true, Org3MSP: true]                                                                                      
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$                                                                                                                                
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- 
CHANGING THE APP FOR ORG3    
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript$ npm install                                                               
                                                                                                                                                                                                              
> asset-transfer-basic@1.0.0 prepare                                                                                                                                                                          
> npm run build                                                                                                                                                                                               
                                                                                                                                                                                                              
                                                                                                                                                                                                              
> asset-transfer-basic@1.0.0 build                                                                                                                                                                            
> tsc                                                                                                                                                                                                         
                                                                                                                                                                                                              
                                                                                                                                                                                                              
up to date, audited 480 packages in 46s                                                                                                                                                                       
                                                                                                                                                                                                              
52 packages are looking for funding                                                                                                                                                                           
  run `npm fund` for details                                                                                                                                                                                  
                                                                                                                                                                                                              
1 moderate severity vulnerability                                                                                                                                                                             
                                                                                                                                                                                                              
To address all issues, run:                                                                                                                                                                                   
  npm audit fix                                                                                                                                                                                               
                                                                                                                                                                                                              
Run `npm audit` for details. 
                                                                                          
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript$ npm start                                                                 
                                                                                                                                                                                                              
> asset-transfer-basic@1.0.0 start                                                                                                                                                                            
> node dist/app.js                                                                                                                                                                                            
                                                                                                                                                                                                              
1                                                                                                                                                                                                             
The value of PORT is : 8000                                                                                                                                                                                   
Example app listening on port 8000!                                                                                                                                                                           
get all assets API!!!                                                                                                                                                                                         
0                                                                                                                                                                                                             
/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@hyperledger/fabric-gateway/dist/gatewayerror.js:39                            
    return new GatewayError({                                                                                                                                                                                 
           ^                                                                                                                                                                                                  
                                                                                                                                                                                                              
GatewayError: 2 UNKNOWN: evaluate call to endorser returned error: chaincode response 500, Error, you are not allowed to read an asset Your attribute is: null but allowed Attributes: cat,dog,newAttributeVal
ue                                                                                                                                                                                                            
    at newGatewayError (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@hyperledger/fabric-gateway/dist/gatewayerror.js:39:12)
    at Object.callback (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@hyperledger/fabric-gateway/dist/client.js:101:67)     
    at Object.onReceiveStatus (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/client.js:195:36)       
    at Object.onReceiveStatus (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/client-interceptors.js:3
65:141)                                                                                                                                                                                                       
    ... 2 lines matching cause stack trace ...                                                                                                                                                                
    at process.processTicksAndRejections (node:internal/process/task_queues:77:11) {                                                                                                                          
  code: 2,                                                                                                                                                                                                    
  details: [                                                                                                                                                                                                  
    {                                                                                                                                                                                                         
      address: 'peer0.org3.example.com:11051',                                                                                                                                                                
      message: 'error in simulation: failed to execute transaction 06bc08f42715d52540072169e0ea68fe9591af4b0d5532a747c0803376a2c0cf: could not launch chaincode basic_1.0:83560be73b1087a10be153fb8036f6420fcc
de6153b6b0ea848eb1e505f343bf: chaincode registration failed: container exited with 1',                                                                                                                        
      mspId: 'Org3MSP'                                                                                                                                                                                        
    },                                                                                                                                                                                                        
    {                                                                                                                                                                                                         
      address: 'peer0.org1.example.com:7051',                                                                                                                                                                 
      message: 'chaincode response 500, Error, you are not allowed to read an asset Your attribute is: null but allowed Attributes: cat,dog,newAttributeValue',                                               
      mspId: 'Org1MSP'                                                                                                                                                                                        
    }                                                                                                                                                                                                         
  ],                                                                                                                                                                                                          
  cause: Error: 2 UNKNOWN: evaluate call to endorser returned error: chaincode response 500, Error, you are not allowed to read an asset Your attribute is: null but allowed Attributes: cat,dog,newAttributeV
alue                                                                                                                                                                                                          
      at Object.callErrorFromStatus (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/call.js:31:19)    
      at Object.onReceiveStatus (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/client.js:195:52)     
      at Object.onReceiveStatus (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/client-interceptors.js
:365:141)                                                                                                                                                                                                     
      at Object.onReceiveStatus (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/client-interceptors.js
:328:181)                                                                                                                                                                                                     
      at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/call-stream.js:188:78                         
      at process.processTicksAndRejections (node:internal/process/task_queues:77:11)                                                                                                                          
  for call at                                                                                                                                                                                                 
      at Client.makeUnaryRequest (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@grpc/grpc-js/build/src/client.js:163:34)    
      at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@hyperledger/fabric-gateway/dist/client.js:44:110                     
      at new Promise ()                                                                                                                                                                            
      at GatewayClientImpl.evaluate (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@hyperledger/fabric-gateway/dist/client.js
:44:16)                                                                                                                                                                                                       
      at ProposalImpl.evaluate (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/node_modules/@hyperledger/fabric-gateway/dist/proposal.js:50
:96)                                                                                                                                                                                                          
      at async getAllAssets (/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/dist/app.js:102:25)                                            
      at async /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript/dist/app.js:239:21 {                                                         
    code: 2,                                                                                                                                                                                                  
    details: 'evaluate call to endorser returned error: chaincode response 500, Error, you are not allowed to read an asset Your attribute is: null but allowed Attributes: cat,dog,newAttributeValue',       
    metadata: Metadata {                                                                                                                                                                                      
      internalRepr: Map(2) {                                                                                                                                                                                  
        'content-type' => [ 'application/grpc' ],                                                                                                                                                             
        'grpc-status-details-bin' => [                                                                                                                                                                        
          Buffer(780) [Uint8Array] [                                                                                                                                                                          
              8,   2,  18, 183,   1, 101, 118,  97, 108, 117,  97, 116,                                                                                                                                       
            101,  32,  99,  97, 108, 108,  32, 116, 111,  32, 101, 110,                                                                                                                                       
            100, 111, 114, 115, 101, 114,  32, 114, 101, 116, 117, 114,                                                                                                                                       
            110, 101, 100,  32, 101, 114, 114, 111, 114,  58,  32,  99,                                                                                                                                       
            104,  97, 105, 110,  99, 111, 100, 101,  32, 114, 101, 115,                                                                                                                                       
            112, 111, 110, 115, 101,  32,  53,  48,  48,  44,  32,  69,                                                                                                                                       
            114, 114, 111, 114,  44,  32, 121, 111, 117,  32,  97, 114,                                                                                                                                       
            101,  32, 110, 111, 116,  32,  97, 108, 108, 111, 119, 101,                                                                                                                                       
            100,  32, 116, 111,                                                                                                                                                                               
            ... 680 more items                                                                                                                                                                                
          ]                                                                                                                                                                                                   
        ]                                                                                                                                                                                                     
      },                                                                                                                                                                                                      
      options: {}                                                                                                                                                                                             
    }                                                                                                                                                                                                         
  }                                                                                                                                                                                                           
}                                                                                                                                                                                                             
                                                                                                                                                                                                              
Node.js v18.1.0                                                                                                                                                                                               
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/asset-transfer-basic/application-gateway-typescript$                                                                           


*************************************************************
export PATH=${PWD}/../bin:${PWD}:$PATH                                                                     
export FABRIC_CFG_PATH=$PWD/../config/                                                                                                                                                                  
export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/org3.example.com/                                                                                                                   
(export  CONTAINER_CLI=docker 
export  CONTAINER_CLI_COMPOSE=docker-compose)
s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ fabric-ca-client identity modify user1 --id.secret user1pw --attrs newAttributeName=newAttributeValue:ecert --tls.certfiles "${PWD}/addOrg3/fabric-ca/org3/tls-cert.pem" 
   
2023/02/03 19:09:40 [INFO] Configuration file location: /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example
.com/fabric-ca-client-config.yaml                                                                                                                                              
2023/02/03 19:09:40 [INFO] TLS Enabled                                                                                                                                         
2023/02/03 19:09:41 [INFO] TLS Enabled                                                                                                                                         
Successfully modified identity - Name: user1, Type: client, Affiliation: , Max Enrollments: -1, Secret: , Attributes: [{Name:hf.EnrollmentID Value:user1 ECert:true} {Name:hf.T
ype Value:client ECert:true} {Name:hf.Affiliation Value: ECert:true} {Name:newAttributeName Value:newAttributeValue ECert:true}]                                               

s_linux@s-lenovo:/mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network$ fabric-ca-client enroll -u https://user1:user1pw@localhost:11054 --caname ca-org3 -M ${PWD}/organizations/peerOrganizations/org3.example.com/users/User1@org3.example.com/msp --tls.certfiles ${PWD}/addOrg3/fabric-ca/org3/tls-cert.pem                     
                                                                                                                                                                               
2023/02/03 19:12:36 [INFO] TLS Enabled                                                                                                                                         
2023/02/03 19:12:36 [INFO] generating key: &{A:ecdsa S:256}                                                                                                                    
2023/02/03 19:12:36 [INFO] encoded CSR                                                                                                                                         
2023/02/03 19:12:36 [INFO] Stored client certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example
.com/users/user1@org3.example.com/msp/signcerts/cert.pem                                                                                                                       
2023/02/03 19:12:36 [INFO] Stored root CA certificate at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.exampl
e.com/users/user1@org3.example.com/msp/cacerts/localhost-11054-ca-org3.pem                                                                                                     
2023/02/03 19:12:36 [INFO] Stored Issuer public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/org3.example.
com/users/user1@org3.example.com/msp/IssuerPublicKey                                                                                                                           
2023/02/03 19:12:36 [INFO] Stored Issuer revocation public key at /mnt/c/Users/stamz/go/src/github.com/112801706/fabric-samples/test-network/organizations/peerOrganizations/or
g3.example.com/users/user1@org3.example.com/msp/IssuerRevocationPublicKey    





                                                                                                  










After doing the same steps for all orgs to install the new cc you need to commit the cc by 
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --channelID mychannel --name basic --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" --peerAddresses localhost:11051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt" --version 1.0 --sequence 4
docker load -i images.tar
docker system prune



****************************************************************************************************************************
ADD MORE ORGS
****************************************************************************************************************************
network/addOrg4/fabric-ca/org4$ export PATH=${PWD}/../../../../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}/../../../../config/
export FABRIC_CA_CLIENT_HOME=${PWD}/../../../organizations/peerOrganizations/org4.example.com/
export CONTAINER_CLI=docker
export CONTAINER_CLI_COMPOSE=docker-compose

fabric-ca-server init -b org4admin:org4adminpw (TO CREATE MSP/KEYSTOR AND CA-CERT.PM)

test-network/addOrg4/fabric-ca/org4$ fabric-ca-server start -b org4admin:org4adminpw

new terminal
addOrg4/fabric-ca/org4$ export PATH=${PWD}/../../../../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}/../../../../config/
export FABRIC_CA_CLIENT_HOME=${PWD}/../../../organizations/peerOrganizations/org4.example.com/
export CONTAINER_CLI=docker
export CONTAINER_CLI_COMPOSE=docker-compose

mistake(fabric-ca-client enroll -u https://peer0:peer0pw@localhost:13054
 --caname ca-org4 -M /home/s_linux/work/PUZZLE_blockchain_project/add_more_orgs/fabric-samples/test-network/organizations/peerOrganizations/org4.example.com/peers/peer0.org4.example.com/msp --tls.certfiles /home/s_linux/work/PUZZLE_blockchain_project/add_more_orgs/fabric-samples/test-network/addOrg4/fabric-ca/ca-cert.pem)