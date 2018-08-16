const PersonalWallet = artifacts.require('./PersonalWallet.sol');

module.exports = async function(deployer, network, accounts) {
	deployer.deploy(PersonalWallet)
		.then(function(){
			return PersonalWallet.deployed();
		})
		.then(function(walletInstance){
			console.log("Done!", walletInstance.address);
		});
};