pragma solidity ^0.4.24;

import "./ERC20.sol";

/**
 * @title Personal Wallet - Tenzorum Project https://tenzorum.org
 * @author Radek Ostrowski https://startonchain.com
 */
contract PersonalWallet {

  enum Role {Unauthorised, Master, Action, Recovery}
  mapping(address => Role) public roles;
  mapping(address => uint) public nonces;

  constructor(address masterAccount) public {
    roles[masterAccount] = Role.Master;
  }

  function () payable public { }

  //allows for gasless transactions
  function execute( 
    uint8 _v, bytes32 _r, bytes32 _s,
    address _from, address _to, 
    uint _value, bytes _data, 
    address _rewardType, uint _rewardAmount) public {

      onlyMaster(_from);

      bytes32 hash = keccak256(abi.encodePacked(address(this), _from, _to, _value, _data, 
        _rewardType, _rewardAmount, nonces[_from]++));

      //make sure it was signed correctly by the user
      require(ecrecover(
        keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)), _v, _r, _s) == _from);

      if(_rewardAmount > 0) {
        if(_rewardType == address(0)){
            //pay fee with ether
            require(msg.sender.call.value(_rewardAmount)());
          } else {
            //pay fee with tokens
            require((ERC20(_rewardType)).transfer(msg.sender, _rewardAmount));
          }
      }
    
      //execute the transaction
      require(_to.call.value(_value)(_data));
  }

  function onlyMaster(address account) internal {
    require(roles[account] == Role.Master);
  }

}