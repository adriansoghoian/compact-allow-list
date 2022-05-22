
pragma solidity ^0.8.0;

import "./interfaces/ICompactAllowList.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SamplePermissionedContract is Ownable {

    address private _allowListAddress;
    ICompactAllowList private _allowList;

    uint private counter;

    modifier onlyAllowed(ProofItem[] memory proofs) {
        require(_allowListAddress != address(0));
        require(_allowList.verifyProof(proofs, msg.sender));
        _;
    }

    function performSensitiveAction(ProofItem[] memory proofs) external onlyAllowed(proofs) {
        counter++;
    }

    function performNonSensitiveAction() public view returns (uint) {
        return counter;
    }

    function setAllowList(address allowList) public onlyOwner {
        if (allowList != address(0)) {
            _allowListAddress = allowList;
            _allowList = ICompactAllowList(allowList);
        }
    }

    function getAllowList() public view returns (address) {
        return _allowListAddress;
    }

}