pragma solidity ^0.4.24;

import "./MetaTx.sol";

/**
 * @title Personal Wallet - Tenzorum Project https://tenzorum.org
 * @author Radek Ostrowski https://startonchain.com
 *
 * Inspired by:
 * IDEX: https://etherscan.io/address/0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208#code
 * ERC-1077&1078: https://ethereum-magicians.org/t/erc-1077-and-erc-1078-the-magic-of-executable-signed-messages-to-login-and-do-actions/351
 * MetaTX: https://github.com/austintgriffith/bouncer-proxy
 * BTTS: https://github.com/bokkypoobah/BokkyPooBahsTokenTeleportationServiceSmartContract
 */
contract PersonalWallet is MetaTx {

  modifier authorized () {
    require(msg.sender == address(this) || roles[msg.sender] == Role.Master, "unauthorised");
    _;
  }

  enum Role {Unauthorised, Master, Action, Recovery}
  mapping(address => Role) public roles;

  constructor(address masterAccount) public {
    roles[masterAccount] = Role.Master;
  }

  function () payable public { }

  function addMasterAccount(address account) authorized public {
    roles[account] = Role.Master;
  }

  function addActionAccount(address account) authorized public {
    roles[account] = Role.Master;
  }

  function removeAccount(address account) authorized public {
    roles[account] = Role.Unauthorised;
  }

  function canLogIn(address account) public view returns (bool) {
    return isMasterAccount(account) || isActionAccount(account);
  }

  function isMasterAccount(address account) public view returns (bool) {
    return roles[account] == Role.Master;
  }

  function isActionAccount(address account) public view returns (bool) {
    return roles[account] == Role.Action;
  }

}
