pragma solidity ^0.4.19;

contract ProveX{
    bool public status;
    uint public c;

    struct Proof{
        uint t;
        uint r;
    }

    function resetStatus() public returns(bool){
        status = false;
        return true;
    }

    function setC(uint _c)public returns (bool){
        c = _c;
    }



    function verifyProof(uint _G, uint _g, uint _y, memory Proof _proof) public returns(bool){
        status = (_proof.t == (_g ** _proof.r * _y ** c) % _G );
        return true;
    }


}
