
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./interfaces/ICompactAllowList.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CompactAllowList is Ownable, ICompactAllowList {

    bytes32 private _rootHash;

    function calculateTreeHash(address[] memory entries) external pure override returns (bytes32) {
        require(entries.length > 0, "CAL:EMPTY_SET");
        Node[] memory tree = _buildTree(entries, 0, entries.length);
        bytes32[] memory hashes = _computeHashes(tree);
        return hashes[0];
    }

    function reset(bytes32 rootHash) external override onlyOwner {
        _rootHash = rootHash;
        emit ListUpdated(rootHash);
    }

    function proofForItem(address[] memory allAddresses, address member) public pure override returns (ProofItem[] memory) {
        Node[] memory tree = _buildTree(allAddresses, 0, allAddresses.length);
        bytes32[] memory hashes = _computeHashes(tree);
        return _convertToProofForElement(tree, hashes, member);
    }

    function verifyProof(ProofItem[] memory proofs, address member) public view override returns (bool) {
        if (proofs.length == 0) {
            return false;
        }

        bytes32 runningHash = bytes32(0);
        for (uint i = proofs.length; i > 0; i--) {
            ProofItem memory proof = proofs[i - 1];
            if (i == proofs.length) {
                runningHash = _performHashing(
                    proof.leftChildHash,
                    proof.rightChildHash,
                    member // This is the leaf
                );
            } else {
                if (proof.leftChildHash == runningHash) {
                    runningHash = _performHashing(
                        runningHash,
                        proof.rightChildHash,
                        proof.value
                    );
                } else if (proof.rightChildHash == runningHash && runningHash != "") {
                    runningHash = _performHashing(
                        proof.leftChildHash,
                        runningHash,
                        proof.value
                    );
                } else {
                    // Short circuit -- chain has broken
                    return false;
                }
            }
        }

        return runningHash == _rootHash;
    }

    function buildTree(address[] memory entries) public pure returns (Node[] memory) {
        return _buildTree(entries, 0, entries.length);
    }

    function _performHashing(bytes32 leftHash, bytes32 rightHash, address value) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            leftHash, value, rightHash
        ));
    }

    function _convertToProofForElement(
        Node[] memory tree, 
        bytes32[] memory hashes,
        address element
    ) internal pure returns (ProofItem[] memory) {
        if (tree.length == 0) {
            return new ProofItem[](0);
        }

        return _findPathToMatchingElement(tree, hashes, 0, element);
    }

    function _findPathToMatchingElement(
        Node[] memory tree, 
        bytes32[] memory hashes,
        uint nodeIndex,
        address element
    ) internal pure returns (
        ProofItem[] memory
    ) {
        Node memory node = tree[nodeIndex];

        ProofItem memory currentItem = ProofItem({
            leftChildHash: node.leftChildIndex != 0 ? hashes[node.leftChildIndex] : bytes32(0),
            rightChildHash: node.rightChildIndex != 0 ? hashes[node.rightChildIndex] : bytes32(0),
            value: node.value,
            index: nodeIndex
        });

        if (node.value == element) {
            ProofItem[] memory matches = new ProofItem[](1);
            matches[0] = currentItem;
            return matches;
        }

        // Check left and right
        if (node.leftChildIndex != 0) {
            ProofItem[] memory leftSide = _findPathToMatchingElement(tree, hashes, node.leftChildIndex, element);
            if (leftSide.length > 0) {
                ProofItem[] memory combined = new ProofItem[](leftSide.length + 1);
                combined[0] = currentItem;
                for (uint i = 0; i < leftSide.length; i++) {
                    combined[i + 1] = leftSide[i];
                }
                return combined;
            }
        }

        if (node.rightChildIndex != 0) {
            ProofItem[] memory rightSide = _findPathToMatchingElement(tree, hashes, node.rightChildIndex, element);
            if (rightSide.length > 0) {
                ProofItem[] memory combined = new ProofItem[](rightSide.length + 1);
                combined[0] = currentItem;
                for (uint i = 0; i < rightSide.length; i++) {
                    combined[i + 1] = rightSide[i];
                }
                return combined;
            }
        }

        return new ProofItem[](0);
    }

    function _buildTree(address[] memory entries, uint indexOffset, uint totalSize) internal pure returns (Node[] memory) {
        if (entries.length == 0) {
            return new Node[](0);
        }
        
        uint leftChildIndex = 2 * indexOffset + 1 > totalSize - 1 ? 0 : 2 * indexOffset + 1;
        uint rightChildIndex = 2 * indexOffset + 2 > totalSize - 1 ? 0 : 2 * indexOffset + 2;

        Node memory node = Node({
            value: entries[0],
            leftChildIndex: leftChildIndex,
            rightChildIndex: rightChildIndex
        });

        address[] memory remainingAddresses = new address[](entries.length - 1);
        for (uint i = 1; i < entries.length; i++) {
            remainingAddresses[i - 1] = entries[i];
        }

        Node[] memory remainingEntries = _buildTree(remainingAddresses, indexOffset + 1, totalSize);
        Node[] memory tree = new Node[](entries.length);
        tree[0] = node;
        for (uint i = 0; i < remainingEntries.length; i++) {
            tree[i + 1] = remainingEntries[i];
        }

        return tree; 
    }

    function _computeHashes(Node[] memory tree) internal pure returns (bytes32[] memory) {
        bytes32[] memory hashes = new bytes32[](tree.length);
        _computeAndAssignHashes(tree, hashes, 0);
        return hashes;
    }

    function _computeAndAssignHashes(Node[] memory tree, bytes32[] memory hashes, uint index) internal pure {
        if (tree.length == 0) {
            return;
        }

        Node memory node = tree[index];

        bytes32 leftChildHash = bytes32(0);
        bytes32 rightChildHash = bytes32(0);

        if (node.leftChildIndex != 0) {
            _computeAndAssignHashes(tree, hashes, node.leftChildIndex);
            leftChildHash = hashes[node.leftChildIndex];
        }

        if (node.rightChildIndex != 0) {
            _computeAndAssignHashes(tree, hashes, node.rightChildIndex);
            rightChildHash = hashes[node.rightChildIndex];
        }

        bytes32 nodeHash = _performHashing(
            leftChildHash, 
            rightChildHash, 
            node.value
        );
        hashes[index] = nodeHash;
    }

}