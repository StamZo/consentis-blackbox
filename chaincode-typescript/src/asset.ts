import { Object, Property } from 'fabric-contract-api';

@Object()
export class VcAnchor {
    @Property()
    public docType: string = 'vcAnchor';

    @Property()
    public assetId: string; // base64 or hex-encoded public key (used as the primary key)

     @Property()
    public creator: string; 

    @Property()
    public holderBindingHash: string; // hash PEM-formatted public key

    // @Property()
    // public vcHash: string; // hash of the VC (e.g., SHA256, hex/base64)

    @Property()
    public policyHash: string; // hash of the policy (e.g., SHA256, hex/base64)

   @Property()
    public templateHash: string; // hash of the template (e.g., SHA256, hex/base64)

    @Property() 
    public validUntil: string | null = null; 

    @Property() 
    public status: 'active' | 'revoked' | 'expired' = 'active';

    @Property() 
    public assuranceLevel?: string; // e.g., "AL1" | "AL2" | "AL3"

    @Property() 
    public allowedPurposeHash?: string[];
    
    @Property()
    public allowedOperationHash?: string[];

    @Property()
    public constraintsSet?: string[];

    @Property()
    public createdTimestamp: string = '';

    @Property()
    public revokedTimestamp: string | null = null;

    @Property()
    public auditTrail: AuditEvent[] = [];
}

@Object() 
export class AuditEvent {
    @Property()
    public timestamp: string; // ISO 8601 date

    @Property()
    public revoked: boolean | null = null; // For revocation events; null for access logs

    @Property()
    public txId: string; // Transaction ID for traceability

    // @Property()
    // public accessRequestHash: string | null = null; // SHA-256 hex of accessRequest JSON (for access logs; null for revocations)

    @Property()
    public accessResult: boolean | null = null; // Success/fail for access attempts (null for revocations)

    @Property() public purpose?: string[] | null;   // hashes
  
    @Property() public operation?: string[] | null; // hashes
  
    @Property() public reason?: string | null;      // e.g. "revoked" | "expired" | "purpose_not_allowed" | "operation_not_allowed" | "invalid_request"

}