# Tenzorum Personal Wallet Smart Contracts

The core function `execute` accepts signed messages from relayers that act on wallet owner's behalf and pay the gas for the transaction.
This allows anyone to request transactions even from addresses with no ether or tokens. The optional fee to the relayers can be paid out 
from the personal wallet in ether or tokens.

```
function execute(
    uint8 _v, bytes32 _r, bytes32 _s,
    address _from, address _to,
    uint _value, bytes _data,
    address _rewardType, uint _rewardAmount)
```

where:

_v, _r, _s - components of the signature of the message
_from - source address that signed the message
_to - target address if sending ether, or token contract address for token transfer
_value - amount of ether to send
_data - function payload like token transfer data or any other function call
_rewardType - address(0) for ether, and token contract address for tokens payable as fee
_rewardAmount - how much of ether/token should be paid as the fee
