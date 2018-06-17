# BitFlow 
The implementations of this repository is building upon the design proposed in the BitFlow paper[1]
The *Proof-of-Concept* shown here will be showcasing the **GUI** as mentioned by the paper.

To allow proper evaluation of the **GUI**, one have to run a *GETH*-client(or similar) to enable data-extraction. 
We suggest using a private chain for testing purposes. 

## Setup 
To set up the system, one have to do multiple minor setups.

### Setup *coins* and *treasury*
* Initialize two mintable tokens (one to model our cryptocurrency, and one to act as the *real* coin)
  * CDKK should be initialized with `("CryptoDKK", "CDKK", 2, 10000)`
  * BKK should be initialized with `("BitKrone", "BKK", 2, 0)`
* Initialize the *treasury*, then
  * `treasury.setNotOwnedCoin(CDKK.address, {from:<treasury_owner>});`
  * `CDKK.transferOwnerShip(treasury.address, {from:<CDKK_owner>});`
  * `treasury.acceptOwnersiphOfCoin(BKK.address, {from:<treasury_owner>});`
  
#### Testing *coins* and *treasury*
When the *coins* and *treasury* are set up, you can test if the coin allow for transfers and if the treasury handles the exchanging properly.
```
// Test transfer of CDKK
CDKK.balanceOf(<address_user_1>);
CDKK.balanceOf(<address_user_2>);
CDKK.transfer(<address_user_2>, <amount>, {from: <address_user_1});
CDKK.balanceOf(<address_user_1>);
CDKK.balanceOf(<address_user_2>);

// Test exchange and send
CDKK.balanceOf(<address_user_1>);
BKK.balanceOf(<address_user_2>);
CDKK.transferAndCall(treasury.address, <amount>, <address_user_2>, {from:<address_user_1>});
CDKK.balanceOf(<address_user_1>);
BKK.balanceOf(<address_user_2>);
```

### Setup the initial department in a company
The initial creation of a department, has to happen outside the **GUI**. 
Compile and create a new `SimpleDepartment` using the `GETH`-client. 
Then copy the `address` of this `SimpleDepartment` into `departmentAddress` of [main.js](BitFlow_Narrow/js/main.js#L24)


[1]: https://findit.dtu.dk/en/catalog/2434703292 
[2]: https://github.com/Nanochrome/ConfidentialTransactions
