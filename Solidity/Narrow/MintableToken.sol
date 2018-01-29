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

contract ERC20Interface {
    function totalSupply() public constant returns (uint);
    function balanceOf(address _tokenOwner) public constant returns (uint balance);
    function allowance(address _tokenOwner, address _spender) public constant returns (uint remaining);
    function transfer(address _to, uint _amount) public returns (bool success);
    function approve(address _spender, uint _amount) public returns (bool success);
    function transferFrom(address _from, address _to, uint _amount) public returns (bool success);
 
    event Transfer(address indexed _from, address indexed _to, uint _amount);
    event Approval(address indexed _tokenOwner, address indexed _spender, uint _amount);
}

contract TokenRecipient {
    function tokenFallback(address _sender, uint _amount, bytes _data) public returns (bool);
}

contract MintableToken is ERC20Interface, Owned {
    using SafeMath for uint;

    string public symbol;
    string public name;
    uint8 public decimals;
    uint public supply;

    mapping(address => uint) balances;
    mapping(address => mapping(address => uint)) allowed;

    event Mint(address _to, uint _amount);

    function MintableToken(string _symbol, string _name, uint8 _decimals, uint _supply) public{
        symbol = _symbol;
        name = _name;
        decimals = _decimals;
        supply = _supply;

        balances[owner] = supply;
    }

    function totalSupply() public constant returns (uint){
        return supply; 
    }

    function balanceOf(address _tokenOwner) public constant returns (uint balance){
        return balances[_tokenOwner];
    }

    function transfer(address _to, uint _amount) public returns (bool success){
        balances[msg.sender] = balances[msg.sender].sub(_amount);
        balances[_to] = balances[_to].add(_amount);
        Transfer(msg.sender,_to,_amount);
        return true;
    }

    function approve(address _spender, uint _amount) public returns (bool success){
        allowed[msg.sender][_spender] = _amount;
        Approval(msg.sender,_spender,_amount);
        return true;
    }

    function transferFrom(address _from, address _to, uint _amount) public returns (bool success) {
        balances[_from] = balances[_from].sub(_amount);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_amount);
        balances[_to] = balances[_to].add(_amount);
        Transfer(_from, _to, _amount);
        return true;
    }

    function allowance(address _tokenOwner, address _spender) public constant returns (uint remaining){
        return allowed[_tokenOwner][_spender];
    }

    function transferAndCall(address _to, uint _amount, bytes _data) public returns (bool) {
        transfer(_to, _amount);
        require(TokenRecipient(_to).tokenFallback(msg.sender, _amount, _data));
        return true;
    }
   
    function mint(address _to, uint _amount) onlyOwner public returns (bool success){
        supply = supply.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        Mint(_to, _amount);
        return true;
    }

    function () public payable{
        revert();
    }

}