# Compact Allow List

This is a crude, completely unoptimized, and wholey unaudited implementation of a Merkle Tree-like data structure in Solidity. More on Merkle Trees here: https://en.wikipedia.org/wiki/Merkle_tree. This was implemented as a learning exercise, not for use. 

The idea being that a smart contract needing to manage access policies around an allowlist / whitelist can use this data structure and its minimal persistent storage requirements (only a `bytes32` hash) to prove whether a member is included in its list original allow list or not. 

# Installation 

Clone, cd, and install local dependencies: `npm install --save-dev`. Then run the tests: `./run-tests.sh` using Hardat. 

# Implementation Details 

Rather than storing all data just in leaf nodes, this implementation packs the data itself into all the nodes, producing a tree data structure like so:

```
struct TreeElement {
    address value;
    uint leftChildIndex;
    uint rightChildIndex;
}

....
TreeElement[] memory myTree // indices to children in array
```

Normally the logic for generating the proof would live-client side, but these are implemented as part of the same package and exposed as view / pure functions for ease of use and debugging. 

A `SamplePermissionedContract` is implemented demonstrating how this might be used. The contract has a reference to a `CompactAllowList` instance, and has a modifier like so:

```
modifier onlyAllowed(ProofItem[] memory proofs) {
    require(_allowList.verifyProof(proofs, msg.sender));
    _;
}
```

And a permissioned sample function like so: 

```
function performSensitiveAction(ProofItem[] memory proofs) external onlyAllowed(proofs) {
    counter++;
}
```