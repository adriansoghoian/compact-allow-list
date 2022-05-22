const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SamplePermissionedContract", function () {
  
    const ADDRESS_1 = '0x0000000000000000000000000000000000000001';
    const ADDRESS_2 = '0x0000000000000000000000000000000000000002';
    const ADDRESS_3 = '0x0000000000000000000000000000000000000003';
    const ADDRESS_4 = '0x0000000000000000000000000000000000000004';
    const ADDRESS_5 = '0x0000000000000000000000000000000000000005';
    const ADDRESS_6 = '0x0000000000000000000000000000000000000006';
    const ADDRESS_7 = '0x0000000000000000000000000000000000000007';
    const ADDRESS_8 = '0x0000000000000000000000000000000000000008';
  
    const MEMBERS = [
      ADDRESS_1,
      ADDRESS_2,
      ADDRESS_3,
      ADDRESS_4,
      ADDRESS_5,
      ADDRESS_6,
      ADDRESS_7,
      ADDRESS_8
    ]

  before(async function () {
    this.SamplePermissionedContract = await ethers.getContractFactory('SamplePermissionedContract');
    this.CompactAllowList = await ethers.getContractFactory('CompactAllowList');

    this.sampleContract = await this.SamplePermissionedContract.deploy();
    await this.sampleContract.deployed();

    this.allowList = await this.CompactAllowList.deploy();
    await this.allowList.deployed();
  });

  it('sets allow list', async function () {
    await this.sampleContract.setAllowList(await this.allowList.resolvedAddress);
    const setAllowList = await this.sampleContract.getAllowList();
    expect(setAllowList).to.equal(await this.allowList.resolvedAddress);
  });

  it('rejects calls that require permissioning', async function () {
    await expect(
        this.sampleContract
        .performSensitiveAction([])
      ).to.be.revertedWith('');
  });

  it('allows calls to non sensitive functions', async function () {
    expect(
        await this.sampleContract
        .performNonSensitiveAction()
      ).to.equal(0);
  });


  it('allow list is populated with members, no sender', async function () {
    const hashValue = await this.allowList.calculateTreeHash(MEMBERS);
    await this.allowList.reset(hashValue);

    await expect(
        this.sampleContract
        .performSensitiveAction([])
      ).to.be.revertedWith('');
  });

  it('allow list is populated with members including sender', async function () {
    const [owner] = await ethers.getSigners();
    const updatedList = MEMBERS.concat([owner.address]);
    const hashValue = await this.allowList.calculateTreeHash(updatedList);
    await this.allowList.reset(hashValue);

    const proof = await this.allowList.proofForItem(updatedList, owner.address);

    const txn = await this.sampleContract.performSensitiveAction(proof);
    txn.wait();

    expect(await this.sampleContract.performNonSensitiveAction()).to.equal(1);
  });

});