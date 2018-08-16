pragma solidity ^0.4.24;

import "./ERC20.sol";
import "./Ownable.sol";

/**
 * Tenzorum Project https://tenzorum.org
 * Autor: Radek Ostrowski https://startonchain.com
 */
contract PersonalWallet is Ownable {

  mapping(address => uint) public nonces;

  constructor() public {
    owner = msg.sender;
  }

  function () payable public { }

  //allows for gasless transactions
  function execute( 
    uint8 _v, bytes32 _r, bytes32 _s,
    address _from, address _to, 
    uint _value, bytes _data, 
    address _rewardType, uint _rewardAmount) public {

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

}