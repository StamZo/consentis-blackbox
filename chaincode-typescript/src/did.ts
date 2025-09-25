import { Object, Property } from 'fabric-contract-api';

@Object()
export class DID {
    @Property()
    public docType: string = 'DID';

    @Property()
    public didID: string; // base64 or hex-encoded public key (used as the primary key)

    @Property()
    public creator: string; // base64 or hex-encoded public key (used as the primary key)

    @Property()
    public revoked: boolean = false;

    @Property()
    public createdTimestamp: string = '';

    @Property()
    public revokedTimestamp: string | null = null;

    @Property()
    public auditTrail: DIDAuditEvent[] = [];
}

@Object() 
export class DIDAuditEvent {
    @Property()
    public timestamp: string; // ISO 8601 date

    @Property()
    public revoked: boolean;

    @Property()
    public txId: string; // Transaction ID for traceability
}
