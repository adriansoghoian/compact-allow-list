const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CompactAllowList", function () {
  const ADDRESS_1 = '0x0000000000000000000000000000000000000001';
  const ADDRESS_2 = '0x0000000000000000000000000000000000000002';
  const ADDRESS_3 = '0x0000000000000000000000000000000000000003';
  const ADDRESS_4 = '0x0000000000000000000000000000000000000004';
  const ADDRESS_5 = '0x0000000000000000000000000000000000000005';
  const ADDRESS_6 = '0x0000000000000000000000000000000000000006';
  const ADDRESS_7 = '0x0000000000000000000000000000000000000007';
  const ADDRESS_8 = '0x0000000000000000000000000000000000000008';

  const balancedInputs = [
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
    this.CompactAllowList = await ethers.getContractFactory('CompactAllowList');
  });

  beforeEach(async function () {
    this.allowList = await this.CompactAllowList.deploy();
    await this.allowList.deployed();
  });

  it('builds empty tree for empty case', async function () {
    const tree = await this.allowList.buildTree([]);
    expect(tree).to.be.empty;
  });

  it('builds single node for single case', async function () {
    const tree = await this.allowList.buildTree([ADDRESS_1]);
    expect(tree.length).to.equal(1);
    expect(tree[0].value).to.equal(ADDRESS_1);
    expect(tree[0].leftChildIndex).to.equal(0);
    expect(tree[0].rightChildIndex).to.equal(0);
  });

  it('builds unbalanced tree for 2 addresses', async function () {
    const tree = await this.allowList.buildTree([ADDRESS_1, ADDRESS_2]);
    expect(tree.length).to.equal(2);
    expect(tree[0].value).to.equal(ADDRESS_1);
    expect(tree[0].leftChildIndex).to.equal(1);
    expect(tree[0].rightChildIndex).to.equal(0);

    expect(tree[1].value).to.equal(ADDRESS_2);
    expect(tree[1].leftChildIndex).to.equal(0);
    expect(tree[1].rightChildIndex).to.equal(0);
  });

  it('builds balanced tree for 3 elements', async function () {
    const tree = await this.allowList.buildTree([ADDRESS_1, ADDRESS_2, ADDRESS_3]);
    expect(tree.length).to.equal(3);
    expect(tree[0].value).to.equal(ADDRESS_1);
    expect(tree[0].leftChildIndex).to.equal(1);
    expect(tree[0].rightChildIndex).to.equal(2);

    expect(tree[1].value).to.equal(ADDRESS_2);
    expect(tree[1].leftChildIndex).to.equal(0);
    expect(tree[1].rightChildIndex).to.equal(0);

    expect(tree[2].value).to.equal(ADDRESS_3);
    expect(tree[2].leftChildIndex).to.equal(0);
    expect(tree[2].rightChildIndex).to.equal(0);
  });

  it('builds 3 level tree for 5 elements', async function () {
    const tree = await this.allowList.buildTree([
      ADDRESS_1, 
      ADDRESS_2, 
      ADDRESS_3,
      ADDRESS_4,
      ADDRESS_5
    ]);

    expect(tree.length).to.equal(5);
    expect(tree[0].value).to.equal(ADDRESS_1);
    expect(tree[0].leftChildIndex).to.equal(1);
    expect(tree[0].rightChildIndex).to.equal(2);

    expect(tree[1].value).to.equal(ADDRESS_2);
    expect(tree[1].leftChildIndex).to.equal(3);
    expect(tree[1].rightChildIndex).to.equal(4);

    expect(tree[2].value).to.equal(ADDRESS_3);
    expect(tree[2].leftChildIndex).to.equal(0);
    expect(tree[2].rightChildIndex).to.equal(0);

    expect(tree[3].value).to.equal(ADDRESS_4);
    expect(tree[3].leftChildIndex).to.equal(0);
    expect(tree[3].rightChildIndex).to.equal(0);

    expect(tree[4].value).to.equal(ADDRESS_5);
    expect(tree[4].leftChildIndex).to.equal(0);
    expect(tree[4].rightChildIndex).to.equal(0);
  });

  it('creates root hash for single node', async function () {
    const hash = await this.allowList.calculateTreeHash([
      ADDRESS_1
    ]);
    expect(hash).to.equal('0x4a11e8d2ed8da733fcaa4e17f4412f9b9d61f5c42218367f3a293b19bfcdbd57');
  });

  it('creates root hash for two nodes', async function () {
    const hash = await this.allowList.calculateTreeHash([
      ADDRESS_1,
      ADDRESS_2
    ]);
    expect(hash).to.equal('0x258c451047cea222b23d1073ace0780238a98fdb4276fd5f18e34e6460359e61');
  });

  it('creates root hash for three nodes', async function () {
    const hash = await this.allowList.calculateTreeHash([
      ADDRESS_1,
      ADDRESS_2,
      ADDRESS_3
    ]);
    expect(hash).to.equal('0xa2d979d4d7b4507cd70654c70828d5339b00b8c041f3abc9151ee2e52d899488');
  });

  it('can prove inclusion for one address', async function () {
    const newValue = await this.allowList.calculateTreeHash(balancedInputs);
    await this.allowList.reset(newValue);

    const proof = await this.allowList.proofForItem(balancedInputs, ADDRESS_1);
    const isValid = await this.allowList.verifyProof(proof, ADDRESS_1);
    expect(isValid).to.be.true;
  });

  it('can prove inclusion for a 2nd address', async function () {
    const newValue = await this.allowList.calculateTreeHash(balancedInputs);
    await this.allowList.reset(newValue);

    const proof = await this.allowList.proofForItem(balancedInputs, ADDRESS_4);
    const isValid = await this.allowList.verifyProof(proof, ADDRESS_4);
    expect(isValid).to.be.true;
  });

  it('can prove address not included ', async function () {
    const newValue = await this.allowList.calculateTreeHash([
      ADDRESS_1, 
      ADDRESS_2, 
      ADDRESS_3,
      ADDRESS_4,
      ADDRESS_5
    ]);
    await this.allowList.reset(newValue);

    const proof = await this.allowList.proofForItem([
      ADDRESS_1, 
      ADDRESS_2, 
      ADDRESS_3,
      ADDRESS_4,
      ADDRESS_5
    ], ADDRESS_4);

    const isValid = await this.allowList.verifyProof(proof, ADDRESS_6);
    expect(isValid).to.be.false;
  });

  it('returns empty proof set if element not in set', async function () {
    const valueSet = [
      ADDRESS_1, 
      ADDRESS_2, 
      ADDRESS_3,
      ADDRESS_4,
      ADDRESS_5
    ];
    const newValue = await this.allowList.calculateTreeHash(valueSet);
    const txn = await this.allowList.reset(newValue);
    txn.wait();

    const proof = await this.allowList.proofForItem(valueSet, ADDRESS_6); // not in list

    const isValid = await this.allowList.verifyProof(proof, ADDRESS_6);
    expect(isValid).to.be.false;
  });

});
