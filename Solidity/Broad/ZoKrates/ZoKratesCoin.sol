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

contract SenderVerifier{
     function verifyTx(uint[2] a, uint[2] a_p, uint[2][2] b, uint[2] b_p, uint[2] c,uint[2] c_p,uint[2] h,uint[2] k,uint[4] input) public returns (bool r);
}

contract RecieveVerifier{
     function verifyTx(uint[2] a, uint[2] a_p, uint[2][2] b, uint[2] b_p, uint[2] c,uint[2] c_p,uint[2] h,uint[2] k,uint[4] input) public returns (bool r);
}

contract PrivateCoin is Owned {
    using SafeMath for uint;

    struct PrivateTransaction{
        address from;
        address to;
        uint hashedAmount;
    }

    string public symbol;
    string public name;
    uint8 public decimals;

    mapping(address => uint) hashedbalances;

    mapping(address => PrivateTransaction[]) pendingTransactions;

    event Transfer(address indexed _from, address indexed _to, uint _amount);

    function PrivateCoin(string _symbol, string _name, uint8 _decimals) public{
        symbol = _symbol;
        name = _name;
        decimals = _decimals;
        hashedbalances[msg.sender] = 1000;
    }
    
    function getBalanceOf(address _user) public constant returns(uint){
        return hashedbalances[_user];
    }
    
    function getSizePending(address _user) public constant returns (uint){
        return pendingTransactions[_user].length;
    }

    function transfer(address _contract, address _to, uint _hashAmountSend, uint _hashAfter, uint[2] a, uint[2] a_p, uint[2][2] b, uint[2] b_p, uint[2] c, uint[2] c_p, uint[2] h, uint[2] k) public returns (bool){
        uint hashAmountSend = uint(_hashAmountSend);
        uint hashAfter = uint(_hashAfter);
        
        require(SenderVerifier(_contract).verifyTx(a, a_p, b, b_p, c, c_p, h, k, [hashedbalances[msg.sender], hashAmountSend, hashAfter, 1]));
    
        hashedbalances[msg.sender] = _hashAfter;
        
        address to = _to;
        pendingTransactions[to].push(PrivateTransaction(msg.sender, to, hashAmountSend));
        pendingTransactions[to][pendingTransactions[to].length -1].from = msg.sender;
        pendingTransactions[to][pendingTransactions[to].length -1].to = to;
        pendingTransactions[to][pendingTransactions[to].length -1].hashedAmount = hashAmountSend;
    
        return true;
    }
    
    function recieve(address _contract, address _from, uint _hashAfter, uint[2] a, uint[2] a_p, uint[2][2] b, uint[2] b_p, uint[2] c, uint[2] c_p, uint[2] h, uint[2] k) public returns (bool){
        uint hashAfter = uint(_hashAfter);
        for(uint i = 0; i < pendingTransactions[msg.sender].length; i++){
            if(pendingTransactions[msg.sender][i].from == _from){
                require(RecieveVerifier(_contract).verifyTx(a, a_p, b, b_p, c, c_p, h, k, [hashedbalances[msg.sender], pendingTransactions[msg.sender][i].hashedAmount, hashAfter, 1]));
                pendingTransactions[msg.sender][i] = pendingTransactions[msg.sender][pendingTransactions[msg.sender].length -1];
                delete pendingTransactions[msg.sender][pendingTransactions[msg.sender].length - 1];
                hashedbalances[msg.sender] = _hashAfter;
                return true;
            }
        }
        return false;
    }

    function () public payable{
        revert();
    }

}