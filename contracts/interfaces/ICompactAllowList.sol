/**
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2022 Adrian Soghoian
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
pragma solidity ^0.8.0;

struct Node {
    address value;
    uint leftChildIndex;
    uint rightChildIndex;
}

struct ProofItem {
    bytes32 leftChildHash; 
    bytes32 rightChildHash;
    address value;
    uint index;
}

interface ICompactAllowList {

    /**********************/
    /* EVENT DECLARATIONS */
    /**********************/

    event ListUpdated(bytes32 rootHash);

    /*****************************/
    /* LOGIC */
    /*****************************/

    /**
     * @dev Produce a new root hash given a set
     */
    function calculateTreeHash(address[] memory entries) external pure returns (bytes32);

    /**
     * @dev Updates the persisted root hash. 
     */
    function reset(bytes32 rootHash) external;

    /**
     * @dev Calculates a set of ProofElement for a given element. Used in verification. 
     */
    function proofForItem(address[] memory allAddresses, address member) external pure returns (ProofItem[] memory);

    /**
     * @dev Verifies whether the member is in the original set given the proofs.
     */
    function verifyProof(ProofItem[] memory proofs, address member) external view returns (bool);

}