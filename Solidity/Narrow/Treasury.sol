pragma solidity ^0.4.19;

library SafeMath {
    function add(uint a, uint b) internal pure returns (uint c) {
        c = a + b;
        require(c >= a);
     }
    function sub(uint a, uint b) internal pure returns (uint c) {
        require(b <= a);
            c = a - b;
    }
    function mul(uint a, uint b) internal pure returns (uint c) {
        c = a * b;
        require(a == 0 || c / a == b);
    }
    function div(uint a, uint b) internal pure returns (uint c) {
        require(b > 0);
        c = a / b;
    }
}

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
    using SafeMath for uint;

    bool public allowTrades = true;
    uint public price = 100; // notOwned per 100 Owned
    MintableToken public ownedCoin;
    MintableToken public notOwnedCoin;

    event PriceChange(uint indexed _old, uint indexed _new);
    event Exchange(address indexed _from, address indexed _to, uint _amount, address indexed _token);

    function Treasury() public {
    }

    function changeAllowed() public onlyOwner returns (bool success){
        allowTrades = (!allowTrades);
        return true;
    }

    function setNotOwnedCoin(address _contractAddress) public onlyOwner returns(bool success){
        notOwnedCoin = MintableToken(_contractAddress);
        return true;
    }

    function acceptOwnershipOfCoin(address _contractAddress) public onlyOwner returns (bool success){
        require(_contractAddress != 0);
        ownedCoin = MintableToken(_contractAddress);
        ownedCoin.acceptOwnership();
        return true;
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
        uint amountToSend = (_amount.mul(price)).div(100);

        if (msg.sender == address(notOwnedCoin)){
            fromCoin = notOwnedCoin;
            toCoin = ownedCoin;
            amountToSend = (_amount.mul(100)).div(price);
            if (amountToSend > ownedCoin.balanceOf(address(this))){
                require(ownedCoin.mint(address(this), (amountToSend.sub(ownedCoin.balanceOf(address(this))))));
            }
        }

        address _to = _sender;

        if(_data.length == 20){ // ==20
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
