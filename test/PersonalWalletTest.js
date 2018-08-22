const PersonalWallet = artifacts.require('./PersonalWallet.sol');
const TestToken = artifacts.require('./TestToken.sol');

var utils = require('web3-utils');

let wallet;
let token;
let owner;
let master1;
let target;

let oneEther = web3.toWei(1, "ether");
let halfEther = web3.toWei(0.5, "ether");
let tenthOfEther = web3.toWei(0.1, "ether");
let fourTenthOfEther = web3.toWei(0.4, "ether");

let hundredTokens = web3.toWei(100, "ether");
let fiftyTokens = web3.toWei(50, "ether");
let ninetyTokens = web3.toWei(90, "ether");
let tenTokens = web3.toWei(10, "ether");

let etherRewardAddress = '0x0000000000000000000000000000000000000000';
let transferSignature = '0xa9059cbb';

contract('PersonalWalletTest', (accounts) => {

    beforeEach(async () => {
        owner = accounts[0];
        master1 = accounts[1];
        target = accounts[2];

        wallet = await PersonalWallet.new(master1);
        token = await TestToken.new();

        //make sure wallet contract has some ether first
        await web3.eth.sendTransaction({
            from: owner,
            to: wallet.address,
            value: oneEther
        });
        //and some tokens
        await token.mint(wallet.address, hundredTokens);
        //assert(hundredTokens == (await token.balanceOf(wallet.address)).toNumber(), "tokens minted correctly");
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

    function pad(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

    let signAndExecute = async function(from, to, value, data, rewardType, rewardAmount) {
        let nonce = await wallet.nonces.call(from);
        let hash = utils.soliditySha3(wallet.address, from, to, value, data,
            rewardType, rewardAmount, nonce);
        let signedHash = await web3.eth.sign(from, hash);
        let [v, r, s] = getRSV(signedHash);
        await wallet.execute(v, r, s, from, to, value, 
            data, rewardType, rewardAmount, {from: owner});
    }

    let getTransferTokenData = function(to, amount){
        let convertedTo = pad(to.substring(2),64);
        let convertedAmount = pad(utils.toHex(amount).substring(2),64);
        let data = transferSignature + convertedTo + convertedAmount;
        return data;
    } 

    it("send some ether using signing, with zero fee", async () => {
        await signAndExecute(master1, target, halfEther, '0x', etherRewardAddress, 0);
        assert(halfEther == await web3.eth.getBalance(wallet.address), "contract has send some ether");
    });

    it("send some ether using signing, take some ether as fee", async () => {
        await signAndExecute(master1, target, halfEther, '0x', etherRewardAddress, tenthOfEther);
        assert(fourTenthOfEther == await web3.eth.getBalance(wallet.address), "contract has send some ether");
    });

    it("non-master cannot send ether using signing", async () => {
        try {
            await signAndExecute(target, target, halfEther, '0x', etherRewardAddress, 0);
            assert(false);
        } catch (e) {
            expectRevert(e, "unauthorised account cannot make transfers");
        }
        assert(oneEther == await web3.eth.getBalance(wallet.address), "contract has not send any ether");
    });

    it("send some tokens using signing, with zero fee", async () => {
        let data = getTransferTokenData(target, fiftyTokens);
        await signAndExecute(master1, token.address, 0, data, token.address, 0);
        assert(fiftyTokens == (await token.balanceOf(wallet.address)).toNumber(), "contract has send the tokens");
        assert(fiftyTokens == (await token.balanceOf(target)).toNumber(), "target has received the tokens");
    });

    it("send some tokens using signing, with fee in tokens", async () => {
        let data = getTransferTokenData(target, ninetyTokens);
        await signAndExecute(master1, token.address, 0, data, token.address, tenTokens);
        assert(0 == (await token.balanceOf(wallet.address)).toNumber(), "contract has send the tokens");
        assert(ninetyTokens == (await token.balanceOf(target)).toNumber(), "target has received the tokens");
    });

    it("non-master cannot send tokens using signing", async () => {
        let data = getTransferTokenData(target, ninetyTokens);
        try {
            await signAndExecute(target, target, 0, data, token.address, 0);
            assert(false);
        } catch (e) {
            expectRevert(e, "unauthorised account cannot make transfers");
        }
        assert(hundredTokens == (await token.balanceOf(wallet.address)).toNumber(), "contract has all the tokens");
    });
})