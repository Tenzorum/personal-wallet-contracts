const PersonalWallet = artifacts.require('./PersonalWallet.sol');
var utils = require('web3-utils');

let wallet;
let owner;
let master1;
let device2;

let oneEther = web3.toWei(1, "ether");
let halfEther = web3.toWei(0.5, "ether");
let tenthOfEther = web3.toWei(0.1, "ether");
let fourTenthOfEther = web3.toWei(0.4, "ether");

let etherRewardAddress = '0x0000000000000000000000000000000000000000';

contract('PersonalWalletTest', (accounts) => {

    beforeEach(async () => {
        owner = accounts[0];
        master1 = accounts[1];
        device2 = accounts[2];

        wallet = await PersonalWallet.new(master1);
        //make sure wallet contract has some ether first
        await web3.eth.sendTransaction({
            from: owner,
            to: wallet.address,
            value: oneEther
        });
    });

    let expectRevert = function(e, msg) {
        assert(e.message.search('revert') >= 0, msg);
    }

    let getRSV = function(signedMsg) {
        const r = signedMsg.substr(0, 66);
        const s = '0x' + signedMsg.substr(66, 64);
        const v = '0x' + signedMsg.substr(130, 2);
        const v_decimal = web3.toDecimal(v) + 27;
        return [v_decimal, r, s];
    };

    let signAndExecute = async function(from, to, value, data, rewardType, rewardAmount) {
        let nonce = await wallet.nonces.call(from);
        let hash = utils.soliditySha3(wallet.address, from, to, value, data,
            rewardType, rewardAmount, nonce);
        let signedHash = await web3.eth.sign(from, hash);
        let [v, r, s] = getRSV(signedHash);
        await wallet.execute(v, r, s, from, to, value, 
            data, rewardType, rewardAmount, {from: owner});
    }

    it("send some ether using signing, with zero fee", async () => {
        await signAndExecute(master1, device2, halfEther, '0x', etherRewardAddress, 0);
        assert(halfEther == await web3.eth.getBalance(wallet.address), "contract has send some ether");
    });

    it("send some ether using signing, take some ether as fee", async () => {
        await signAndExecute(master1, device2, halfEther, '0x', etherRewardAddress, tenthOfEther);
        assert(fourTenthOfEther == await web3.eth.getBalance(wallet.address), "contract has send some ether");
    });

    it("non-master cannot send ether using signing", async () => {
        try {
            await signAndExecute(device2, device2, halfEther, '0x', etherRewardAddress, 0);
            assert(false);
        } catch (e) {
            expectRevert(e, "unauthorised account cannot make transfers");
        }
        assert(oneEther == await web3.eth.getBalance(wallet.address), "contract has send some ether");
    });

})