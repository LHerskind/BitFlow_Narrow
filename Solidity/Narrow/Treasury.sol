pragma solidity ^0.4.19;

contract Owned {
    address public owner;
    address public newOwner;

    event OwnershipTransferred(address indexed _from, address indexed _to);
        
    function Owned() public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
 
    function transferOwnership(address _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }

    function acceptOwnership() public {
        require(msg.sender == newOwner);
        owner = newOwner;
        newOwner = address(0);
        OwnershipTransferred(owner, newOwner);
    }
}

contract MintableToken is Owned{
    function totalSupply() public constant returns (uint);
    function balanceOf(address _tokenOwner) public constant returns (uint balance);
    function transfer(address _to, uint _amount) public returns (bool success);
    function approve(address _spender, uint _amount) public returns (bool success);
    function transferFrom(address _from, address _to, uint _amount) public returns (bool success);
    function allowance(address _tokenOwner, address _spender) public constant returns (uint remaining);  
    function mint(address _to, uint _amount) public returns (bool success);
    function transferAndCall(address _to, uint _amount, bytes _data) public returns (bool success);

    event Transfer(address indexed _from, address indexed _to, uint _amount);
    event Approval(address indexed _tokenOwner, address indexed _spender, uint _amount);
    event Mint(address _to, uint _amount);
}

contract Treasury is Owned {

	string public name;
    bool public allowTrades = true;
    uint public price = 100; // owned per 100 notOwned
    MintableToken public ownedCoin;
    MintableToken public notOwnedCoin;

    event PriceChange(uint indexed _old, uint indexed _new);
    event Exchange(address indexed _from, address indexed _to, uint _amount, address indexed _token);

    function Treasury(string _name) public {
        name = _name;
    }

    function changeAllowed() public onlyOwner returns (bool success){
        allowTrades = (!allowTrades);
        return true;
    }

    function setNotOwnedCoin(address _contractAddress) public onlyOwner returns(bool success){
        notOwnedCoin = MintableToken(_contractAddress);
        return true;
    }

    function setOwnedCoin(address _contractAddress) public onlyOwner returns (bool succes){
        ownedCoin = MintableToken(_contractAddress);
        return true;
    }

    function acceptOwnershipOfCoin() public onlyOwner returns (bool success){
        require(address(ownedCoin) != 0);
        ownedCoin.acceptOwnership();
    }

    function returnOwnershipOfOwnedCoin() public onlyOwner returns (bool success){
        require(address(ownedCoin) != 0);
        require(ownedCoin.owner() == address(this));
        ownedCoin.transferOwnership(msg.sender);
        return true;
    }

    function changePrice(uint _newPrice) public onlyOwner returns (bool success){
        uint _old = price;
        price = _newPrice;
        PriceChange(_old, _newPrice);
        return true;
    }

    function tokenFallback(address _sender, uint _amount, bytes _data) public returns (bool success){
        require(allowTrades);
        require(address(notOwnedCoin) != address(0) && address(ownedCoin) != address(0));
        require(msg.sender == address(ownedCoin) || msg.sender == address(notOwnedCoin));

        MintableToken fromCoin = ownedCoin;
        MintableToken toCoin = notOwnedCoin;
        uint amountToSend = (_amount * 100) / price;

        if (msg.sender == address(notOwnedCoin)){
            fromCoin = notOwnedCoin;
            toCoin = ownedCoin;
            amountToSend = (_amount * 100) / price;
            if (amountToSend > ownedCoin.balanceOf(address(this))){
                require(ownedCoin.mint(address(this), (amountToSend -  ownedCoin.balanceOf(address(this)))));
            }
        }

        address _to = _sender;

        if(_data.length > 10){ // ==20
            _to = bytesToAddr(_data);
        }

        toCoin.transfer(_to, amountToSend);
        Exchange(_sender, _to, _amount, msg.sender);
        return true;
    }

    function bytesToAddr (bytes b) internal pure returns (address) {
        uint result = 0;
        for (uint i = b.length-1; i+1 > 0; i--) {
            uint c = uint(b[i]);
            uint to_inc = c * ( 16 ** ((b.length - i-1) * 2));
            result += to_inc;
        }
        return address(result);
    }

}

// https://medium.com/@jgm.orinoco/ethereum-smart-service-payment-with-tokens-60894a79f75c
// https://github.com/ethereum/EIPs/issues/677