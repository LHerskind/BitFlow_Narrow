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
    function balanceOf(address _tokenOwner) public constant returns (uint balance);
	function transfer(address _to, uint _amount) public returns (bool success);
	function transferAndCall(address _to, uint _amount, bytes _data) public returns (bool success);
}

contract DepartmentCreatorInterface{

	function create(string _name, address _treasuryAddress, address _coinAddress) public returns (address);

}


contract Department is Owned{
	struct BudgetElement {
		uint[] dates;
		mapping(uint => uint) amounts;
	}

	string public name;
	address public departmentSupervisor;
	MintableToken public internalCoin;
	address public treasuryAddress;

	address[] public employeeList;
	mapping (address => bool) public employeeMapping;

	address[] public childDepartmentList;
	mapping(address => bool) public childDepartmentMapping;

	address[] public budgetList;
	mapping(address => BudgetElement) budgetMapping;

	event ChildDepartmentCreated(address indexed _childDepartment, address indexed _childDepartmentCreator);
	event ChildDepartmentAdded(address indexed _childDepartment);
	event ChildDepartmentRemoved(address indexed _childDepartment);
	event ChildDepartmentOwnershipTransferred(address indexed _childDepartment, address indexed _newOwner);
	event TransferFundsIntern(address indexed _from, address indexed _to, uint _amount, uint indexed _timeStamp);
	event TransferFundsOut(address indexed _from, address indexed _to, uint _amount, uint indexed _timeStamp);
	event EmployeeHired(address indexed _employee, address indexed _hiredBy);
	event EmployeeFired(address indexed _employee, address indexed _firedBy);
	event NewSupervisor(address indexed _supervisor);
	event NewTreasury(address indexed _treasuryAddress);
	event BudgetChange(address indexed _changer, address indexed _to, uint indexed _time, uint _amount, uint _timeStamp);

	modifier onlyEmployee {
		require(employeeMapping[msg.sender]);
		_;
	}

	modifier onlyCLevel{
		require(msg.sender == departmentSupervisor || msg.sender == owner);
		_;
	}

	function setSupervisor(address _supervisor) onlyOwner public returns (bool){
		departmentSupervisor = _supervisor;
		NewSupervisor(_supervisor);
		return true;
	}

	function setSupervisorChild(address _childDepartment, address _supervisor) onlyCLevel public returns(bool){
		Department(_childDepartment).setSupervisor(_supervisor);
		return true;
	}

	function setTreasuryAddress(address _treasuryAddress) onlyCLevel public returns(bool){
		treasuryAddress = _treasuryAddress;
		NewTreasury(_treasuryAddress);
		return true;
	}
	
	function toBytes(address a) internal pure returns (bytes b){
        assembly {
            let m := mload(0x40)
            mstore(add(m, 20), xor(0x140000000000000000000000000000000000000000, a))
            mstore(0x40, add(m, 52))
            b := m
        }
    }

    function getLiquidity() public constant returns (uint amount){
    	amount = internalCoin.balanceOf(address(this));
		for (uint i = 0; i < childDepartmentList.length; i++){
			amount = amount + Department(childDepartmentList[i]).getLiquidity();
		}
    }

    function getEmployeeCount() public constant returns(uint){
    	return employeeList.length;
    }

    function getChildDepartmentCount() public constant returns(uint){
    	return childDepartmentList.length;
    }

    function getBudgetCount() public constant returns(uint){
    	return budgetList.length;
    }
    
    function getBudgetElementDatesLength(address _to) public constant returns(uint){
		return budgetMapping[_to].dates.length;
	}
	
	function getBudgetElementDate(address _to, uint _index) public constant returns(uint){
	    return budgetMapping[_to].dates[_index];
	}

	function getBudgetElementDateValue(address _to, uint _time) public constant returns(uint){
		return budgetMapping[_to].amounts[_time];
	}


    function createChildDepartment(address _childDepartmentCreator, string _name) onlyCLevel public returns (bool){
    	address _childDepartment = DepartmentCreatorInterface(_childDepartmentCreator).create(_name, treasuryAddress, address(internalCoin));
    	Owned(_childDepartment).acceptOwnership();
		childDepartmentList.push(_childDepartment);
		childDepartmentMapping[_childDepartment] = true;
		ChildDepartmentCreated(_childDepartment, _childDepartmentCreator);
    	return true;
    }

	function addChildDepartment(address _childDepartment) onlyCLevel public returns (bool){	
		require(!childDepartmentMapping[_childDepartment]);
		if(address(Owned(_childDepartment).owner) != address(this)){
			Owned(_childDepartment).acceptOwnership();
		}
		require(address(Owned(_childDepartment).owner) == address(this));
		childDepartmentList.push(_childDepartment);
		childDepartmentMapping[_childDepartment] = true;
		ChildDepartmentAdded(_childDepartment);
		return true;		
	}

	function removeChildDepartment(address _childDepartment) onlyCLevel public returns (bool){
		require(childDepartmentMapping[_childDepartment]);
		childDepartmentMapping[_childDepartment] = false;
		for(uint i = 0; i < childDepartmentList.length; i++){
			if(childDepartmentList[i] == _childDepartment){
				childDepartmentList[i] = childDepartmentList[childDepartmentList.length-1];
				delete childDepartmentList[employeeList.length-1];
				break;
			}
		}
		ChildDepartmentRemoved(_childDepartment);
		return true;
	}

	function transferChildDepartmentOwnership(address _childDepartment, address _newOwner) onlyCLevel public returns (bool){
		Owned(_childDepartment).transferOwnership(_newOwner);
		ChildDepartmentOwnershipTransferred(_childDepartment, _newOwner);
		return true;
	}

	function addEmployee(address _employee) onlyCLevel public returns (bool){
		employeeMapping[_employee] = true;
		employeeList.push(_employee);
		EmployeeHired(_employee, msg.sender);
		return true;
	}

	function removeEmployee(address _employee) onlyCLevel public returns (bool){
		require(employeeMapping[_employee]);
		employeeMapping[_employee] = false;
		for(uint i = 0; i < employeeList.length; i++){
			if(employeeList[i] == _employee){
				employeeList[i] = employeeList[employeeList.length -1];
				delete employeeList[employeeList.length-1];
				break;
			}
		}
		EmployeeFired(_employee, msg.sender);
		return true;
	}
	
	function changeBudget(address _to, uint _time, uint _amount) onlyEmployee public returns (bool){
		require(_amount >= 0);
		uint time = (_time+3600000) / 1000 / 60 / 60 / 24; // To get a different day each budget, at the minimum

		if(budgetMapping[_to].dates.length == 0){
			budgetList.push(_to);
		}

		if(budgetMapping[_to].amounts[time] == 0){
			budgetMapping[_to].dates.push(time);
		}
		budgetMapping[_to].amounts[time] = _amount;
		BudgetChange(msg.sender, _to, time, _amount, now);
		return true;
	}

	function transferFundsIntern(address _to, uint _amount) onlyEmployee public returns (bool){
		internalCoin.transfer(_to,_amount);
		TransferFundsIntern(msg.sender, _to, _amount, now);
		return true;
	}

	function transferFundsOutside(address _to, uint _amount) onlyEmployee public returns (bool){
		internalCoin.transferAndCall(treasuryAddress, _amount, toBytes(_to));
		TransferFundsOut(msg.sender, _to, _amount, now);
		return true;
	}
	
}

contract SimpleDepartmentCreator is DepartmentCreatorInterface{

	function create(string _name, address _treasuryAddress, address _coinAddress) public returns(address){
		SimpleDepartment simpleDepartment = new SimpleDepartment(_name, _treasuryAddress, _coinAddress);
		simpleDepartment.transferOwnership(msg.sender);
		return address(simpleDepartment);
	}

}

contract SimpleDepartment is Department{

	function SimpleDepartment(string _name, address _treasuryAddress, address _coinAddress) public {
		name = _name;
		treasuryAddress = _treasuryAddress;
		internalCoin = MintableToken(_coinAddress);
	}

}

// https://medium.com/@jgm.orinoco/ethereum-smart-service-payment-with-tokens-60894a79f75c
// https://github.com/ethereum/EIPs/issues/677
// https://stackoverflow.com/questions/42230532/getting-the-address-of-a-contract-deployed-by-another-contract