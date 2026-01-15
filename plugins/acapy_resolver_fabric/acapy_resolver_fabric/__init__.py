from acapy_agent.config.injection_context import InjectionContext
from acapy_agent.resolver.did_resolver import DIDResolver
from acapy_agent.wallet.did_method import DIDMethod, DIDMethods, HolderDefinedDid
from acapy_agent.wallet.key_type import ED25519

from .fabric_resolver import FabricResolver

FABRIC_METHOD = DIDMethod(
    name="fabric",
    key_types=[ED25519],
    rotation=True,
    holder_defined_did=HolderDefinedDid.REQUIRED,
)

async def setup(context: InjectionContext):
    methods = context.inject(DIDMethods)
    methods.register(FABRIC_METHOD)

    resolver = FabricResolver()
    await resolver.setup(context)

    registry = context.inject(DIDResolver)
    # ACA-Py 1.3: register, don't append
    registry.register_resolver(resolver)
